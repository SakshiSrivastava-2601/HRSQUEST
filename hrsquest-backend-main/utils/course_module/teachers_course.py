from properties.config import run_async_tasks
from properties.helper_psql import db_handler


"""
Creating course - 
Course
 └── Section
       └── Lecture
             ├── Video
             └── Resources


create_course()
create_course_section()
create_course_lecture()
add_lecture_resource()
publish_course()
    
"""


async def create_course(
    teacher_id,
    payload
):  
    
    title = payload.title
    description = payload.description
    subject_id = payload.subject_id
    grade_level = payload.grade_level
    price = payload.price
    level = payload.level
    language = payload.language
    thumbnail_url = payload.thumbnail_url

    # -----------------------------------------
    # 1. Duplicate Check
    # -----------------------------------------
    duplicate_query = """
        SELECT 1
        FROM courses
        WHERE teacher_id = $1
          AND LOWER(TRIM(title)) = LOWER(TRIM($2))
        LIMIT 1
    """

    exists = await db_handler.fetch_exists(duplicate_query, teacher_id, title.strip())
    if exists:
        raise ValueError("Course with this title already exists")

    # -----------------------------------------
    # 2. Insert Course
    # -----------------------------------------
    course_data = {
        "teacher_id": teacher_id,
        "subject_id": subject_id,
        "grade_level": grade_level,
        "title": title.strip(),
        "description": description,
        "price": price,
        "level": level,
        "language": language,
        "thumbnail_url": thumbnail_url,
        "status": "draft",
        "is_published": False,
    }

    course_id = await db_handler.insert_and_get_id(
        table_name="courses",
        data=course_data,
        id_column="course_id",
    )

    return {
        "message": "Course created successfully",
        "course_id": course_id,
    }


async def get_course_details(teacher_id: int, course_id: int):
    query = """
        SELECT *
        FROM courses
        WHERE course_id = $1
          AND teacher_id = $2
        LIMIT 1
    """

    row = await db_handler.fetch_one(query, course_id, teacher_id)

    if not row:
        raise ValueError("Course not found")

    return row


async def get_teacher_courses(teacher_id: int):
    query = """
        SELECT *
        FROM courses
        WHERE teacher_id = $1
        ORDER BY course_id DESC
    """

    rows = await db_handler.fetch_all(query, teacher_id)

    return rows

async def update_course(
    course_id,
    payload,
    teacher_id
):  
    
    # -----------------------------------------
    # Verify course belongs to teacher
    # -----------------------------------------
    check_query = """
        SELECT 1 FROM courses
        WHERE course_id = $1
          AND teacher_id = $2
        LIMIT 1
    """

    exists = await db_handler.fetch_exists(check_query, course_id, teacher_id)
    if not exists:
        raise ValueError("Unauthorized or Course not found")

    update_data = {
        "title": payload.title.strip(),
        "description": payload.description,
        "subject_id": payload.subject_id,
        "grade_level": payload.grade_level,
        "price": payload.price,
        "level": payload.level,
        "language": payload.language,
        "thumbnail_url": payload.thumbnail_url,
    }

    await db_handler.update_record(
        table_name="courses",
        data=update_data,
        condition_col="course_id",
        condition_val=course_id
    )
 
    return {"message": "Course updated successfully"}

async def create_course_section(
    teacher_id: int,
    course_id: int,
    title: str,
    order_index: int,
):
    # -----------------------------------------
    # Validate ownership
    # -----------------------------------------
    check_query = """
        SELECT 1 FROM courses
        WHERE course_id = $1
          AND teacher_id = $2
        LIMIT 1
    """

    exists = await db_handler.fetch_exists(check_query, course_id, teacher_id)
    if not exists:
        raise ValueError("Unauthorized access")

    section_data = {
        "course_id": course_id,
        "title": title.strip(),
        "order_index": order_index,
    }

    section_id = await db_handler.insert_and_get_id(
        table_name="course_sections",
        data=section_data,
        id_column="section_id",
    )

    return {
        "message": "Section created successfully",
        "section_id": section_id,
    }

