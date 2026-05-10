from fastapi import APIRouter, Depends, HTTPException, status
from properties.log import app_logger
from properties.config import run_async_tasks
from utils.authz import get_current_teacher
from properties.helper_psql import get_db_handler, AsyncDBHandler
from utils.teacher_subjects import ensure_teacher_subject_access
from schema import (
    MCQQuestionCreate,
    MCQQuestionUpdate,
    MCQTestCreate,
    MCQTestAddQuestion,
    GetMCQQuestions,
)
from utils.test_module.teachers.mcq_questions import (
    create_question_mcq,
    get_question_mcq_list,
)
from utils.test_module.teachers.mcq_tests import (
    create_mcq_test,
    get_mcq_test_list,
    get_mcq_test_detail,
    add_question_to_test,
    get_mcq_test_questions,
    get_test_reports,
)

router = APIRouter(tags=["Test Module Teacher"])


@router.get("/topic_tags/get")
async def get_topic_tags(
    subject_id: int,
    grade_level: int,
    db_handler: AsyncDBHandler = Depends(get_db_handler),
    user_info=Depends(get_current_teacher),
):
    """
    Get Unique Topic Tags Information
    """
    teacher_id = user_info.get("teacher_id")
    if not teacher_id:
        app_logger.error(f"teacher Id not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="teacher Not Found.",
        )

    app_logger.info(
        f"Getting Topic Tags for subject id {subject_id} and grade level {grade_level}"
    )

    try:
        if str(user_info.get("role", "")).lower() == "teacher":
            await ensure_teacher_subject_access(
                teacher_id=int(teacher_id), subject_id=int(subject_id)
            )
        query = f"""SELECT DISTINCT mq.topic_tag
                FROM mcq_questions mq
                WHERE mq.subject_id = {subject_id} AND mq.grade_level = {grade_level}
            """

        topic_tags = await db_handler.fetch_all_rows(query=query)
        topic_tags = [i.get("topic_tag") for i in topic_tags if i.get("topic_tag")]
        return topic_tags

    except Exception as e:
        # Catches unexpected errors (e.g., severe connection failure)
        app_logger.error(f"Unhandled error during Topic Tags info: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during Topic Tags.",
        )


