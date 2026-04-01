from fastapi import APIRouter, Depends, HTTPException, status
from properties.helper_psql import get_db_handler, AsyncDBHandler
from properties.log import app_logger
from utils.authz import get_current_teacher


router = APIRouter(tags=["Teacher Dashboard"])


@router.get("/teacher/info")
async def get_teacher_info(
    db_handler: AsyncDBHandler = Depends(get_db_handler),
    user_info=Depends(get_current_teacher),
):
    """
    Get Teacher Information
    """
    teacher_id = user_info.get("teacher_id")
    if not teacher_id:
        app_logger.error(f"teacher Id not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="teacher Not Found.",
        )

    app_logger.info(f"Getting Teacher Information for teacher Id: {teacher_id}")

    try:
        query = """SELECT t.teacher_id, t.teacher_name, t.username, t.role
                FROM teachers t
                WHERE (t.teacher_id = $1) AND (t.is_deleted = false)
            """

        user_info = await db_handler.fetch_one_row(query, teacher_id)
        return user_info

    except ValueError as e:
        # Catches the specific UniqueViolationError handled in insert_and_get_id
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        # Catches unexpected errors (e.g., severe connection failure)
        app_logger.error(f"Unhandled error during teacher info: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during teacher info.",
        )
