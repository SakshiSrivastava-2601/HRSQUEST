import re
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from utils.lms_service import get_material_record, get_video_stream_record
from utils.lms_storage import (
    IMAGE_MIME_TYPES,
    QUESTION_IMAGE_DIR,
    validate_media_token,
)


router = APIRouter(prefix="/media", tags=["Secure Media"])

_IMAGE_FILENAME_RE = re.compile(r"^[a-f0-9]{32}\.(png|jpg|jpeg|gif|webp)$", re.IGNORECASE)
_IMAGE_EXT_TO_MIME = {ext.lstrip("."): mime for mime, ext in IMAGE_MIME_TYPES.items()}


@router.get("/video/{video_id}/stream")
async def stream_video(video_id: int, token: str = Query(...)):
    validate_media_token(token=token, media_type="video", resource_id=video_id)
    video = await get_video_stream_record(video_id)
    path = Path(video["video_path"])
    if not path.exists():
        raise HTTPException(status_code=404, detail="Video file not found.")
    media_type = (video.get("mime_type") or "").strip()
    if not media_type or media_type == "application/octet-stream":
        # Best-effort fallback so browsers render a player for mp4 content.
        if path.suffix.lower() == ".mp4":
            media_type = "video/mp4"
    return FileResponse(
        path=str(path),
        media_type=media_type or "application/octet-stream",
        filename=video.get("original_file_name") or path.name,
        # Stream in browser instead of forcing download.
        content_disposition_type="inline",
    )


@router.get("/question-image/{filename}")
async def get_question_image(filename: str):
    if not _IMAGE_FILENAME_RE.match(filename):
        raise HTTPException(status_code=400, detail="Invalid image filename.")
    path = (QUESTION_IMAGE_DIR / filename).resolve()
    if path.parent != QUESTION_IMAGE_DIR.resolve():
        raise HTTPException(status_code=400, detail="Invalid image path.")
    if not path.exists():
        raise HTTPException(status_code=404, detail="Image not found.")
    ext = path.suffix.lower().lstrip(".")
    return FileResponse(
        path=str(path),
        media_type=_IMAGE_EXT_TO_MIME.get(ext, "application/octet-stream"),
        content_disposition_type="inline",
    )


@router.get("/material/{resource_id}/download")
async def download_material(resource_id: int, token: str = Query(...)):
    validate_media_token(token=token, media_type="material", resource_id=resource_id)
    resource = await get_material_record(resource_id)
    path = Path(resource["storage_path"])
    if not path.exists():
        raise HTTPException(status_code=404, detail="Material file not found.")
    return FileResponse(
        path=str(path),
        media_type=resource.get("mime_type") or "application/octet-stream",
        filename=resource.get("original_file_name") or path.name,
    )