@router.post("/mcq/question/create")
async def create_mcq_question(
    request: MCQQuestionCreate,
    user_info=Depends(get_current_teacher),
):
    """
    Create MCQ Question
    """
    teacher_id = user_info.get("teacher_id")
    if not teacher_id:
        app_logger.error("Teacher not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher Not Found.",
        )

    try:
        if str(user_info.get("role", "")).lower() == "teacher":
            await ensure_teacher_subject_access(
                teacher_id=int(teacher_id), subject_id=int(request.subject_id)
            )
        return await create_question_mcq(
            subject_id=request.subject_id,
            question_text=request.question_text.strip(),
            topic_tag=request.topic_tag.title(),
            grade_level=request.grade_level,
            complexity_level=request.complexity_level.upper(),
            explanation_text=request.explanation_text,
            teacher_id=teacher_id,
            options=request.options,
            image_path=request.image_path,
            marks=request.marks,
            negative_marks=request.negative_marks,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    except Exception as e:
        app_logger.error(
            f"Unhandled error during mcq question creation: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during mcq question creation.",
        )


@router.post("/mcq/questions")
async def get_mcq_questions(
    request: GetMCQQuestions,
    user_info=Depends(get_current_teacher),
):
    """
    Get MCQ Questions
    """
    teacher_id = user_info.get("teacher_id")
    if not teacher_id:
        app_logger.error(f"Teacher not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher Not Found.",
        )

    try:
        if str(user_info.get("role", "")).lower() == "teacher":
            await ensure_teacher_subject_access(
                teacher_id=int(teacher_id), subject_id=int(request.subject_id)
            )
        result = await get_question_mcq_list(
            subject_id=request.subject_id,
            grade_level=request.grade_level,
            test_id=request.test_id,
            topic_tag=request.topic_tag,
            complexity_level=request.complexity_level,
            get_all=request.get_all,
            teacher_id=teacher_id,
            page=request.page,
            size=request.size,
        )
        return result
    except ValueError as e:
        # Catches the specific UniqueViolationError handled in insert_and_get_id
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        # Catches unexpected errors (e.g., severe connection failure)
        app_logger.error(
            f"Unhandled error in getting mcq questions list for subject id {request.subject_id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error in getting mcq questions list",
        )

@router.put("/mcq/question/update")
async def update_mcq_question(
    question_id: int,
    request: MCQQuestionUpdate,
    db_handler: AsyncDBHandler = Depends(get_db_handler),
    user_info=Depends(get_current_teacher),
):
    teacher_id = user_info.get("teacher_id")
    if not teacher_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher Not Found.",
        )

    try:
        # Fetch existing question for comparison
        fetch_query = f"""
            SELECT subject_id, grade_level
            FROM mcq_questions
            WHERE question_id = {question_id}
        """

        existing = await db_handler.pool.fetchrow(fetch_query)

        if not existing:
            raise HTTPException(
                status_code=404,
                detail="Question not found."
            )

        if str(user_info.get("role", "")).lower() == "teacher":
            await ensure_teacher_subject_access(
                teacher_id=int(teacher_id), subject_id=int(existing["subject_id"])
            )

        # Check if someone tries to update subject_id
        if (
            request.subject_id is not None
            and request.subject_id != existing["subject_id"]
        ):
            raise HTTPException(
                status_code=400,
                detail="You are not allowed to update subject."
            )

        # Check if someone tries to update grade_level
        if (
            request.grade_level is not None
            and request.grade_level != existing["grade_level"]
        ):
            raise HTTPException(
                status_code=400,
                detail="You are not allowed to update grade level."
            )

        # Build allowed updates only
        set_statement = f"teacher_id = {teacher_id}"

        set_statement += (
            f", question_text = '{request.question_text}' "
            if request.question_text
            else ", question_text = NULL"
        )
        set_statement += (
            f", topic_tag = '{request.topic_tag}' "
            if request.topic_tag
            else ", topic_tag = NULL"
        )
        set_statement += (
            f", complexity_level = '{request.complexity_level}' "
            if request.complexity_level
            else ", complexity_level = NULL"
        )
        set_statement += (
            f", explanation_text = '{request.explanation_text}' "
            if request.explanation_text
            else ", explanation_text = NULL"
        )
        set_statement += (
            f", image_path = '{request.image_path}' "
            if request.image_path
            else ", image_path = NULL"
        )
        set_statement += (
            f", marks = {request.marks} "
            if request.marks is not None
            else ", marks = NULL"
        )
        set_statement += (
            f", negative_marks = {float(request.negative_marks)} "
            if request.negative_marks is not None
            else ", negative_marks = 0.0"
        )

        option_values = ", ".join(
            [
                f"""({i.option_id}, '{i.option_text}', {i.is_correct})"""
                for i in request.options
            ]
        )

        query = f"""
            UPDATE mcq_questions
            SET {set_statement}, updated_at = NOW()
            WHERE question_id = {question_id};

            UPDATE mcq_question_options AS t
            SET option_text = v.option_text,
                is_correct = v.is_correct,
                updated_at = NOW()
            FROM (VALUES 
                {option_values}
            ) AS v(option_id, option_text, is_correct)
            WHERE t.option_id = v.option_id;
        """

        await db_handler.execute_command(query=query)

        return {"message": "success"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal Server Error: {e}"
        )

@router.delete("/mcq/question/delete")
async def delete_mcq_question(
    question_id: int,
    user_info=Depends(get_current_teacher),
    db_handler: AsyncDBHandler = Depends(get_db_handler),
):
    """
    Delete MCQ Question
    """
    teacher_id = user_info.get("teacher_id")
    if not teacher_id:
        app_logger.error("Teacher not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher Not Found.",
        )

    try:
        # -------------------------------------------------
        # 1. CHECK QUESTION OWNER (TEACHER VALIDATION)
        # -------------------------------------------------
        owner_query = f"""
            SELECT teacher_id
            FROM mcq_questions
            WHERE question_id = {question_id}
        """
        owner = await db_handler.fetch_one_row(query=owner_query)

        if not owner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found",
            )

        if owner["teacher_id"] != teacher_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not allowed to delete other teacher's question",
            )

        # -------------------------------------------------
        # 2. CHECK IF QUESTION USED IN PUBLISHED TEST
        # -------------------------------------------------
        query = f"""
            SELECT mtq.question_id
            FROM mcq_tests mt
            INNER JOIN mcq_test_questions mtq
                ON mtq.test_id = mt.test_id
            WHERE mtq.question_id = {question_id}
              AND mt.is_published = true
        """
        question_check = await db_handler.fetch_one_row(query=query)

        if question_check:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Question Exists in Published Papers are Not Allowed to Delete",
            )

        # -------------------------------------------------
        # 3. DELETE QUESTION & OPTIONS
        # -------------------------------------------------
        query = f"""
            DELETE FROM mcq_questions
            WHERE question_id = {question_id};

            DELETE FROM mcq_question_options
            WHERE question_id = {question_id};
        """
        result = await db_handler.execute_command(query=query)

        rows_affected = int(result.split(" ")[-1])
        app_logger.info(f"Rows Affected in Delete MCQ Question {rows_affected}")

        return "success"

    except HTTPException:
        raise

    except Exception as e:
        app_logger.error(
            f"Unhandled error during mcq question delete: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during mcq question deletion.",
        )


