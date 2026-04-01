import base64
import hashlib
import hmac
import json
import os
import urllib.request
from typing import Any, Dict, Optional

from fastapi import HTTPException, status
from properties import config as app_config


RAZORPAY_API_BASE = "https://api.razorpay.com/v1"


def _get_key_id() -> str:
    key_id = os.getenv("RAZORPAY_KEY_ID", "").strip() or getattr(app_config, "RAZORPAY_KEY_ID", "").strip()
    if not key_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Razorpay is not configured. Missing RAZORPAY_KEY_ID.",
        )
    return key_id


def _get_key_secret() -> str:
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "").strip() or getattr(app_config, "RAZORPAY_KEY_SECRET", "").strip()
    if not key_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Razorpay is not configured. Missing RAZORPAY_KEY_SECRET.",
        )
    return key_secret


def get_public_key_id() -> str:
    return _get_key_id()


def create_order(
    *,
    amount_paise: int,
    currency: str = "INR",
    receipt: Optional[str] = None,
    notes: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    key_id = _get_key_id()
    key_secret = _get_key_secret()

    if amount_paise <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than 0.",
        )

    payload: Dict[str, Any] = {"amount": int(amount_paise), "currency": currency}
    if receipt:
        payload["receipt"] = receipt
    if notes:
        payload["notes"] = notes

    auth = base64.b64encode(f"{key_id}:{key_secret}".encode("utf-8")).decode("ascii")
    request = urllib.request.Request(
        f"{RAZORPAY_API_BASE}/orders",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Basic {auth}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            body = response.read().decode("utf-8")
            return json.loads(body)
    except urllib.error.HTTPError as exc:
        try:
            details = exc.read().decode("utf-8")
        except Exception:
            details = "Unable to read Razorpay error response."
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Razorpay order creation failed: {details}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Razorpay order creation failed: {exc}",
        )


def verify_payment_signature(*, order_id: str, payment_id: str, signature: str) -> bool:
    key_secret = _get_key_secret()
    msg = f"{order_id}|{payment_id}".encode("utf-8")
    expected = hmac.new(key_secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_webhook_signature(*, payload_body: bytes, signature: str) -> bool:
    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "").strip() or getattr(app_config, "RAZORPAY_WEBHOOK_SECRET", "").strip()
    if not webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Razorpay webhook is not configured. Missing RAZORPAY_WEBHOOK_SECRET.",
        )
    expected = hmac.new(webhook_secret.encode("utf-8"), payload_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
