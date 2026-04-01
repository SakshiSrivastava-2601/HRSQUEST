from properties.helper_psql import db_handler
from fastapi import HTTPException, status


async def ensure_teacher_subject_access(*, teacher_id: int, subject_id: int):
    allowed = await db_handler.fetch_one_row(
        """
        SELECT 1
        FROM teacher_subjects
        WHERE teacher_id = $1 AND subject_id = $2
        """,
        int(teacher_id),
        int(subject_id),
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this subject.",
        )


async def list_teacher_subject_ids(*, teacher_id: int):
    rows = await db_handler.fetch_all_rows(
        """
        SELECT subject_id
        FROM teacher_subjects
        WHERE teacher_id = $1
        ORDER BY subject_id
        """,
        int(teacher_id),
    )
    return [int(r["subject_id"]) for r in rows]

