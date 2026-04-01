from fastapi import APIRouter, Depends

from utils.authz import get_current_student
from utils.lms_service import get_student_course_detail, list_student_courses


router = APIRouter(tags=["Student Courses"])


@router.get("/student/courses")
async def get_student_courses(current_user: dict = Depends(get_current_student)):
    return await list_student_courses(current_user["student_id"])


@router.get("/student/course/{course_id}")
async def get_student_course(course_id: int, current_user: dict = Depends(get_current_student)):
    return await get_student_course_detail(
        student_id=current_user["student_id"],
        course_id=course_id,
    )
