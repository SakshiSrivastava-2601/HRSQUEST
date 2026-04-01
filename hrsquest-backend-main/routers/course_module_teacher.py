from fastapi import APIRouter, Depends, HTTPException, status
from properties.log import app_logger
from utils.authz import get_current_teacher
from utils.teacher_subjects import ensure_teacher_subject_access
from utils.course_module.teachers_course import *
from schema import *

router = APIRouter(prefix="/teacher/course", tags=["Teacher Course"])


"""
POST   /teacher/course/create
POST   /teacher/course/section/create
POST   /teacher/course/lecture/create
POST   /teacher/course/lecture/resource/add
PUT    /teacher/course/lecture/resource/update
DELETE /teacher/course/lecture/resource/{resource_id}
PUT    /teacher/course/publish/{course_id}

GET /teacher/course/my-courses
GET /teacher/course/get_course/{course_id}
GET /teacher/course/{course_id}/sections
GET /teacher/course/{course_id}/sections/{section_id}/lectures
GET /teacher/course/lecture/{lecture_id}/resources
GET /teacher/course/{course_id}/full

"""

@router.post("/create")
async def create_course_api(
    payload: CourseCreateSchema,
    current_user: dict = Depends(get_current_teacher),
):
    # try:
        teacher_id = current_user["teacher_id"]
        if not teacher_id:
            app_logger.error(f"teacher Id not found")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="teacher Not Found.",
            )

        # Teachers must create courses only for subjects assigned by SuperAdmin.
        if str(current_user.get("role", "")).lower() == "teacher":
            if not payload.subject_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="subject_id is required for course creation.",
                )
            await ensure_teacher_subject_access(
                teacher_id=int(teacher_id), subject_id=int(payload.subject_id)
            )

        result = await create_course(
            teacher_id=teacher_id,
            payload=payload
        )

        return result

    # except Exception as e:
    #     raise HTTPException(status_code=400, detail=str(e))
    

@router.get("/my-courses")
async def get_my_courses_api(
    current_user: dict = Depends(get_current_teacher),
):
    teacher_id = current_user["teacher_id"]
    if not teacher_id:
        app_logger.error(f"teacher Id not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="teacher Not Found.",
        )

    result = await get_teacher_courses(teacher_id)

    return result


@router.get("/get_course/{course_id}")
async def get_course_api(
    course_id: int,
    current_user: dict = Depends(get_current_teacher),
):
    teacher_id = current_user["teacher_id"]
    if not teacher_id:
        app_logger.error(f"teacher Id not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="teacher Not Found.",
        )

    result = await get_course_details(teacher_id, course_id)

    return result


@router.put("/update/{course_id}")
async def update_course_api(
    course_id: int,
    payload: CourseUpdateSchema,
    current_user: dict = Depends(get_current_teacher),
):
    # try:
        teacher_id = current_user["teacher_id"]
        if not teacher_id:
            app_logger.error(f"teacher Id not found")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="teacher Not Found.",
            )

        if str(current_user.get("role", "")).lower() == "teacher" and payload.subject_id:
            await ensure_teacher_subject_access(
                teacher_id=int(teacher_id), subject_id=int(payload.subject_id)
            )

        result = await update_course(
            course_id=course_id,
            payload=payload,
            teacher_id=teacher_id
        )

        return result

    # except Exception as e:
    #     raise HTTPException(status_code=400, detail=str(e))
    
