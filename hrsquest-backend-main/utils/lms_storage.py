import os
import secrets
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile, status

from utils.user_authentication import create_access_token, decode_access_token


BASE_STORAGE_DIR = Path(os.getenv("HRSQUEST_STORAGE_DIR", "storage/private")).resolve()
VIDEO_DIR = BASE_STORAGE_DIR / "videos"
MATERIAL_DIR = BASE_STORAGE_DIR / "materials"
QUESTION_IMAGE_DIR = BASE_STORAGE_DIR / "question_images"

VIDEO_MIME_TYPES = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "video/x-matroska": ".mkv",
}
MATERIAL_MIME_TYPES = {
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
    "text/plain": ".txt",
    "application/zip": ".zip",
}
IMAGE_MIME_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
}

VIDEO_MAX_SIZE_BYTES = 2 * 1024 * 1024 * 1024
MATERIAL_MAX_SIZE_BYTES = 25 * 1024 * 1024
IMAGE_MAX_SIZE_BYTES = 10 * 1024 * 1024
READ_CHUNK_SIZE = 1024 * 1024


def ensure_storage_dirs() -> None:
    VIDEO_DIR.mkdir(parents=True, exist_ok=True)
    MATERIAL_DIR.mkdir(parents=True, exist_ok=True)
    QUESTION_IMAGE_DIR.mkdir(parents=True, exist_ok=True)


def _resolve_extension(filename: str, content_type: Optional[str], allowed_types: dict) -> str:
    if content_type in allowed_types:
        return allowed_types[content_type]

    ext = Path(filename or "").suffix.lower()
    if ext and ext in allowed_types.values():
        return ext

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Unsupported file type.",
    )


async def save_upload_file(
    upload_file: UploadFile,
    destination_dir: Path,
    allowed_types: dict,
    max_size_bytes: int,
) -> dict:
    ensure_storage_dirs()
    extension = _resolve_extension(
        upload_file.filename or "",
        upload_file.content_type,
        allowed_types,
    )
    safe_name = f"{secrets.token_hex(16)}{extension}"
    target_path = destination_dir / safe_name
    total_size = 0

    try:
        with target_path.open("wb") as output_file:
            while True:
                chunk = await upload_file.read(READ_CHUNK_SIZE)
                if not chunk:
                    break
                total_size += len(chunk)
                if total_size > max_size_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File exceeds the allowed size limit.",
                    )
                output_file.write(chunk)
    except Exception:
        if target_path.exists():
            target_path.unlink()
        raise
    finally:
        await upload_file.close()

    return {
        "storage_path": str(target_path),
        "original_file_name": upload_file.filename,
        "mime_type": upload_file.content_type,
        "file_size_bytes": total_size,
    }


def create_media_token(media_type: str, resource_id: int, owner_role: str, expiry_minutes: int = 20) -> str:
    return create_access_token(
        {
            "media_type": media_type,
            "resource_id": resource_id,
            "role": owner_role,
        },
        EXPIRY=expiry_minutes,
    )


def validate_media_token(token: str, media_type: str, resource_id: int) -> dict:
    payload = decode_access_token(token)
    if payload.get("media_type") != media_type or int(payload.get("resource_id", 0)) != int(resource_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid media token.",
        )
    return payload