@router.post("/mcq/test/create")
async def mcq_test_create(
    request: MCQTestCreate,
    user_info=Depends(get_current_teacher),
):
    """
    Create MCQ Test Paper
    """
    teacher_id = user_info.get("teacher_id")
    if not teacher_id:
        app_logger.error(f"Teacher not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher Not Found.",
        )

    try:
        if str(user_info.get("role", "")).lower() == "teacher":
            await ensure_teacher_subject_access(
                teacher_id=int(teacher_id), subject_id=int(request.subject_id)
            )
        test_id = await create_mcq_test(
            test_name=request.test_name,
            subject_id=request.subject_id,
            target_grade_level=request.target_grade_level,
            duration_minutes=request.duration_minutes,
            max_total_marks=request.max_total_marks,
            teacher_id=teacher_id,
            description=request.description,
        )

        return test_id

    except ValueError as e:
        # Catches the specific UniqueViolationError handled in insert_and_get_id
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        # Catches unexpected errors (e.g., severe connection failure)
        app_logger.error(
            f"Unhandled error during mcq test creation : {e}", exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during mcq test creation.",
        )


@router.get("/mcq/tests")
async def get_mcq_tests(
    subject_id: int,
    page: int = 1,
    size: int = 10,
    user_info=Depends(get_current_teacher),
):
    """
    Get MCQ Test Papers
    """
    teacher_id = user_info.get("teacher_id")
    if not teacher_id:
        app_logger.error(f"Teacher not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher Not Found.",
        )

    try:
        if str(user_info.get("role", "")).lower() == "teacher":
            await ensure_teacher_subject_access(
                teacher_id=int(teacher_id), subject_id=int(subject_id)
            )
        result = await get_mcq_test_list(
            subject_id=subject_id, teacher_id=teacher_id, page=page, size=size
        )
        return result
    except ValueError as e:
        # Catches the specific UniqueViolationError handled in insert_and_get_id
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        # Catches unexpected errors (e.g., severe connection failure)
        app_logger.error(
            f"Unhandled error in getting mcq tests for subject id {subject_id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error in getting mcq tests.",
        )


@router.get("/mcq/test/reports")
async def get_mcq_test_reports_route(
    test_id: int,
    user_info=Depends(get_current_teacher),
):
    """
    Returns analytics for a single test: summary stats + per-attempt rows.
    """
    teacher_id = user_info.get("teacher_id")
    if not teacher_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher Not Found.",
        )

    try:
        result = await get_test_reports(test_id=test_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test not found.",
            )

        if str(user_info.get("role", "")).lower() == "teacher":
            await ensure_teacher_subject_access(
                teacher_id=int(teacher_id),
                subject_id=int(result["test"]["subject_id"]),
            )

        return result
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(
            f"Unhandled error in getting test reports for test {test_id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred while fetching test reports.",
        )


