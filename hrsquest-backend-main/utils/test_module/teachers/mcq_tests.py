from properties.config import run_async_tasks
from properties.helper_psql import db_handler
from properties.log import app_logger
from utils.test_module.students.mcq_tests import format_dt_ist


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

    # total_questions and max_total_marks are computed from rows joined with a
    # valid mcq_questions row, so orphan mcq_test_questions entries (left over
    # from older buggy updates) don't inflate the counts shown on test cards.
    query = f"""select mt.test_id, mt.test_name, mt.description, mt.subject_id, \
                    mt.target_grade_level, mt.duration_minutes,
                    mt.is_active, mt.is_published,
                    COALESCE((
                        SELECT COUNT(*) FROM mcq_test_questions mtq
                        INNER JOIN mcq_questions mq ON mq.question_id = mtq.question_id
                        WHERE mtq.test_id = mt.test_id
                    ), 0) AS total_questions,
                    COALESCE((
                        SELECT SUM(mtq.correct_marks) FROM mcq_test_questions mtq
                        INNER JOIN mcq_questions mq ON mq.question_id = mtq.question_id
                        WHERE mtq.test_id = mt.test_id
                    ), mt.max_total_marks, 0) AS max_total_marks
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
            mt.is_active,
            mt.is_published,
            COALESCE((
                SELECT COUNT(*) FROM mcq_test_questions mtq
                INNER JOIN mcq_questions mq ON mq.question_id = mtq.question_id
                WHERE mtq.test_id = mt.test_id
            ), 0) AS total_questions,
            COALESCE((
                SELECT SUM(mtq.correct_marks) FROM mcq_test_questions mtq
                INNER JOIN mcq_questions mq ON mq.question_id = mtq.question_id
                WHERE mtq.test_id = mt.test_id
            ), mt.max_total_marks, 0) AS max_total_marks
        FROM mcq_tests mt
        LEFT JOIN subjects s
            ON s.subject_id = mt.subject_id
        WHERE mt.test_id = {test_id}
          AND mt.teacher_id = {teacher_id}
          AND mt.is_deleted = false
        LIMIT 1;
    """
    return await db_handler.fetch_one_row(query=query)


