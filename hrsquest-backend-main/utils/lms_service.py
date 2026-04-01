from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, status

from properties.helper_psql import db_handler
from utils.authz import ROLE_STUDENT, ROLE_SUPERADMIN, ROLE_TEACHER
from utils.lms_storage import (
    MATERIAL_DIR,
    MATERIAL_MAX_SIZE_BYTES,
    MATERIAL_MIME_TYPES,
    VIDEO_DIR,
    VIDEO_MAX_SIZE_BYTES,
    VIDEO_MIME_TYPES,
    create_media_token,
    save_upload_file,
)


def _media_url(media_type: str, resource_id: int, role: str) -> str:
    token = create_media_token(media_type=media_type, resource_id=resource_id, owner_role=role)
    if media_type == "video":
        return f"/media/video/{resource_id}/stream?token={token}"
    return f"/media/material/{resource_id}/download?token={token}"


async def _get_course_for_teacher(course_id: int, teacher_id: int):
    course = await db_handler.fetch_one(
        """
        SELECT course_id, teacher_id, title, status, is_active, is_published
        FROM courses
        WHERE course_id = $1 AND teacher_id = $2
        """,
        course_id,
        teacher_id,
    )
    if not course:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher cannot access this course.",
        )
    return course


async def _get_lesson_for_teacher(course_id: int, lesson_id: int, teacher_id: int):
    lesson = await db_handler.fetch_one(
        """
        SELECT cl.lecture_id, cl.section_id, cl.course_id
        FROM course_lectures cl
        JOIN courses c ON c.course_id = cl.course_id
        WHERE cl.lecture_id = $1 AND cl.course_id = $2 AND c.teacher_id = $3
        """,
        lesson_id,
        course_id,
        teacher_id,
    )
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher cannot access this lesson.",
        )
    return lesson


async def _ensure_section_belongs_to_course(section_id: int, course_id: int):
    section = await db_handler.fetch_one(
        """
        SELECT section_id
        FROM course_sections
        WHERE section_id = $1 AND course_id = $2
        """,
        section_id,
        course_id,
    )
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Section not found for the selected course.",
        )


async def create_admin_course(payload):
    teacher = await db_handler.fetch_one(
        """
        SELECT teacher_id, role
        FROM teachers
        WHERE teacher_id = $1 AND is_deleted = FALSE
        """,
        payload.teacher_id,
    )
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found.")
    if str(teacher["role"]).lower() not in {ROLE_TEACHER, ROLE_SUPERADMIN}:
        raise HTTPException(status_code=400, detail="Assigned user is not a teacher.")

    duplicate = await db_handler.fetch_exists(
        """
        SELECT 1
        FROM courses
        WHERE teacher_id = $1
          AND LOWER(TRIM(title)) = LOWER(TRIM($2))
        LIMIT 1
        """,
        payload.teacher_id,
        payload.title,
    )
    if duplicate:
        raise HTTPException(status_code=409, detail="Course with this title already exists.")

    course_id = await db_handler.insert_and_get_id(
        "courses",
        {
            "teacher_id": payload.teacher_id,
            "subject_id": payload.subject_id,
            "grade_level": payload.grade_level,
            "title": payload.title.strip(),
            "description": payload.description,
            "thumbnail_url": payload.thumbnail_url,
            "price": payload.price,
            "level": payload.level,
            "language": payload.language,
            "status": "draft",
            "is_published": False,
            "is_active": True,
        },
        "course_id",
    )
    return {"message": "Course created successfully", "course_id": course_id}


async def assign_teacher_to_course(course_id: int, teacher_id: int):
    teacher = await db_handler.fetch_one(
        """
        SELECT teacher_id, role
        FROM teachers
        WHERE teacher_id = $1 AND is_deleted = FALSE
        """,
        teacher_id,
    )
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found.")

    updated = await db_handler.execute_command(
        """
        UPDATE courses
        SET teacher_id = $1, updated_at = NOW()
        WHERE course_id = $2
        """,
        teacher_id,
        course_id,
    )
    if updated.endswith("0"):
        raise HTTPException(status_code=404, detail="Course not found.")
    return {"message": "Teacher assigned successfully", "course_id": course_id, "teacher_id": teacher_id}


async def list_all_users():
    teachers, students = await db_handler.fetch_all(
        """
        SELECT teacher_id AS user_id, teacher_name AS name, username AS identifier, role, 'teacher' AS user_type, created_at
        FROM teachers
        WHERE is_deleted = FALSE
        ORDER BY created_at DESC
        """
    ), await db_handler.fetch_all(
        """
        SELECT student_id AS user_id, student_name AS name, email AS identifier, 'student' AS role, 'student' AS user_type, created_at
        FROM students
        WHERE is_deleted = FALSE
        ORDER BY created_at DESC
        """
    )
    return {"teachers": teachers, "students": students}


