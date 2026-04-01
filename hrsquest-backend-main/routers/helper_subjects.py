from fastapi import APIRouter, Depends, HTTPException, status
from properties.helper_psql import get_db_handler, AsyncDBHandler
from properties.log import app_logger
from utils.authz import ROLE_STUDENT, ROLE_SUPERADMIN, ROLE_TEACHER, get_current_superadmin, get_current_teacher, require_roles
from utils.teacher_subjects import list_teacher_subject_ids


router = APIRouter(tags=["Subjects Dashboard"])


@router.get("/subjects/info")
async def get_subjects_info(
    db_handler: AsyncDBHandler = Depends(get_db_handler),
    user_info=Depends(require_roles(ROLE_SUPERADMIN, ROLE_TEACHER, ROLE_STUDENT)),
):
    """
    Get Subjects Information
    """

    try:
        role = str(user_info.get("role", "")).lower()
        if role == ROLE_TEACHER:
            teacher_id = int(user_info.get("teacher_id") or 0)
            subject_ids = await list_teacher_subject_ids(teacher_id=teacher_id)
            if not subject_ids:
                return []
            query = """
                SELECT s.subject_id, s.subject_name
                FROM subjects s
                WHERE s.subject_id = ANY($1::int[])
                ORDER BY s.subject_name
            """
            subject_info = await db_handler.fetch_all_rows(query, subject_ids)
        else:
            query = """SELECT s.subject_id, s.subject_name
                    FROM subjects s
                    ORDER BY s.subject_name
                """
            subject_info = await db_handler.fetch_all_rows(query)
        return subject_info

    except ValueError as e:
        # Catches the specific UniqueViolationError handled in insert_and_get_id
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        # Catches unexpected errors (e.g., severe connection failure)
        app_logger.error(f"Unhandled error during subjects info: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during subjects info.",
        )


@router.get("/subjects/create")
async def create_subject(
    subject_name: str,
    db_handler: AsyncDBHandler = Depends(get_db_handler),
    _user_info=Depends(get_current_superadmin),
):
    """
    Create Subject
    """
    try:
        data = {"subject_name": subject_name.upper()}
        subject_id = await db_handler.insert_and_get_id(
            table_name="subjects", data=data, id_column="subject_id"
        )
        return subject_id

    except ValueError as e:
        # Catches the specific UniqueViolationError handled in insert_and_get_id
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        # Catches unexpected errors (e.g., severe connection failure)
        app_logger.error(f"Unhandled error during subjects creation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during subject Creation.",
        )


@router.put("/subjects/update")
async def update_subject(
    subject_id: str,
    subject_name: str,
    db_handler: AsyncDBHandler = Depends(get_db_handler),
    _user_info=Depends(get_current_superadmin),
):
    """
    Update Subject Name
    """
    try:
        result = await db_handler.execute_command(
            """UPDATE subjects
                    SET subject_name = $1, updated_at = NOW()
                    WHERE subject_id = $2
                """,
            subject_name.upper(),
            int(subject_id),
        )
        rows_affected = int(result.split(" ")[-1])
        app_logger.info(f"Rows Affected in Update Subject for Subject Id {subject_id} - {rows_affected}")
        return "success"

    except ValueError as e:
        # Catches the specific UniqueViolationError handled in insert_and_get_id
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        # Catches unexpected errors (e.g., severe connection failure)
        app_logger.error(f"Unhandled error during Subject Update: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during Subject Update.",
        )


@router.delete("/subjects/delete")
async def delete_subject(
    subject_id: str,
    db_handler: AsyncDBHandler = Depends(get_db_handler),
    _user_info=Depends(get_current_superadmin),
):
    """
    Delete Subject when it is not linked to any teacher, test, question, or course.
    """
    try:
        subject_id_int = int(subject_id)
        dependency_counts = await db_handler.fetch_one_row(
            """
            SELECT
                (SELECT COUNT(*) FROM teacher_subjects WHERE subject_id = $1) AS teacher_links,
                (SELECT COUNT(*) FROM mcq_questions WHERE subject_id = $1) AS question_links,
                (SELECT COUNT(*) FROM mcq_tests WHERE subject_id = $1 AND COALESCE(is_deleted, FALSE) = FALSE) AS test_links,
                (SELECT COUNT(*) FROM courses WHERE subject_id = $1) AS course_links
            """,
            subject_id_int,
        )

        teacher_links = int((dependency_counts or {}).get("teacher_links") or 0)
        question_links = int((dependency_counts or {}).get("question_links") or 0)
        test_links = int((dependency_counts or {}).get("test_links") or 0)
        course_links = int((dependency_counts or {}).get("course_links") or 0)

        if teacher_links or question_links or test_links or course_links:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Subject cannot be deleted because it is already linked to "
                    "teachers, questions, tests, or courses."
                ),
            )

        result = await db_handler.execute_command(
            """
            DELETE FROM subjects
            WHERE subject_id = $1
            """,
            subject_id_int,
        )
        rows_affected = int(result.split(" ")[-1])
        if rows_affected == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found.",
            )
        return "success"

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        app_logger.error(f"Unhandled error during Subject Delete: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during Subject Delete.",
        )
