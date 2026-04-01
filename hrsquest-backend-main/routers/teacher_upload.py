from fastapi import APIRouter, Depends, File, Form, UploadFile

from schema import UploadMaterialForm, UploadVideoForm
from utils.authz import get_current_teacher
from utils.lms_service import upload_teacher_material, upload_teacher_video


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