@router.post("/section/create")
async def create_section_api(
    payload: SectionCreateSchema,
    current_user: dict = Depends(get_current_teacher),
):
    try:
        teacher_id = current_user["teacher_id"]
        if not teacher_id:
            app_logger.error(f"teacher Id not found")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="teacher Not Found.",
            )
        
        result = await create_course_section(
            teacher_id=teacher_id,
            course_id=payload.course_id,
            title=payload.title,
            order_index=payload.order_index,
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/section/update")
async def update_section_api(
    payload: SectionUpdateSchema,
    current_user: dict = Depends(get_current_teacher),
):
    try:
        teacher_id = current_user["teacher_id"]
        if not teacher_id:
            app_logger.error(f"teacher Id not found")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="teacher Not Found.",
            )

        result = await update_course_section(
            teacher_id=teacher_id,
            course_id=payload.course_id,
            section_id=payload.section_id,
            title=payload.title,
            order_index=payload.order_index or 0,
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/{course_id}/sections")
async def get_sections_api(
    course_id: int,
    current_user: dict = Depends(get_current_teacher),
):
    teacher_id = current_user["teacher_id"]
    if not teacher_id:
        app_logger.error(f"teacher Id not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="teacher Not Found.",
        )

    result = await get_course_sections(teacher_id, course_id)

    return result

@router.post("/lecture/create")
async def create_lecture_api(
    payload: LectureCreateSchema,
    current_user: dict = Depends(get_current_teacher),
):
    try:
        teacher_id = current_user["teacher_id"]
        if not teacher_id:
            app_logger.error(f"teacher Id not found")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="teacher Not Found.",
            )
        
        result = await create_course_lecture(
            teacher_id=teacher_id,
            course_id=payload.course_id,
            section_id=payload.section_id,
            title=payload.title,
            description=payload.description,
            video_url=payload.video_url,
            notes=payload.notes,
            order_index=payload.order_index,
            is_preview=payload.is_preview or False,
            video_duration_seconds=payload.video_duration_seconds or 0,
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/{course_id}/sections/{section_id}/lectures")
async def get_lectures_api(
    course_id: int,
    section_id: int,
    current_user: dict = Depends(get_current_teacher),
):
    teacher_id = current_user["teacher_id"]
    if not teacher_id:
        app_logger.error(f"teacher Id not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="teacher Not Found.",
        )
    
    result = await get_section_lectures(
        teacher_id,
        course_id,
        section_id
    )

    return result

@router.post("/lecture/resource/add")
async def add_resource_api(
    payload: LectureResourceCreateSchema,
    current_user: dict = Depends(get_current_teacher),
):
    try:
        teacher_id = current_user["teacher_id"]
        if not teacher_id:
            app_logger.error(f"teacher Id not found")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="teacher Not Found.",
            )
        
        result = await add_lecture_resource(
            teacher_id=teacher_id,
            lecture_id=payload.lecture_id,
            resource_title=payload.resource_title,
            resource_type=payload.resource_type,
            file_url=payload.file_url,
            file_size_kb=payload.file_size_kb,
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/lecture/resource/update")
async def update_resource_api(
    payload: LectureResourceUpdateSchema,
    current_user: dict = Depends(get_current_teacher),
):
    try:
        teacher_id = current_user["teacher_id"]
        if not teacher_id:
            app_logger.error(f"teacher Id not found")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="teacher Not Found.",
            )

        result = await update_lecture_resource(
            teacher_id=teacher_id,
            resource_id=payload.resource_id,
            lecture_id=payload.lecture_id,
            resource_title=payload.resource_title,
            resource_type=payload.resource_type,
            file_url=payload.file_url,
            file_size_kb=payload.file_size_kb,
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/lecture/resource/{resource_id}")
async def delete_resource_api(
    resource_id: int,
    current_user: dict = Depends(get_current_teacher),
):
    try:
        teacher_id = current_user["teacher_id"]
        if not teacher_id:
            app_logger.error(f"teacher Id not found")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="teacher Not Found.",
            )

        result = await delete_lecture_resource(
            teacher_id=teacher_id,
            resource_id=resource_id,
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/lecture/{lecture_id}/resources")
async def get_resources_api(
    lecture_id: int,
    current_user: dict = Depends(get_current_teacher),
):
    teacher_id = current_user["teacher_id"]
    if not teacher_id:
        app_logger.error(f"teacher Id not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="teacher Not Found.",
        )
    result = await get_lecture_resources(
        teacher_id,
        lecture_id
    )

    return result   

@router.put("/publish/{course_id}")
async def publish_course_api(
    course_id: int,
    current_user: dict = Depends(get_current_teacher),
):
    try:
        teacher_id = current_user["teacher_id"]
        if not teacher_id:
            app_logger.error(f"teacher Id not found")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="teacher Not Found.",
            )
        
        result = await publish_course(
            teacher_id=teacher_id,
            course_id=course_id,
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    
@router.get("/{course_id}/full")
async def get_full_course_api(
    course_id: int,
    current_user: dict = Depends(get_current_teacher),
):
    teacher_id = current_user["teacher_id"]
    if not teacher_id:
        app_logger.error(f"teacher Id not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="teacher Not Found.",
        )

    result = await get_full_course(
        teacher_id,
        course_id
    )

    return result
