from properties.config import run_async_tasks
from properties.helper_psql import db_handler
from properties.log import app_logger


async def create_mcq_test(
    test_name: str,
    subject_id: int,
    target_grade_level: int,
    duration_minutes: int,
    max_total_marks: int,
    teacher_id: int,
    description: str = None,
):
    test_data = {
        "test_name": test_name,
        "subject_id": subject_id,
        "target_grade_level": target_grade_level,
        "duration_minutes": duration_minutes,
        "max_total_marks": max_total_marks,
        "teacher_id": teacher_id,
        "description": description,
    }

    test_id = await db_handler.insert_and_get_id(
        table_name="mcq_tests", data=test_data, id_column="test_id"
    )
    app_logger.info(f"Test created with Test ID: {test_id}")
    return test_id


async def get_mcq_test_list(subject_id: int, teacher_id: int, page: int, size: int):
    offset = (page - 1) * size
    limit = size

    query = f"""select mt.test_id, mt.test_name, mt.description, mt.subject_id, \
                    mt.target_grade_level, mt.duration_minutes, mt.max_total_marks,\
                    mt.is_active, mt.is_published
                from mcq_tests mt
                where teacher_id = {teacher_id} AND subject_id = {subject_id} and is_deleted = false
                order by mt.test_id DESC
                limit {limit} 
                offset {offset}
            """

    query_count = f"""select count(*)
                from mcq_tests mt
                where teacher_id = {teacher_id} AND subject_id = {subject_id}
            """

    results = db_handler.fetch_all_rows(query=query)
    results_count = db_handler.fetch_one_row(query=query_count)
    results, results_count = await run_async_tasks(results, results_count)

    return {"data": results, "count": results_count.get("count", 0)}


async def get_mcq_test_detail(test_id: int, teacher_id: int):
    query = f"""
        SELECT
            mt.test_id,
            mt.test_name,
            mt.description,
            mt.subject_id,
            s.subject_name,
            mt.target_grade_level,
            mt.duration_minutes,
            mt.max_total_marks,
            mt.is_active,
            mt.is_published
        FROM mcq_tests mt
        LEFT JOIN subjects s
            ON s.subject_id = mt.subject_id
        WHERE mt.test_id = {test_id}
          AND mt.teacher_id = {teacher_id}
          AND mt.is_deleted = false
        LIMIT 1;
    """
    return await db_handler.fetch_one_row(query=query)


async def add_question_to_test(
    test_id: int, question_id: int, correct_marks: float, negative_marks: float = 0.0
):
    test_data = {
        "test_id": test_id,
        "question_id": question_id,
        "correct_marks": correct_marks,
        "negative_marks": negative_marks,
    }

    # Check if marks increaes the total marks
    current_total_marks = f"""SELECT SUM(correct_marks) as current_total_marks
                    FROM mcq_test_questions
                    WHERE test_id = {test_id};
                    """

    total_marks = f"""SELECT max_total_marks FROM mcq_tests WHERE test_id = {test_id}"""
    current_total_marks = db_handler.fetch_one_row(query=current_total_marks)
    total_marks = db_handler.fetch_one_row(query=total_marks)
    
    current_total_marks, total_marks = await run_async_tasks(current_total_marks, total_marks)

    current_total_marks = current_total_marks.get("current_total_marks", 0)
    if not current_total_marks:
        current_total_marks = 0

    total_marks = total_marks.get("max_total_marks")
    if (float(current_total_marks) + correct_marks) > total_marks:
        raise ValueError(
            "Question cannot be added because adding the selected question would exceed the test's maximum allowed total marks."
        )

    test_question_id = await db_handler.insert_and_get_id(
        table_name="mcq_test_questions", data=test_data, id_column="test_question_id"
    )

    app_logger.info(f"Question Added to Test ID {test_id} with Test Question Id {test_question_id}")
    return "success"


async def fetch_question_options(question_id: int):
    question_options = f"""select mqo.option_id, mqo.option_text, mqo.is_correct 
                        from mcq_question_options mqo 
                        where mqo.question_id = {question_id}
                        order by mqo.option_id;
                    """
    question_options = await db_handler.fetch_all_rows(query=question_options)
    return question_options


async def get_mcq_test_questions(test_id: int, page: int = 1, size: int = 10):
    offset = (page - 1) * size
    limit = size

    # ---------------- QUESTIONS ----------------
    questions_query = f"""
        SELECT 
            mtq.test_question_id,
            mq.question_id,
            mq.subject_id,
            s.subject_name,
            mq.grade_level,
            mq.question_text,
            mq.topic_tag,
            mq.complexity_level,
            mtq.correct_marks,
            mtq.negative_marks
        FROM mcq_tests mt
        INNER JOIN mcq_test_questions mtq 
            ON mt.test_id = mtq.test_id
        INNER JOIN mcq_questions mq 
            ON mq.question_id = mtq.question_id
        LEFT JOIN subjects s
            ON s.subject_id = mq.subject_id
        WHERE mt.test_id = {test_id}
        ORDER BY mq.question_id
        LIMIT {limit}
        OFFSET {offset};
    """

    questions_query_count = f"""SELECT count(mtq.question_id)
        FROM mcq_tests mt
        INNER JOIN mcq_test_questions mtq 
        ON mt.test_id = mtq.test_id
        WHERE mt.test_id = {test_id};
    """

    questions = db_handler.fetch_all_rows(query=questions_query)
    questions_count = db_handler.fetch_one_row(query=questions_query_count)
    questions, questions_count = await run_async_tasks(questions, questions_count)

    if not questions:
        return []

    question_ids = [q["question_id"] for q in questions]

    # ---------------- OPTIONS ----------------
    options_query = f"""
        SELECT 
            option_id,
            option_text,
            is_correct,
            question_id
        FROM mcq_question_options
        WHERE question_id IN ({",".join(map(str, question_ids))})
        ORDER BY question_id, option_id;
    """

    options = await db_handler.fetch_all_rows(query=options_query)

    # ---------------- MERGE ----------------
    options_map = {}
    for opt in options:
        options_map.setdefault(opt["question_id"], []).append(
            {
                "option_id": opt["option_id"],
                "option_text": opt["option_text"],
                "is_correct": opt["is_correct"],
            }
        )

    for q in questions:
        q["options"] = options_map.get(q["question_id"], [])

    return {"data": questions, "count": questions_count.get("count", 0)}