async def get_course_sections(teacher_id: int, course_id: int):
    query = """
        SELECT cs.*
        FROM course_sections cs
        JOIN courses c ON c.course_id = cs.course_id
        WHERE cs.course_id = $1
          AND c.teacher_id = $2
        ORDER BY cs.order_index
    """

    rows = await db_handler.fetch_all(query, course_id, teacher_id)

    return rows


async def update_course_section(
    teacher_id: int,
    course_id: int,
    section_id: int,
    title: str,
    order_index: int,
):
    check_query = """
        SELECT 1
        FROM course_sections cs
        JOIN courses c ON c.course_id = cs.course_id
        WHERE cs.section_id = $1
          AND cs.course_id = $2
          AND c.teacher_id = $3
        LIMIT 1
    """

    exists = await db_handler.fetch_exists(check_query, section_id, course_id, teacher_id)
    if not exists:
        raise ValueError("Unauthorized access or section not found")

    update_query = """
        UPDATE course_sections
        SET title = $1,
            order_index = $2,
            updated_at = NOW()
        WHERE section_id = $3
          AND course_id = $4
    """

    await db_handler.execute_command(
        update_query,
        title.strip(),
        order_index,
        section_id,
        course_id,
    )

    return {"message": "Section updated successfully", "section_id": section_id}


async def create_course_lecture(
    teacher_id: int,
    course_id: int,
    section_id: int,
    title: str,
    description: str,
    video_url: str,
    notes: str | None,
    order_index: int,
    is_preview: bool = False,
    video_duration_seconds: int = 0,
):
    # -----------------------------------------
    # Validate teacher owns course
    # -----------------------------------------
    check_query = """
        SELECT 1 FROM courses
        WHERE course_id = $1
          AND teacher_id = $2
        LIMIT 1
    """

    exists = await db_handler.fetch_exists(check_query, course_id, teacher_id)
    if not exists:
        raise ValueError("Unauthorized access")

    lecture_data = {
        "course_id": course_id,
        "section_id": section_id,
        "title": title.strip(),
        "description": description,
        "video_url": video_url,
        "notes": notes,
        "order_index": order_index,
        "is_preview": is_preview,
        "video_duration_seconds": video_duration_seconds,
    }

    lecture_id = await db_handler.insert_and_get_id(
        table_name="course_lectures",
        data=lecture_data,
        id_column="lecture_id",
    )

    return {
        "message": "Lecture created successfully",
        "lecture_id": lecture_id,
    }

async def get_section_lectures(
    teacher_id: int,
    course_id: int,
    section_id: int,
):
    query = """
        SELECT cl.*
        FROM course_lectures cl
        JOIN courses c ON c.course_id = cl.course_id
        WHERE cl.course_id = $1
          AND cl.section_id = $2
          AND c.teacher_id = $3
        ORDER BY cl.order_index
    """

    rows = await db_handler.fetch_all(
        query,
        course_id,
        section_id,
        teacher_id
    )

    return rows

async def add_lecture_resource(
    teacher_id: int,
    lecture_id: int,
    resource_title: str,
    resource_type: str,
    file_url: str,
    file_size_kb: int = None,
):
    resource_data = {
        "lecture_id": lecture_id,
        "resource_title": resource_title,
        "resource_type": resource_type,
        "file_url": file_url,
        "file_size_kb": file_size_kb,
    }

    resource_id = await db_handler.insert_and_get_id(
        table_name="lecture_resources",
        data=resource_data,
        id_column="resource_id",
    )

    return {
        "message": "Resource added successfully",
        "resource_id": resource_id,
    }


async def update_lecture_resource(
    teacher_id: int,
    resource_id: int,
    lecture_id: int,
    resource_title: str,
    resource_type: str,
    file_url: str | None,
    file_size_kb: int | None = None,
):
    check_query = """
        SELECT 1
        FROM lecture_resources lr
        JOIN course_lectures cl ON cl.lecture_id = lr.lecture_id
        JOIN courses c ON c.course_id = cl.course_id
        WHERE lr.resource_id = $1
          AND lr.lecture_id = $2
          AND c.teacher_id = $3
        LIMIT 1
    """

    exists = await db_handler.fetch_exists(check_query, resource_id, lecture_id, teacher_id)
    if not exists:
        raise ValueError("Unauthorized access or resource not found")

    update_query = """
        UPDATE lecture_resources
        SET resource_title = $1,
            resource_type = $2,
            file_url = $3,
            file_size_kb = $4,
            updated_at = NOW()
        WHERE resource_id = $5
          AND lecture_id = $6
    """

    await db_handler.execute_command(
        update_query,
        resource_title.strip(),
        resource_type,
        file_url,
        file_size_kb,
        resource_id,
        lecture_id,
    )

    return {"message": "Resource updated successfully", "resource_id": resource_id}