async def get_test_reports(test_id: int):
    """
    Returns aggregate analytics for a single test plus a list of every attempt
    (in-progress and submitted) along with the student who attempted it.
    """
    test_query = f"""
        SELECT mt.test_id, mt.test_name, mt.subject_id, s.subject_name,
               mt.target_grade_level, mt.duration_minutes,
               mt.is_active, mt.is_published,
               COALESCE((
                   SELECT COUNT(*) FROM mcq_test_questions mtq
                   INNER JOIN mcq_questions mq ON mq.question_id = mtq.question_id
                   WHERE mtq.test_id = mt.test_id
               ), 0) AS total_questions,
               COALESCE((
                   SELECT SUM(mtq.correct_marks) FROM mcq_test_questions mtq
                   INNER JOIN mcq_questions mq ON mq.question_id = mtq.question_id
                   WHERE mtq.test_id = mt.test_id
               ), mt.max_total_marks, 0) AS max_total_marks
        FROM mcq_tests mt
        LEFT JOIN subjects s ON s.subject_id = mt.subject_id
        WHERE mt.test_id = {test_id}
          AND mt.is_deleted = false
        LIMIT 1
    """

    attempts_query = f"""
        SELECT ta.attempt_id, ta.student_id, st.student_name,
               st.email AS student_email, st.grade_level,
               ta.start_time, ta.submit_time, ta.is_submitted,
               ta.final_score, ta.total_correct, ta.total_incorrect,
               CASE
                   WHEN ta.submit_time IS NOT NULL
                   THEN EXTRACT(EPOCH FROM (ta.submit_time - ta.start_time))::INT
                   ELSE NULL
               END AS duration_seconds
        FROM test_attempts ta
        LEFT JOIN students st ON st.student_id = ta.student_id
        WHERE ta.test_id = {test_id}
        ORDER BY ta.is_submitted DESC,
                 ta.submit_time DESC NULLS LAST,
                 ta.start_time DESC
    """

    summary_query = f"""
        SELECT
            COUNT(*) AS total_attempts,
            COUNT(*) FILTER (WHERE is_submitted = TRUE) AS submitted_attempts,
            COUNT(*) FILTER (WHERE is_submitted = FALSE) AS in_progress_attempts,
            COUNT(DISTINCT student_id) AS unique_students,
            COALESCE(AVG(final_score) FILTER (WHERE is_submitted = TRUE), 0) AS average_score,
            COALESCE(MAX(final_score) FILTER (WHERE is_submitted = TRUE), 0) AS highest_score,
            COALESCE(MIN(final_score) FILTER (WHERE is_submitted = TRUE), 0) AS lowest_score,
            COALESCE(AVG(total_correct) FILTER (WHERE is_submitted = TRUE), 0) AS average_correct,
            COALESCE(
                AVG(EXTRACT(EPOCH FROM (submit_time - start_time)))
                    FILTER (WHERE is_submitted = TRUE),
                0
            ) AS average_time_seconds
        FROM test_attempts
        WHERE test_id = {test_id}
    """

    test_row, attempts_rows, summary_row = await run_async_tasks(
        db_handler.fetch_one_row(query=test_query),
        db_handler.fetch_all_rows(query=attempts_query),
        db_handler.fetch_one_row(query=summary_query),
    )

    if not test_row:
        return None

    attempts_list = []
    for row in attempts_rows or []:
        attempts_list.append({
            "attempt_id": row["attempt_id"],
            "student_id": row["student_id"],
            "student_name": row.get("student_name"),
            "student_email": row.get("student_email"),
            "grade_level": row.get("grade_level"),
            "start_time": format_dt_ist(row.get("start_time")),
            "submit_time": format_dt_ist(row.get("submit_time")),
            "is_submitted": row.get("is_submitted"),
            "final_score": float(row["final_score"]) if row.get("final_score") is not None else None,
            "total_correct": row.get("total_correct"),
            "total_incorrect": row.get("total_incorrect"),
            "duration_seconds": row.get("duration_seconds"),
        })

    summary = {
        "total_attempts": int(summary_row.get("total_attempts") or 0),
        "submitted_attempts": int(summary_row.get("submitted_attempts") or 0),
        "in_progress_attempts": int(summary_row.get("in_progress_attempts") or 0),
        "unique_students": int(summary_row.get("unique_students") or 0),
        "average_score": float(summary_row.get("average_score") or 0),
        "highest_score": float(summary_row.get("highest_score") or 0),
        "lowest_score": float(summary_row.get("lowest_score") or 0),
        "average_correct": float(summary_row.get("average_correct") or 0),
        "average_time_seconds": float(summary_row.get("average_time_seconds") or 0),
    }

    test_info = {
        "test_id": test_row["test_id"],
        "test_name": test_row.get("test_name"),
        "subject_id": test_row.get("subject_id"),
        "subject_name": test_row.get("subject_name"),
        "target_grade_level": test_row.get("target_grade_level"),
        "duration_minutes": test_row.get("duration_minutes"),
        "max_total_marks": float(test_row["max_total_marks"]) if test_row.get("max_total_marks") is not None else 0,
        "is_active": test_row.get("is_active"),
        "is_published": test_row.get("is_published"),
        "total_questions": int(test_row.get("total_questions") or 0),
    }

    return {"test": test_info, "summary": summary, "attempts": attempts_list}


async def _sync_test_max_marks(test_id: int):
    """
    Recompute mcq_tests.max_total_marks from the sum of correct_marks of every
    question currently linked to the test. Only rows that join with a valid
    mcq_questions row are counted, so orphan mcq_test_questions entries do
    not pollute the stored value.
    """
    sync_query = f"""
        UPDATE mcq_tests
        SET max_total_marks = COALESCE(
            (
                SELECT SUM(mtq.correct_marks)
                FROM mcq_test_questions mtq
                INNER JOIN mcq_questions mq ON mq.question_id = mtq.question_id
                WHERE mtq.test_id = {test_id}
            ),
            0
        ),
        updated_at = NOW()
        WHERE test_id = {test_id}
    """
    await db_handler.execute_command(query=sync_query)


async def add_question_to_test(
    test_id: int, question_id: int, correct_marks: float, negative_marks: float = 0.0
):
    test_data = {
        "test_id": test_id,
        "question_id": question_id,
        "correct_marks": correct_marks,
        "negative_marks": negative_marks,
    }

    test_question_id = await db_handler.insert_and_get_id(
        table_name="mcq_test_questions", data=test_data, id_column="test_question_id"
    )

    # Keep mcq_tests.max_total_marks aligned with the actual sum.
    await _sync_test_max_marks(test_id)

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
    # Use the master question's marks / negative_marks as the source of truth
    # so the preview shows what was actually configured on the question itself.
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
            mq.explanation_text,
            mq.image_path,
            COALESCE(mq.marks, mtq.correct_marks, 1) AS correct_marks,
            COALESCE(mq.negative_marks, mtq.negative_marks, 0) AS negative_marks,
            mtq.correct_marks AS test_correct_marks,
            mtq.negative_marks AS test_negative_marks
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
