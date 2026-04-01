from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from utils.lms_service import get_material_record, get_video_stream_record
from utils.lms_storage import validate_media_token


router = APIRouter(prefix="/media", tags=["Secure Media"])


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