async def delete_lecture_resource(
    teacher_id: int,
    resource_id: int,
):
    check_query = """
        SELECT 1
        FROM lecture_resources lr
        JOIN course_lectures cl ON cl.lecture_id = lr.lecture_id
        JOIN courses c ON c.course_id = cl.course_id
        WHERE lr.resource_id = $1
          AND c.teacher_id = $2
        LIMIT 1
    """

    exists = await db_handler.fetch_exists(check_query, resource_id, teacher_id)
    if not exists:
        raise ValueError("Unauthorized access or resource not found")

    delete_query = """
        DELETE FROM lecture_resources
        WHERE resource_id = $1
    """

    await db_handler.execute_command(delete_query, resource_id)

    return {"message": "Resource deleted successfully", "resource_id": resource_id}

async def get_lecture_resources(
    teacher_id: int,
    lecture_id: int,
):
    query = """
        SELECT lr.*
        FROM lecture_resources lr
        JOIN course_lectures cl ON cl.lecture_id = lr.lecture_id
        JOIN courses c ON c.course_id = cl.course_id
        WHERE lr.lecture_id = $1
          AND c.teacher_id = $2
    """

    rows = await db_handler.fetch_all(
        query,
        lecture_id,
        teacher_id
    )

    return rows

async def publish_course(
    teacher_id: int,
    course_id: int,
):
    # -----------------------------------------
    # Verify ownership
    # -----------------------------------------
    check_query = """
        SELECT 1 FROM courses
        WHERE course_id = $1
          AND teacher_id = $2
        LIMIT 1
    """

    exists = await db_handler.fetch_exists(check_query, course_id, teacher_id)
    if not exists:
        raise ValueError("Unauthorized access")

    # -----------------------------------------
    # Check sections exist
    # -----------------------------------------
    section_query = """
        SELECT 1 FROM course_sections
        WHERE course_id = $1
        LIMIT 1
    """

    has_section = await db_handler.fetch_exists(section_query, course_id)
    if not has_section:
        raise ValueError("Course must have at least one section")

    # -----------------------------------------
    # Check lectures exist
    # -----------------------------------------
    lecture_query = """
        SELECT 1 FROM course_lectures
        WHERE course_id = $1
        LIMIT 1
    """

    has_lecture = await db_handler.fetch_exists(lecture_query, course_id)
    if not has_lecture:
        raise ValueError("Course must have at least one lecture")

    # -----------------------------------------
    # Publish
    # -----------------------------------------
    await db_handler.update_record(
        table_name="courses",
        data={"is_published": True, "status": "published"},
        condition_col="course_id",
        condition_val=course_id
    )

    return {"message": "Course published successfully"}

async def get_full_course(teacher_id: int, course_id: int):

    # 1️⃣ Get Course
    course = await db_handler.fetch_one(
        """
        SELECT *
        FROM courses
        WHERE course_id = $1
          AND teacher_id = $2
        """,
        course_id,
        teacher_id
    )

    if not course:
        raise ValueError("Course not found")

    # 2️⃣ Get Sections
    sections = await db_handler.fetch_all(
        """
        SELECT *
        FROM course_sections
        WHERE course_id = $1
        ORDER BY order_index
        """,
        course_id
    )

    for section in sections:

        # 3️⃣ Get Lectures
        lectures = await db_handler.fetch_all(
            """
            SELECT *
            FROM course_lectures
            WHERE section_id = $1
            ORDER BY order_index
            """,
            section["section_id"]
        )

        for lecture in lectures:

            # 4️⃣ Get Resources
            resources = await db_handler.fetch_all(
                """
                SELECT *
                FROM lecture_resources
                WHERE lecture_id = $1
                """,
                lecture["lecture_id"]
            )

            lecture["resources"] = resources

        section["lectures"] = lectures

    course["sections"] = sections

    return course
