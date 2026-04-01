from fastapi import APIRouter, Depends, HTTPException

from properties.helper_psql import AsyncDBHandler, get_db_handler
from routers.user_registration import hash_password
from schema import (
    AdminCourseCreateSchema,
    AdminStudentUpdateSchema,
    AdminTeacherCreateSchema,
    AdminTeacherResetPasswordSchema,
    AdminTeacherUpdateSchema,
    AssignTeacherSchema,
    UpdateCourseAccessSchema,
)
from utils.authz import get_current_superadmin
from utils.lms_service import assign_teacher_to_course, create_admin_course, list_all_users, update_course_access


router = APIRouter(prefix="/admin", tags=["Admin LMS"])


@router.get("/users")
async def get_all_users(_current_user: dict = Depends(get_current_superadmin)):
    return await list_all_users()


@router.post("/teachers")
async def create_teacher_via_admin(
    payload: AdminTeacherCreateSchema,
    current_user: dict = Depends(get_current_superadmin),
    db_handler: AsyncDBHandler = Depends(get_db_handler),
):
    # Never store plaintext in DB. We only return it once to the superadmin.
    password = payload.password
    generated = False
    if (payload.generate_password is True) or not password:
        alphabet = string.ascii_letters + string.digits
        # Friendly but strong temp password
        password = "T@" + "".join(secrets.choice(alphabet) for _ in range(10))
        generated = True

    try:
        teacher_id = await db_handler.insert_and_get_id(
            table_name="teachers",
            data={
                "teacher_name": payload.teacher_name,
                "username": payload.username,
                "hashed_password": hash_password(password),
                "role": "teacher",
            },
            id_column="teacher_id",
        )
    except ValueError:
        raise HTTPException(status_code=409, detail="User Already Exists")

    # Assign subjects (if provided)
    if payload.subject_ids:
        for sid in payload.subject_ids:
            await db_handler.execute_command(
                """
                INSERT INTO teacher_subjects(teacher_id, subject_id)
                VALUES ($1, $2)
                ON CONFLICT (teacher_id, subject_id) DO NOTHING
                """,
                int(teacher_id),
                int(sid),
            )
    return {
        "message": "Teacher successfully registered.",
        "teacher_id": teacher_id,
        "username": payload.username,
        "created_by": current_user.get("teacher_id"),
        "temporary_password": password,
        "password_generated": generated,
        "subject_ids": payload.subject_ids or [],
    }


@router.put("/teachers/{teacher_id}")
async def update_teacher_via_admin(
    teacher_id: int,
    payload: AdminTeacherUpdateSchema,
    _current_user: dict = Depends(get_current_superadmin),
    db_handler: AsyncDBHandler = Depends(get_db_handler),
):
    # Prevent accidental demotion of the bootstrap superadmin
    if int(teacher_id) == 1 and payload.role and payload.role != "superadmin":
        raise HTTPException(status_code=400, detail="Default SuperAdmin role cannot be changed.")

    fields = []
    args = []
    idx = 1

    if payload.teacher_name is not None:
        fields.append(f"teacher_name = ${idx}")
        args.append(payload.teacher_name)
        idx += 1
    if payload.username is not None:
        fields.append(f"username = ${idx}")
        args.append(payload.username)
        idx += 1
    if payload.role is not None:
        fields.append(f"role = ${idx}")
        args.append(payload.role)
        idx += 1

    if fields:
        fields.append("updated_at = NOW()")
        try:
            updated = await db_handler.execute_command(
                f"""
                UPDATE teachers
                SET {', '.join(fields)}
                WHERE teacher_id = ${idx} AND is_deleted = FALSE
                """,
                *args,
                int(teacher_id),
            )
        except Exception as exc:
            # Covers unique violations etc, without leaking internals
            raise HTTPException(status_code=400, detail=f"Unable to update teacher: {exc}")

        if str(updated).endswith("0"):
            raise HTTPException(status_code=404, detail="Teacher not found.")

    # Subject mapping replace (optional)
    if payload.subject_ids is not None:
        await db_handler.execute_command("DELETE FROM teacher_subjects WHERE teacher_id = $1", int(teacher_id))
        for sid in payload.subject_ids:
            await db_handler.execute_command(
                """
                INSERT INTO teacher_subjects(teacher_id, subject_id)
                VALUES ($1, $2)
                ON CONFLICT (teacher_id, subject_id) DO NOTHING
                """,
                int(teacher_id),
                int(sid),
            )

    return {"message": "Teacher updated", "teacher_id": int(teacher_id)}