@router.get("/mcq/test/detail")
async def get_mcq_test_detail_route(
    test_id: int,
    user_info=Depends(get_current_teacher),
):
    teacher_id = user_info.get("teacher_id")
    if not teacher_id:
        app_logger.error("Teacher not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher Not Found.",
        )

    try:
        result = await get_mcq_test_detail(test_id=test_id, teacher_id=teacher_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test not found.",
            )

        if str(user_info.get("role", "")).lower() == "teacher":
            await ensure_teacher_subject_access(
                teacher_id=int(teacher_id), subject_id=int(result["subject_id"])
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(
            f"Unhandled error in getting mcq test detail for test id {test_id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error in getting mcq test detail.",
        )


@router.put("/mcq/test/update")
async def mcq_test_update(
    test_id: int,
    request: MCQTestCreate,
    db_handler: AsyncDBHandler = Depends(get_db_handler),
    user_info=Depends(get_current_teacher),
):
    """
    Update MCQ Test Paper Information for given test_id
    """
    teacher_id = user_info.get("teacher_id")
    if not teacher_id:
        app_logger.error(f"Teacher not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher Not Found.",
        )

    try:
        set_condition = f"""test_name = '{request.test_name}', subject_id = {request.subject_id}, \
                    target_grade_level = {request.target_grade_level}, duration_minutes = {request.duration_minutes},\
                    max_total_marks = {request.max_total_marks}, teacher_id = {teacher_id}
                    """

        set_condition += (
            f", description = '{request.description}' "
            if request.description
            else " , description = NULL"
        )

        query = f"""UPDATE mcq_tests
                    SET {set_condition}, updated_at = NOW()
                    WHERE test_id = {test_id}
                """

        result = await db_handler.execute_command(query=query)
        rows_affected = int(result.split(" ")[-1])
        app_logger.info(
            f"Rows Affected in Update Test for Test Id {test_id} - {rows_affected}"
        )
        return "success"

    except Exception as e:
        # Catches unexpected errors (e.g., severe connection failure)
        app_logger.error(f"Unhandled error during mcq test update : {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during mcq test update.",
        )


@router.delete("/mcq/test/delete")
async def mcq_test_delete(
    test_id: int,
    db_handler: AsyncDBHandler = Depends(get_db_handler),
    user_info=Depends(get_current_teacher),
):
    """
    Delete MCQ Test Paper for given test_id
    """
    teacher_id = user_info.get("teacher_id")
    if not teacher_id:
        app_logger.error(f"Teacher not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher Not Found.",
        )
    try:
        query = f"""SELECT test_id
                    FROM mcq_tests
                    WHERE test_id = {test_id};
                """

        result = await db_handler.fetch_one_row(query=query)
        if result.get("is_active", False):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Active Test are not allowed to Delete",
            )
        elif result.get("is_published", False):
            query = f"""UPDATE mcq_tests
                        SET is_deleted = true
                        WHERE test_id = {test_id};
                """
        else:
            query = f"""DELETE FROM mcq_tests
                        WHERE test_id = {test_id};

                        DELETE FROM mcq_test_questions
                        WHERE test_id = {test_id};
                    """

        result = await db_handler.execute_command(query=query)
        rows_affected = int(result.split(" ")[-1])
        app_logger.info(
            f"Rows Affected in Delete Test for Test Id {test_id} - {rows_affected}"
        )
        return "success"
    except Exception as e:
        # Catches unexpected errors (e.g., severe connection failure)
        app_logger.error(f"Unhandled error during mcq test delete : {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during mcq test delete.",
        )


@router.post("/mcq/test/question/add")
async def mcq_test_add_question(
    request: MCQTestAddQuestion,
    user_info=Depends(get_current_teacher),
):
    """
    Add Question to Test
    """
    teacher_id = user_info.get("teacher_id")
    if not teacher_id:
        app_logger.error(f"Teacher not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher Not Found.",
        )

    try:
        msg = await add_question_to_test(
            test_id=request.test_id,
            question_id=request.question_id,
            correct_marks=request.correct_marks,
            negative_marks=request.negative_marks,
        )
        return msg
    except ValueError as e:
        # Catches the specific UniqueViolationError handled in insert_and_get_id
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        # Catches unexpected errors (e.g., severe connection failure)
        app_logger.error(
            f"Unhandled error during adding question to test: {e}", exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during adding question to test.",
        )


@router.get("/mcq/test/questions")
async def get_test_questions_mcq(
    test_id: int,
    page: int = 1,
    size: int = 10,
    user_info=Depends(get_current_teacher),
):
    """
    Get MCQ Questions with Options for a Test
    """
    teacher_id = user_info.get("teacher_id")
    if not teacher_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher Not Found.",
        )

    try:
        return await get_mcq_test_questions(
            test_id=test_id,
            page=page,
            size=size,
        )
    except Exception as e:
        app_logger.error(
            f"Unhandled error during fetching questions for test {test_id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred fetching questions.",
        )


@router.put("/mcq/test/question/update")
async def mcq_test_update_question(
    test_question_id: int,
    request: MCQTestAddQuestion,
    db_handler: AsyncDBHandler = Depends(get_db_handler),
    user_info=Depends(get_current_teacher),
):
    """
    Update Question Info to Test
    """
    teacher_id = user_info.get("teacher_id")
    if not teacher_id:
        app_logger.error(f"Teacher not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher Not Found.",
        )

    try:
        query = f"""UPDATE mcq_test_questions
                    SET test_id = {request.test_id}, question_id = {request.question_id}, \
                        correct_marks = {request.correct_marks}, negative_marks = {request.negative_marks}, updated_at = NOW()
                    WHERE test_question_id = {test_question_id}
                """

        result = await db_handler.execute_command(query=query)
        rows_affected = int(result.split(" ")[-1])
        app_logger.info(
            f"Rows Affected in Update Test for Test Question Id {test_question_id} - {rows_affected}"
        )
        return "success"
    except ValueError as e:
        # Catches the specific UniqueViolationError handled in insert_and_get_id
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        # Catches unexpected errors (e.g., severe connection failure)
        app_logger.error(
            f"Unhandled error during updating question to test: {e}", exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during updating question to test.",
        )


