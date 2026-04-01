import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from properties.helper_psql import AsyncDBHandler, get_db_handler
from utils.authz import get_current_student
from utils.lms_service import update_course_access
from utils.razorpay_gateway import (
    create_order,
    get_public_key_id,
    verify_payment_signature,
    verify_webhook_signature,
)


router = APIRouter(prefix="/payments/razorpay", tags=["Payments Razorpay"])


async def _get_course_price_paise(db_handler: AsyncDBHandler, course_id: int) -> int:
    course = await db_handler.fetch_one(
        """
        SELECT course_id, price, is_published, is_active
        FROM courses
        WHERE course_id = $1
        """,
        course_id,
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")
    if not course.get("is_published") or not course.get("is_active"):
        raise HTTPException(status_code=400, detail="Course is not available for purchase.")
    price = float(course.get("price") or 0)
    return int(round(price * 100))


@router.post("/order")
async def create_razorpay_order(
    course_id: int,
    current_user: dict = Depends(get_current_student),
    db_handler: AsyncDBHandler = Depends(get_db_handler),
):
    student_id = int(current_user["student_id"])
    amount_paise = await _get_course_price_paise(db_handler, int(course_id))

    if amount_paise <= 0:
        # Free course: unlock immediately
        return await update_course_access(
            student_id=student_id,
            course_id=int(course_id),
            payment_status="paid",
            actor_id=None,
        )

    order = create_order(
        amount_paise=amount_paise,
        currency="INR",
        receipt=f"course_{course_id}_student_{student_id}",
        notes={"student_id": student_id, "course_id": int(course_id)},
    )

    provider_order_id = order.get("id")
    if not provider_order_id:
        raise HTTPException(status_code=502, detail="Razorpay order id missing in response.")

    await db_handler.execute_command(
        """
        INSERT INTO payments
            (provider, student_id, course_id, provider_order_id, amount_paise, currency, status)
        VALUES
            ('razorpay', $1, $2, $3, $4, 'INR', 'created')
        ON CONFLICT (provider_order_id)
        DO UPDATE SET updated_at = NOW()
        """,
        student_id,
        int(course_id),
        str(provider_order_id),
        amount_paise,
    )

    return {
        "key_id": get_public_key_id(),
        "order_id": provider_order_id,
        "amount": amount_paise,
        "currency": "INR",
        "course_id": int(course_id),
        "student_id": student_id,
    }


@router.post("/verify")
async def verify_razorpay_payment(
    course_id: int,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    current_user: dict = Depends(get_current_student),
    db_handler: AsyncDBHandler = Depends(get_db_handler),
):
    student_id = int(current_user["student_id"])

    if not verify_payment_signature(
        order_id=razorpay_order_id,
        payment_id=razorpay_payment_id,
        signature=razorpay_signature,
    ):
        raise HTTPException(status_code=400, detail="Invalid payment signature.")

    await db_handler.execute_command(
        """
        UPDATE payments
        SET
            provider_payment_id = $1,
            provider_signature = $2,
            status = 'paid',
            updated_at = NOW()
        WHERE provider_order_id = $3 AND student_id = $4 AND course_id = $5
        """,
        razorpay_payment_id,
        razorpay_signature,
        razorpay_order_id,
        student_id,
        int(course_id),
    )

    return await update_course_access(
        student_id=student_id,
        course_id=int(course_id),
        payment_status="paid",
        actor_id=None,
    )


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None),
    db_handler: AsyncDBHandler = Depends(get_db_handler),
):
    body = await request.body()
    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing X-Razorpay-Signature header.")

    if not verify_webhook_signature(payload_body=body, signature=x_razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature.")

    payload = json.loads(body.decode("utf-8"))
    event = payload.get("event") or ""

    # Minimal handling: for payment.captured events, unlock student-course if we can infer ids from notes
    if event == "payment.captured":
        entity = (((payload.get("payload") or {}).get("payment") or {}).get("entity") or {})
        order_id = entity.get("order_id")
        payment_id = entity.get("id")
        notes = entity.get("notes") or {}
        student_id = notes.get("student_id")
        course_id = notes.get("course_id")

        if order_id and payment_id and student_id and course_id:
            await db_handler.execute_command(
                """
                UPDATE payments
                SET provider_payment_id = $1, status = 'paid', updated_at = NOW()
                WHERE provider_order_id = $2
                """,
                str(payment_id),
                str(order_id),
            )

            await update_course_access(
                student_id=int(student_id),
                course_id=int(course_id),
                payment_status="paid",
                actor_id=None,
            )

    return {"status": "ok", "received_at": datetime.now(timezone.utc).isoformat()}