@router.delete("/teachers/{teacher_id}")
async def delete_teacher_via_admin(
    teacher_id: int,
    _current_user: dict = Depends(get_current_superadmin),
    db_handler: AsyncDBHandler = Depends(get_db_handler),
):
    if int(teacher_id) == 1:
        raise HTTPException(status_code=400, detail="Default SuperAdmin cannot be deleted.")

    updated = await db_handler.execute_command(
        """
        UPDATE teachers
        SET is_deleted = TRUE, updated_at = NOW()
        WHERE teacher_id = $1 AND is_deleted = FALSE
        """,
        int(teacher_id),
    )
    if str(updated).endswith("0"):
        raise HTTPException(status_code=404, detail="Teacher not found.")

    # Clean up subject mappings; keep historical data elsewhere intact.
    await db_handler.execute_command("DELETE FROM teacher_subjects WHERE teacher_id = $1", int(teacher_id))

    # Disable teacher courses to avoid orphaned purchases/content access.
    await db_handler.execute_command(
        """
        UPDATE courses
        SET is_active = FALSE, updated_at = NOW()
        WHERE teacher_id = $1
        """,
        int(teacher_id),
    )
    return {"message": "Teacher deleted", "teacher_id": int(teacher_id)}


@router.put("/students/{student_id}")
async def update_student_via_admin(
    student_id: int,
    payload: AdminStudentUpdateSchema,
    _current_user: dict = Depends(get_current_superadmin),
    db_handler: AsyncDBHandler = Depends(get_db_handler),
):
    fields = []
    args = []
    idx = 1
    if payload.student_name is not None:
        fields.append(f"student_name = ${idx}")
        args.append(payload.student_name)
        idx += 1
    if payload.email is not None:
        fields.append(f"email = ${idx}")
        args.append(str(payload.email))
        idx += 1
    if payload.phone_number is not None:
        fields.append(f"phone_number = ${idx}")
        args.append(payload.phone_number)
        idx += 1
    if payload.grade_level is not None:
        fields.append(f"grade_level = ${idx}")
        args.append(int(payload.grade_level))
        idx += 1
        fields.append(f"current_grade_level = ${idx}")
        args.append(int(payload.grade_level))
        idx += 1

    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update.")

    fields.append("updated_at = NOW()")
    try:
        updated = await db_handler.execute_command(
            f"""
            UPDATE students
            SET {', '.join(fields)}
            WHERE student_id = ${idx} AND is_deleted = FALSE
            """,
            *args,
            int(student_id),
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to update student: {exc}")

    if str(updated).endswith("0"):
        raise HTTPException(status_code=404, detail="Student not found.")
    return {"message": "Student updated", "student_id": int(student_id)}


@router.delete("/students/{student_id}")
async def delete_student_via_admin(
    student_id: int,
    _current_user: dict = Depends(get_current_superadmin),
    db_handler: AsyncDBHandler = Depends(get_db_handler),
):
    updated = await db_handler.execute_command(
        """
        UPDATE students
        SET is_deleted = TRUE, updated_at = NOW()
        WHERE student_id = $1 AND is_deleted = FALSE
        """,
        int(student_id),
    )
    if str(updated).endswith("0"):
        raise HTTPException(status_code=404, detail="Student not found.")
    return {"message": "Student deleted", "student_id": int(student_id)}


@router.put("/teachers/{teacher_id}/subjects")
async def set_teacher_subjects(
    teacher_id: int,
    payload: dict,
    _current_user: dict = Depends(get_current_superadmin),
    db_handler: AsyncDBHandler = Depends(get_db_handler),
):
    subject_ids = payload.get("subject_ids") or []
    subject_ids = [int(x) for x in subject_ids if int(x) > 0]

    # Replace mapping: delete missing, insert new.
    await db_handler.execute_command(
        "DELETE FROM teacher_subjects WHERE teacher_id = $1",
        int(teacher_id),
    )
    for sid in subject_ids:
        await db_handler.execute_command(
            """
            INSERT INTO teacher_subjects(teacher_id, subject_id)
            VALUES ($1, $2)
            ON CONFLICT (teacher_id, subject_id) DO NOTHING
            """,
            int(teacher_id),
            int(sid),
        )
    return {"teacher_id": int(teacher_id), "subject_ids": subject_ids}


@router.post("/teachers/{teacher_id}/reset-password")
async def reset_teacher_password(
    teacher_id: int,
    payload: AdminTeacherResetPasswordSchema,
    _current_user: dict = Depends(get_current_superadmin),
    db_handler: AsyncDBHandler = Depends(get_db_handler),
):
    password = payload.password
    updated = await db_handler.execute_command(
        """
        UPDATE teachers
        SET hashed_password = $1, updated_at = NOW()
        WHERE teacher_id = $2 AND is_deleted = FALSE
        """,
        hash_password(password),
        int(teacher_id),
    )
    if str(updated).endswith("0"):
        raise HTTPException(status_code=404, detail="Teacher not found.")
    return {"teacher_id": int(teacher_id), "temporary_password": password}


@router.get("/reports/teachers")
async def report_teachers(_current_user: dict = Depends(get_current_superadmin), db_handler: AsyncDBHandler = Depends(get_db_handler)):
    return await db_handler.fetch_all_rows(
        """
        SELECT
            t.teacher_id,
            t.teacher_name,
            t.username,
            t.role,
            t.created_at::text AS created_at,
            (SELECT COUNT(1) FROM courses c WHERE c.teacher_id = t.teacher_id) AS course_count,
            CASE
                WHEN LOWER(t.role) = 'superadmin' THEN COALESCE(
                    (
                        SELECT array_agg(all_subjects.subject_name ORDER BY all_subjects.subject_name)
                        FROM subjects all_subjects
                    ),
                    '{}'
                )
                ELSE COALESCE(
                    array_agg(DISTINCT s.subject_name) FILTER (WHERE s.subject_name IS NOT NULL),
                    '{}'
                )
            END AS subjects
        FROM teachers t
        LEFT JOIN teacher_subjects ts ON ts.teacher_id = t.teacher_id
        LEFT JOIN subjects s ON s.subject_id = ts.subject_id
        WHERE t.is_deleted = FALSE
        GROUP BY t.teacher_id
        ORDER BY t.created_at DESC
        """
    )


@router.get("/reports/students")
async def report_students(_current_user: dict = Depends(get_current_superadmin), db_handler: AsyncDBHandler = Depends(get_db_handler)):
    return await db_handler.fetch_all_rows(
        """
        SELECT
            s.student_id,
            s.student_name,
            s.email,
            s.phone_number,
            s.grade_level,
            s.created_at::text AS created_at,
            COALESCE(SUM(CASE WHEN sca.payment_status = 'paid' THEN 1 ELSE 0 END), 0) AS unlocked_courses,
            COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount_paise ELSE 0 END), 0) AS total_paid_paise,
            MAX(p.updated_at)::text AS last_payment_at
        FROM students s
        LEFT JOIN student_course_access sca
          ON sca.student_id = s.student_id
        LEFT JOIN payments p
          ON p.student_id = s.student_id AND p.course_id = sca.course_id AND p.status = 'paid'
        WHERE s.is_deleted = FALSE
        GROUP BY s.student_id
        ORDER BY s.created_at DESC
        """
    )


@router.get("/reports/purchases")
async def report_purchases(
    _current_user: dict = Depends(get_current_superadmin),
    db_handler: AsyncDBHandler = Depends(get_db_handler),
):
    return await db_handler.fetch_all_rows(
        """
        SELECT
            sca.student_id,
            s.student_name,
            s.email,
            sca.course_id,
            c.title AS course_title,
            c.price,
            sca.payment_status,
            sca.unlocked_at::text AS unlocked_at,
            c.teacher_id,
            t.teacher_name,
            p.provider,
            p.provider_order_id,
            p.provider_payment_id,
            p.amount_paise,
            p.status AS payment_provider_status,
            p.updated_at::text AS payment_updated_at
        FROM student_course_access sca
        JOIN students s ON s.student_id = sca.student_id
        JOIN courses c ON c.course_id = sca.course_id
        JOIN teachers t ON t.teacher_id = c.teacher_id
        LEFT JOIN LATERAL (
            SELECT *
            FROM payments p2
            WHERE p2.student_id = sca.student_id AND p2.course_id = sca.course_id
            ORDER BY p2.updated_at DESC
            LIMIT 1
        ) p ON TRUE
        ORDER BY COALESCE(sca.unlocked_at, sca.updated_at) DESC NULLS LAST
        """
    )


@router.post("/courses")
async def create_course_via_admin(
    payload: AdminCourseCreateSchema,
    _current_user: dict = Depends(get_current_superadmin),
):
    return await create_admin_course(payload)


@router.put("/courses/{course_id}/assign-teacher")
async def assign_course_teacher(
    course_id: int,
    payload: AssignTeacherSchema,
    _current_user: dict = Depends(get_current_superadmin),
):
    return await assign_teacher_to_course(course_id=course_id, teacher_id=payload.teacher_id)


@router.post("/course-access")
async def set_course_access(
    payload: UpdateCourseAccessSchema,
    current_user: dict = Depends(get_current_superadmin),
):
    return await update_course_access(
        student_id=payload.student_id,
        course_id=payload.course_id,
        payment_status=payload.payment_status,
        actor_id=current_user.get("teacher_id"),
    )