@router.delete("/mcq/test/question/delete")
async def mcq_test_delete_question(
    test_question_id: int,
    db_handler: AsyncDBHandler = Depends(get_db_handler),
    user_info=Depends(get_current_teacher),
):
    """
    Delete Question to Test
    """
    teacher_id = user_info.get("teacher_id")
    if not teacher_id:
        app_logger.error(f"Teacher not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher Not Found.",
        )

    try:
        query = f"""DELETE FROM mcq_test_questions
                    WHERE test_question_id = {test_question_id}
                """

        result = await db_handler.execute_command(query=query)
        rows_affected = int(result.split(" ")[-1])
        app_logger.info(
            f"Rows Affected in Delete Test for Test Question Id {test_question_id} - {rows_affected}"
        )
        return "success"
    except ValueError as e:
        # Catches the specific UniqueViolationError handled in insert_and_get_id
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        # Catches unexpected errors (e.g., severe connection failure)
        app_logger.error(
            f"Unhandled error during deleting question to test: {e}", exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during deleting question to test.",
        )


@router.get("/mcq/test/publish")
async def publish_mcq_test(
    test_id: int,
    db_handler: AsyncDBHandler = Depends(get_db_handler),
    user_info=Depends(get_current_teacher),
):
    """
    Publish a MCQ Test
    """
    teacher_id = user_info.get("teacher_id")
    if not teacher_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher Not Found.",
        )
    
    # Check if Total marks Equals Sum of marks
    current_total_marks = f"""SELECT SUM(correct_marks) as current_total_marks
                    FROM mcq_test_questions
                    WHERE test_id = {test_id};
                    """

    total_marks = (
        f"""SELECT max_total_marks FROM mcq_tests WHERE test_id = {test_id}"""
    )

    current_total_marks = db_handler.fetch_one_row(query=current_total_marks)
    total_marks = db_handler.fetch_one_row(query=total_marks)

    current_total_marks, total_marks = await run_async_tasks(
        current_total_marks, total_marks
    )

    current_total_marks = current_total_marks.get("current_total_marks", 0)
    if not current_total_marks:
        current_total_marks = 0

    total_marks = total_marks.get("max_total_marks")

    if current_total_marks != total_marks:
        app_logger.info(
            f"Total Marks of questions does not matched with the Maximum Marks of the Test."
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Total Marks of questions does not matched with the Maximum Marks of the Test. Total Marks: {current_total_marks}, Max Marks: {total_marks}",
        )

    query = f"""UPDATE mcq_tests
                SET is_published = true
                WHERE test_id = {test_id}
            """

    result = await db_handler.execute_command(query=query)
    rows_affected = int(result.split(" ")[-1])
    app_logger.info(f"Rows Affected in Update Test Publish - {rows_affected}")
    return "success"


@router.get("/mcq/test/active")
async def active_mcq_test(
    test_id: int,
    db_handler: AsyncDBHandler = Depends(get_db_handler),
    user_info=Depends(get_current_teacher),
):
    """
    Active a MCQ Test
    """
    teacher_id = user_info.get("teacher_id")
    if not teacher_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher Not Found.",
        )
    
    # Check if Test is Published
    query = f"""SELECT is_published
                FROM mcq_tests
                WHERE test_id = {test_id}
            """

    is_published = await db_handler.fetch_one_row(query=query)
    is_published = is_published.get("is_published", False)
    if not is_published:
        app_logger.info(f"Test Id {test_id} if not Published")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Only Published Tests are allowed to Active.",
        )

    query = f"""UPDATE mcq_tests
                SET is_active = true
                WHERE test_id = {test_id}
            """

    result = await db_handler.execute_command(query=query)
    rows_affected = int(result.split(" ")[-1])
    app_logger.info(f"Rows Affected in Update Test Active - {rows_affected}")
    return "success"


@router.get("/mcq/test/deactive")
async def deactive_mcq_test(
    test_id: int,
    db_handler: AsyncDBHandler = Depends(get_db_handler),
    user_info=Depends(get_current_teacher),
):
    """
    De Active a MCQ Test
    """
    teacher_id = user_info.get("teacher_id")
    if not teacher_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher Not Found.",
        )
    
    query = f"""UPDATE mcq_tests
                SET is_active = false
                WHERE test_id = {test_id}
            """

    result = await db_handler.execute_command(query=query)
    rows_affected = int(result.split(" ")[-1])
    app_logger.info(f"Rows Affected in Update Test De Active - {rows_affected}")
    return "success"
