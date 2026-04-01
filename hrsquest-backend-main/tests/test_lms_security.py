import os
import sys
import tempfile
import unittest
from io import BytesIO
from pathlib import Path

from fastapi import HTTPException, UploadFile


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from schema import UpdateCourseAccessSchema
from utils.authz import ROLE_STUDENT, ROLE_SUPERADMIN, require_roles
from utils.lms_storage import (
    MATERIAL_MIME_TYPES,
    MATERIAL_MAX_SIZE_BYTES,
    create_media_token,
    save_upload_file,
    validate_media_token,
)


class RoleGuardTests(unittest.TestCase):
    def test_superadmin_role_allowed(self):
        dependency = require_roles(ROLE_SUPERADMIN)
        result = dependency({"role": ROLE_SUPERADMIN, "teacher_id": 1})
        self.assertEqual(result["teacher_id"], 1)

    def test_student_role_denied_for_admin_route(self):
        dependency = require_roles(ROLE_SUPERADMIN)
        with self.assertRaises(HTTPException) as ctx:
            dependency({"role": ROLE_STUDENT, "student_id": 7})
        self.assertEqual(ctx.exception.status_code, 403)


class CourseAccessSchemaTests(unittest.TestCase):
    def test_paid_status_normalized(self):
        payload = UpdateCourseAccessSchema(student_id=1, course_id=2, payment_status="PAID")
        self.assertEqual(payload.payment_status, "paid")

    def test_invalid_payment_status_rejected(self):
        with self.assertRaises(Exception):
            UpdateCourseAccessSchema(student_id=1, course_id=2, payment_status="pending")


class MediaTokenTests(unittest.TestCase):
    def test_media_token_round_trip(self):
        token = create_media_token(media_type="video", resource_id=42, owner_role=ROLE_STUDENT)
        payload = validate_media_token(token, "video", 42)
        self.assertEqual(payload["resource_id"], 42)

    def test_media_token_rejects_wrong_resource(self):
        token = create_media_token(media_type="material", resource_id=9, owner_role=ROLE_STUDENT)
        with self.assertRaises(HTTPException):
            validate_media_token(token, "material", 10)


class UploadValidationTests(unittest.IsolatedAsyncioTestCase):
    async def test_save_upload_file_rejects_oversized_material(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            upload = UploadFile(
                filename="notes.pdf",
                file=BytesIO(b"a" * (MATERIAL_MAX_SIZE_BYTES + 1)),
                headers={"content-type": "application/pdf"},
            )
            with self.assertRaises(HTTPException) as ctx:
                await save_upload_file(
                    upload_file=upload,
                    destination_dir=Path(temp_dir),
                    allowed_types=MATERIAL_MIME_TYPES,
                    max_size_bytes=MATERIAL_MAX_SIZE_BYTES,
                )
            self.assertEqual(ctx.exception.status_code, 413)

    async def test_save_upload_file_persists_allowed_material(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            upload = UploadFile(
                filename="notes.pdf",
                file=BytesIO(b"study material"),
                headers={"content-type": "application/pdf"},
            )
            result = await save_upload_file(
                upload_file=upload,
                destination_dir=Path(temp_dir),
                allowed_types=MATERIAL_MIME_TYPES,
                max_size_bytes=MATERIAL_MAX_SIZE_BYTES,
            )
            self.assertTrue(os.path.exists(result["storage_path"]))
            self.assertEqual(result["mime_type"], "application/pdf")


if __name__ == "__main__":
    unittest.main()
