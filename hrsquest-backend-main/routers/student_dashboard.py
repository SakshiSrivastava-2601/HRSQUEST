from fastapi import APIRouter, Depends, HTTPException, status
from properties.helper_psql import get_db_handler, AsyncDBHandler
from properties.log import app_logger
from schema import StudentSelfUpdateSchema
from utils.authz import get_current_student


router = APIRouter(tags=["Student Dashboard"])


@router.get("/student/info")
async def get_student_info(
    db_handler: AsyncDBHandler = Depends(get_db_handler),
    user_info = Depends(get_current_student),
):
    """
    Get Student Information
    """
    student_id = user_info.get("student_id")
    if not student_id:
        app_logger.error(f"Student Id not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student Not Found.",
        )
    
    app_logger.info(f"Getting Student Information for student Id: {student_id}")

    try:
        query = """SELECT s.student_id, s.student_name, \
                    s.email, s.is_email_verified, s.phone_number, s.is_phone_verified,\
                    s.grade_level, s.current_grade_level
                FROM students s
                WHERE (s.student_id = $1) AND (s.is_deleted = false)
            """

        user_info = await db_handler.fetch_one_row(query, student_id)
        return user_info

    except ValueError as e:
        # Catches the specific UniqueViolationError handled in insert_and_get_id
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        # Catches unexpected errors (e.g., severe connection failure)
        app_logger.error(f"Unhandled error during student info: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during student info.",
        )


@router.get("/student/summary")
async def get_student_summary(
    db_handler: AsyncDBHandler = Depends(get_db_handler),
    user_info=Depends(get_current_student),
):
    student_id = user_info.get("student_id")
    if not student_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student Not Found.",
        )

    try:
        summary = await db_handler.fetch_one_row(
            """
            SELECT
                COUNT(DISTINCT ta.test_id) FILTER (WHERE ta.is_submitted = TRUE) AS total_tests,
                COUNT(*) FILTER (WHERE ta.is_submitted = TRUE) AS total_attempts,
                COALESCE(ROUND(AVG(ta.final_score) FILTER (WHERE ta.is_submitted = TRUE), 2), 0) AS average_score,
                COUNT(DISTINCT mt.subject_id) FILTER (WHERE ta.is_submitted = TRUE) AS completed_subjects
            FROM test_attempts ta
            JOIN mcq_tests mt ON mt.test_id = ta.test_id
            WHERE ta.student_id = $1
            """,
            student_id,
        )
        return summary or {
            "total_tests": 0,
            "total_attempts": 0,
            "average_score": 0,
            "completed_subjects": 0,
        }
    except Exception as e:
        app_logger.error(f"Unhandled error during student summary: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during student summary.",
        )


@router.put("/student/info")
async def update_student_info(
    payload: StudentSelfUpdateSchema,
    db_handler: AsyncDBHandler = Depends(get_db_handler),
    user_info=Depends(get_current_student),
):
    student_id = user_info.get("student_id")
    if not student_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student Not Found.",
        )

    try:
        fields = []
        args = []
        idx = 1

        if payload.student_name is not None:
            fields.append(f"student_name = ${idx}")
            args.append(payload.student_name.strip())
            idx += 1
        if payload.email is not None:
            fields.append(f"email = ${idx}")
            args.append(str(payload.email).strip().lower())
            idx += 1
        if payload.phone_number is not None:
            fields.append(f"phone_number = ${idx}")
            args.append(payload.phone_number.strip())
            idx += 1

        if not fields:
            raise HTTPException(status_code=400, detail="No fields provided for update.")

        args.append(int(student_id))
        await db_handler.execute_command(
            f"""
            UPDATE students
            SET {', '.join(fields)}, updated_at = NOW()
            WHERE student_id = ${idx} AND is_deleted = false
            """,
            *args,
        )

        updated = await db_handler.fetch_one_row(
            """
            SELECT s.student_id, s.student_name,
                   s.email, s.is_email_verified, s.phone_number, s.is_phone_verified,
                   s.grade_level, s.current_grade_level
            FROM students s
            WHERE s.student_id = $1 AND s.is_deleted = false
            """,
            int(student_id),
        )
        return updated
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        app_logger.error(f"Unhandled error during student update: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during student update.",
        )
