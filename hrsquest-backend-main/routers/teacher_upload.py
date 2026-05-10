from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, UploadFile

from schema import UploadMaterialForm, UploadVideoForm
from utils.authz import get_current_teacher
from utils.lms_service import upload_teacher_material, upload_teacher_video
from utils.lms_storage import (
    IMAGE_MAX_SIZE_BYTES,
    IMAGE_MIME_TYPES,
    QUESTION_IMAGE_DIR,
    save_upload_file,
)


router = APIRouter(prefix="/teacher/upload", tags=["Teacher Upload"])


@router.post("/video")
async def upload_video(
    course_id: int = Form(...),
    section_id: int = Form(...),
    lesson_title: str = Form(...),
    description: str | None = Form(None),
    notes: str | None = Form(None),
    order_index: int = Form(0),
    is_preview: bool = Form(False),
    video_duration_seconds: int = Form(0),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_teacher),
):
    payload = UploadVideoForm(
        course_id=course_id,
        section_id=section_id,
        lesson_title=lesson_title,
        description=description,
        notes=notes,
        order_index=order_index,
        is_preview=is_preview,
        video_duration_seconds=video_duration_seconds,
    )
    return await upload_teacher_video(
        teacher_id=current_user["teacher_id"],
        payload=payload,
        upload_file=file,
    )


@router.post("/material")
async def upload_material(
    course_id: int = Form(...),
    lesson_id: int = Form(...),
    resource_title: str = Form(...),
    resource_type: str | None = Form(None),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_teacher),
):
    payload = UploadMaterialForm(
        course_id=course_id,
        lesson_id=lesson_id,
        resource_title=resource_title,
        resource_type=resource_type,
    )
    return await upload_teacher_material(
        teacher_id=current_user["teacher_id"],
        payload=payload,
        upload_file=file,
    )


@router.post("/image")
async def upload_question_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_teacher),
):
    saved = await save_upload_file(
        upload_file=file,
        destination_dir=QUESTION_IMAGE_DIR,
        allowed_types=IMAGE_MIME_TYPES,
        max_size_bytes=IMAGE_MAX_SIZE_BYTES,
    )
    filename = Path(saved["storage_path"]).name
    return {
        "image_path": f"/media/question-image/{filename}",
        "original_file_name": saved["original_file_name"],
        "mime_type": saved["mime_type"],
        "file_size_bytes": saved["file_size_bytes"],
    }