async def update_course_access(student_id: int, course_id: int, payment_status: str, actor_id: Optional[int] = None):
    student = await db_handler.fetch_one(
        "SELECT student_id FROM students WHERE student_id = $1 AND is_deleted = FALSE",
        student_id,
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    course = await db_handler.fetch_one(
        "SELECT course_id FROM courses WHERE course_id = $1",
        course_id,
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    unlocked_at = datetime.now(timezone.utc) if payment_status == "paid" else None
    await db_handler.execute_command(
        """
        INSERT INTO student_course_access (student_id, course_id, payment_status, unlocked_at, updated_by)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (student_id, course_id)
        DO UPDATE SET
            payment_status = EXCLUDED.payment_status,
            unlocked_at = EXCLUDED.unlocked_at,
            updated_by = EXCLUDED.updated_by,
            updated_at = NOW()
        """,
        student_id,
        course_id,
        payment_status,
        unlocked_at,
        actor_id,
    )
    return {
        "message": "Course access updated successfully",
        "student_id": student_id,
        "course_id": course_id,
        "payment_status": payment_status,
        "unlocked_at": unlocked_at.isoformat() if unlocked_at else None,
    }


async def upload_teacher_video(teacher_id: int, payload, upload_file):
    await _get_course_for_teacher(payload.course_id, teacher_id)
    await _ensure_section_belongs_to_course(payload.section_id, payload.course_id)

    saved = await save_upload_file(
        upload_file=upload_file,
        destination_dir=VIDEO_DIR,
        allowed_types=VIDEO_MIME_TYPES,
        max_size_bytes=VIDEO_MAX_SIZE_BYTES,
    )

    try:
        async with db_handler.pool.acquire() as conn:
            async with conn.transaction():
                lecture_id = await conn.fetchval(
                    """
                    INSERT INTO course_lectures
                        (course_id, section_id, title, description, notes, video_url, video_duration_seconds, order_index, is_preview)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING lecture_id
                    """,
                    payload.course_id,
                    payload.section_id,
                    payload.lesson_title.strip(),
                    payload.description,
                    payload.notes,
                    "",
                    payload.video_duration_seconds or 0,
                    payload.order_index or 0,
                    payload.is_preview or False,
                )

                video_id = await conn.fetchval(
                    """
                    INSERT INTO course_videos
                        (course_id, lesson_id, video_path, original_file_name, mime_type, file_size_bytes, duration, uploaded_by_teacher)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING video_id
                    """,
                    payload.course_id,
                    lecture_id,
                    saved["storage_path"],
                    saved["original_file_name"],
                    saved["mime_type"],
                    saved["file_size_bytes"],
                    payload.video_duration_seconds or 0,
                    teacher_id,
                )

                teacher_video_url = _media_url("video", video_id, ROLE_TEACHER)
                await conn.execute(
                    """
                    UPDATE course_lectures
                    SET video_url = $1, updated_at = NOW()
                    WHERE lecture_id = $2
                    """,
                    teacher_video_url,
                    lecture_id,
                )
    except Exception:
        Path(saved["storage_path"]).unlink(missing_ok=True)
        raise

    return {
        "message": "Video uploaded successfully",
        "lesson_id": lecture_id,
        "video_id": video_id,
        "video_url": teacher_video_url,
        "file_size_bytes": saved["file_size_bytes"],
        "mime_type": saved["mime_type"],
        "max_supported_size_bytes": VIDEO_MAX_SIZE_BYTES,
    }


async def upload_teacher_material(teacher_id: int, payload, upload_file):
    await _get_course_for_teacher(payload.course_id, teacher_id)
    await _get_lesson_for_teacher(payload.course_id, payload.lesson_id, teacher_id)

    saved = await save_upload_file(
        upload_file=upload_file,
        destination_dir=MATERIAL_DIR,
        allowed_types=MATERIAL_MIME_TYPES,
        max_size_bytes=MATERIAL_MAX_SIZE_BYTES,
    )

    resource_type = payload.resource_type or saved["mime_type"] or "file"
    try:
        async with db_handler.pool.acquire() as conn:
            async with conn.transaction():
                resource_id = await conn.fetchval(
                    """
                    INSERT INTO lecture_resources
                        (lecture_id, resource_title, resource_type, file_url, file_size_kb, storage_path, original_file_name, mime_type, uploaded_by_teacher)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING resource_id
                    """,
                    payload.lesson_id,
                    payload.resource_title.strip(),
                    resource_type,
                    "",
                    max(1, int(saved["file_size_bytes"] / 1024)),
                    saved["storage_path"],
                    saved["original_file_name"],
                    saved["mime_type"],
                    teacher_id,
                )

                teacher_download_url = _media_url("material", resource_id, ROLE_TEACHER)
                await conn.execute(
                    """
                    UPDATE lecture_resources
                    SET file_url = $1
                    WHERE resource_id = $2
                    """,
                    teacher_download_url,
                    resource_id,
                )
    except Exception:
        Path(saved["storage_path"]).unlink(missing_ok=True)
        raise

    return {
        "message": "Material uploaded successfully",
        "resource_id": resource_id,
        "file_url": teacher_download_url,
        "file_size_bytes": saved["file_size_bytes"],
        "mime_type": saved["mime_type"],
        "max_supported_size_bytes": MATERIAL_MAX_SIZE_BYTES,
    }


async def list_student_courses(student_id: int):
    rows = await db_handler.fetch_all(
        """
        SELECT
            c.course_id,
            c.title,
            c.description,
            c.thumbnail_url,
            c.teacher_id,
            t.teacher_name,
            c.price,
            COALESCE(c.status, CASE WHEN c.is_published THEN 'published' ELSE 'draft' END) AS status,
            COALESCE(sca.payment_status, 'unpaid') AS payment_status,
            (COALESCE(sca.payment_status, 'unpaid') = 'paid') AS is_unlocked,
            c.created_at::text AS created_at
        FROM courses c
        JOIN teachers t ON t.teacher_id = c.teacher_id
        LEFT JOIN student_course_access sca
            ON sca.course_id = c.course_id
           AND sca.student_id = $1
        WHERE c.is_active = TRUE AND c.is_published = TRUE
        ORDER BY c.created_at DESC
        """,
        student_id,
    )
    return rows


async def _get_student_course_access(student_id: int, course_id: int):
    course = await db_handler.fetch_one(
        """
        SELECT
            c.course_id,
            c.title,
            c.description,
            c.thumbnail_url,
            c.teacher_id,
            t.teacher_name,
            c.price,
            COALESCE(c.status, CASE WHEN c.is_published THEN 'published' ELSE 'draft' END) AS status,
            COALESCE(sca.payment_status, 'unpaid') AS payment_status,
            (COALESCE(sca.payment_status, 'unpaid') = 'paid') AS is_unlocked
        FROM courses c
        JOIN teachers t ON t.teacher_id = c.teacher_id
        LEFT JOIN student_course_access sca
            ON sca.course_id = c.course_id
           AND sca.student_id = $1
        WHERE c.course_id = $2 AND c.is_active = TRUE AND c.is_published = TRUE
        """,
        student_id,
        course_id,
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")
    return course


async def get_student_course_detail(student_id: int, course_id: int):
    course = await _get_student_course_access(student_id, course_id)
    if not course["is_unlocked"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Course is locked until payment is completed.",
        )

    sections = await db_handler.fetch_all(
        """
        SELECT section_id, course_id, title, order_index
        FROM course_sections
        WHERE course_id = $1
        ORDER BY order_index, section_id
        """,
        course_id,
    )

    for section in sections:
        lessons = await db_handler.fetch_all(
            """
            SELECT
                cl.lecture_id AS lesson_id,
                cl.section_id AS module_id,
                cl.title,
                cl.description,
                cl.notes,
                cl.video_url AS source_video_url,
                cl.order_index,
                cl.video_duration_seconds,
                cv.video_id,
                cv.duration,
                cv.created_at::text AS created_at
            FROM course_lectures cl
            LEFT JOIN course_videos cv ON cv.lesson_id = cl.lecture_id
            WHERE cl.section_id = $1
            ORDER BY cl.order_index, cl.lecture_id
            """,
            section["section_id"],
        )
        for lesson in lessons:
            if lesson.get("video_id"):
                lesson["video_url"] = _media_url("video", lesson["video_id"], ROLE_STUDENT)
            else:
                lesson["video_url"] = lesson.get("source_video_url")

            materials = await db_handler.fetch_all(
                """
                SELECT resource_id, resource_title, resource_type, file_size_kb, mime_type, file_url, storage_path, created_at::text AS created_at
                FROM lecture_resources
                WHERE lecture_id = $1
                ORDER BY resource_id
                """,
                lesson["lesson_id"],
            )
            for material in materials:
                if material.get("storage_path"):
                    material["file_url"] = _media_url("material", material["resource_id"], ROLE_STUDENT)
            lesson["attachments"] = materials
        section["lessons"] = lessons

    course["modules"] = sections
    return course


async def get_video_stream_record(video_id: int):
    video = await db_handler.fetch_one(
        """
        SELECT video_id, video_path, mime_type, original_file_name
        FROM course_videos
        WHERE video_id = $1
        """,
        video_id,
    )
    if not video:
        raise HTTPException(status_code=404, detail="Video not found.")
    return video


async def get_material_record(resource_id: int):
    resource = await db_handler.fetch_one(
        """
        SELECT resource_id, storage_path, mime_type, original_file_name
        FROM lecture_resources
        WHERE resource_id = $1
        """,
        resource_id,
    )
    if not resource:
        raise HTTPException(status_code=404, detail="Material not found.")
    return resource
