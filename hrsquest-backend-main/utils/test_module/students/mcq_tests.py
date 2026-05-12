from properties.helper_psql import db_handler
import random
from datetime import timedelta
from zoneinfo import ZoneInfo
import pytz

IST = pytz.timezone("Asia/Kolkata")

def format_time_only_ist(dt):
    if not dt:
        return None

    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)

    return dt.astimezone(IST).strftime("%I:%M:%S %p")



IST = ZoneInfo("Asia/Kolkata")
UTC = ZoneInfo("UTC")


#get test list
async def get_mcq_test_list(
    grade_level: int,
    subject_id: int,
    student_id: int,
    page: int,
    size: int
):
    offset = (page - 1) * size
    limit = size

    query = f"""
        SELECT
            mt.test_id,
            mt.test_name,
            mt.description,
            mt.target_grade_level,
            mt.duration_minutes,
            mt.max_total_marks,
            mt.is_active,
            COALESCE((
                SELECT COUNT(*) FROM mcq_test_questions mtq
                WHERE mtq.test_id = mt.test_id
            ), 0) AS total_questions
        FROM mcq_tests mt
        WHERE mt.subject_id = {subject_id}
          AND mt.is_published = true
          AND mt.target_grade_level = {grade_level}

          AND NOT EXISTS (
              SELECT 1
              FROM test_attempts ta
              WHERE ta.test_id = mt.test_id
                AND ta.student_id = {student_id}
          )

        ORDER BY mt.test_id
        LIMIT {limit}
        OFFSET {offset}
    """

    results = await db_handler.fetch_all_rows(query=query)
    return results


#start test function 
async def start_test(test_id: int, student_id: int):

    # 1) Insert attempt
    insert_attempt_query = f"""
        INSERT INTO test_attempts (test_id, student_id, start_time)
        VALUES ({test_id}, {student_id}, NOW())
        RETURNING attempt_id
    """
    attempt_row = await db_handler.fetch_one_row(query=insert_attempt_query)

    if not attempt_row or "attempt_id" not in attempt_row:
        return {"message": "Failed to start test"}

    attempt_id = attempt_row["attempt_id"]

    # 2) Get questions
    question_query = f"""
        SELECT question_id
        FROM mcq_test_questions
        WHERE test_id = {test_id}
    """
    question_rows = await db_handler.fetch_all_rows(query=question_query)

    if not question_rows:
        return {"message": "No questions found for this test", "attempt_id": attempt_id}

    question_ids = [row["question_id"] for row in question_rows]

    # 3) Shuffle
    random.shuffle(question_ids)

    # 4) Insert attempt_answers
    for index, question_id in enumerate(question_ids, start=1):
        insert_answer_query = f"""
            INSERT INTO attempt_answers (attempt_id, question_id, question_order)
            VALUES ({attempt_id}, {question_id}, {index})
            ON CONFLICT (attempt_id, question_id) DO NOTHING
        """
        await db_handler.fetch_one_row(query=insert_answer_query)

    return {
        "message": "Test started successfully",
        "attempt_id": attempt_id,
    }

#get current test info
def format_dt_ist(dt):
    if not dt:
        return None

    # ✅ if datetime is naive, assume UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)

    dt_ist = dt.astimezone(IST)

    # ✅ format: 02:53 PM
    return dt_ist.strftime("%Y-%m-%d %I:%M:%S %p")

async def get_attempt_status(attempt_id: int):

    attempt_query = f"""
        SELECT test_id, start_time
        FROM test_attempts
        WHERE attempt_id = {attempt_id}
    """
    attempt_row = await db_handler.fetch_one_row(query=attempt_query)

    if not attempt_row:
        return {"message": "Attempt not found"}

    test_id = attempt_row["test_id"]
    start_time = attempt_row["start_time"]

    test_query = f"""
        SELECT test_name, description, duration_minutes, max_total_marks
        FROM mcq_tests
        WHERE test_id = {test_id}
    """
    test_row = await db_handler.fetch_one_row(query=test_query)

    if not test_row:
        return {"message": "Test not found"}

    duration_minutes = test_row["duration_minutes"] or 0
    test_name = test_row.get("test_name")
    test_description = test_row.get("description")
    max_total_marks = test_row.get("max_total_marks")

    end_time = start_time + timedelta(minutes=duration_minutes)

    answers_query = f"""
        SELECT question_order, selected_option_id
        FROM attempt_answers
        WHERE attempt_id = {attempt_id}
        ORDER BY question_order
    """
    answers_rows = await db_handler.fetch_all_rows(query=answers_query)

    total_questions = len(answers_rows)

    questions_obj = {}
    for row in answers_rows:
        q_order = row["question_order"]
        selected_option_id = row["selected_option_id"]
        questions_obj[str(q_order)] = True if selected_option_id is not None else False

    return {
        "attempt_id": attempt_id,
        "test_id": test_id,
        "test_name": test_name,
        "test_description": test_description,
        "max_total_marks": float(max_total_marks) if max_total_marks is not None else None,
        "start_time": format_dt_ist(start_time),   # ✅ IST
        "duration_minutes": duration_minutes,
        "end_time": format_dt_ist(end_time),       # ✅ IST
        "total_questions": total_questions,
        "questions": questions_obj
    }

#get question options of the question order and attmept id 
async def get_question(attempt_id: int, question_order: int):

    # 1) Get question_id + marks. Prefer master question values (mq.marks / mq.negative_marks)
    #    so the test page reflects the question's actual configuration, falling back to the
    #    per-test override if explicitly set.
    qid_query = f"""
        SELECT aa.question_id, aa.selected_option_id,
               COALESCE(mq.marks, mtq.correct_marks, 1) AS correct_marks,
               COALESCE(mq.negative_marks, mtq.negative_marks, 0) AS negative_marks
        FROM attempt_answers aa
        LEFT JOIN test_attempts ta ON ta.attempt_id = aa.attempt_id
        LEFT JOIN mcq_test_questions mtq
            ON mtq.test_id = ta.test_id
           AND mtq.question_id = aa.question_id
        LEFT JOIN mcq_questions mq
            ON mq.question_id = aa.question_id
        WHERE aa.attempt_id = {attempt_id}
          AND aa.question_order = {question_order}
    """
    attempt_answer_row = await db_handler.fetch_one_row(query=qid_query)

    if not attempt_answer_row:
        return {"message": "Question not found for this attempt/order"}

    question_id = attempt_answer_row["question_id"]
    selected_option_id = attempt_answer_row["selected_option_id"]
    correct_marks = attempt_answer_row.get("correct_marks")
    negative_marks = attempt_answer_row.get("negative_marks")

    # 2) Get Question details from mcq_questions (recommended)
    question_query = f"""
        SELECT question_id, question_text, image_path
        FROM mcq_questions
        WHERE question_id = {question_id}
    """
    question_row = await db_handler.fetch_one_row(query=question_query)

    if not question_row:
        return {"message": "Question not found in database"}

    # 3) Get options from mcq_question_options
    options_query = f"""
        SELECT option_id, option_text
        FROM mcq_question_options
        WHERE question_id = {question_id}
        ORDER BY option_id
    """
    options_rows = await db_handler.fetch_all_rows(query=options_query)

    # 4) Build response
    return {
        # "attempt_id": attempt_id,
        # "question_order": question_order,
        # "question_id": question_id,
        # "selected_option_id": selected_option_id,
        "question_text": question_row["question_text"],
        "image_path": question_row.get("image_path"),
        "correct_marks": float(correct_marks) if correct_marks is not None else None,
        "negative_marks": float(negative_marks) if negative_marks is not None else None,
        "options": options_rows
    }

# saving ans in db
async def save_answer(attempt_id: int, question_order: int, option_id: int):

    # 1) Check attempt question exists
    check_query = f"""
        SELECT attempt_id, question_id
        FROM attempt_answers
        WHERE attempt_id = {attempt_id}
          AND question_order = {question_order}
    """
    row = await db_handler.fetch_one_row(query=check_query)

    if not row:
        return {"message": "Invalid attempt_id or question_order"}

    # 2) Update selected_option_id
    update_query = f"""
        UPDATE attempt_answers
        SET selected_option_id = {option_id}
        WHERE attempt_id = {attempt_id}
          AND question_order = {question_order}
        RETURNING attempt_id, question_id, selected_option_id
    """
    updated = await db_handler.fetch_one_row(query=update_query)

    return {
        "message": "Answer saved successfully"
    }


# final submit the paper
async def submit_test(attempt_id: int):

    # 1) Get test attempt details
    attempt_query = f"""
        SELECT attempt_id, test_id, is_submitted
        FROM test_attempts
        WHERE attempt_id = {attempt_id}
    """
    attempt_row = await db_handler.fetch_one_row(query=attempt_query)

    if not attempt_row:
        return {"message": "Attempt not found"}

    test_id = attempt_row["test_id"]

    # Prevent double submit
    if attempt_row.get("is_submitted") is True:
        return {"message": "Test already submitted"}

    # 2) Get all answers of the attempt
    answers_query = f"""
        SELECT question_id, selected_option_id
        FROM attempt_answers
        WHERE attempt_id = {attempt_id}
    """
    answers_rows = await db_handler.fetch_all_rows(query=answers_query)

    if not answers_rows:
        return {"message": "No questions found for this attempt"}

    total_questions = len(answers_rows)
    total_correct = 0
    total_incorrect = 0
    final_score = 0

    question_summary = []

    # 3) Loop each question
    for row in answers_rows:
        question_id = row["question_id"]
        selected_option_id = row["selected_option_id"]

        # -----------------------------
        # Fetch question text
        # -----------------------------
        question_query = f"""
            SELECT question_text, image_path
            FROM mcq_questions
            WHERE question_id = {question_id}
        """
        question_row = await db_handler.fetch_one_row(query=question_query)
        question_text = question_row.get("question_text") if question_row else None
        question_image_path = question_row.get("image_path") if question_row else None

        # -----------------------------
        # Fetch marks — master question values take precedence over stale per-test rows
        # -----------------------------
        marks_query = f"""
            SELECT
                COALESCE(mq.marks, mtq.correct_marks, 1) AS correct_marks,
                COALESCE(mq.negative_marks, mtq.negative_marks, 0) AS negative_marks
            FROM mcq_test_questions mtq
            LEFT JOIN mcq_questions mq ON mq.question_id = mtq.question_id
            WHERE mtq.test_id = {test_id}
              AND mtq.question_id = {question_id}
        """
        marks_row = await db_handler.fetch_one_row(query=marks_query)

        correct_marks = float(marks_row.get("correct_marks", 0)) if marks_row else 0
        negative_marks = float(marks_row.get("negative_marks", 0)) if marks_row else 0

        # -----------------------------
        # Fetch correct option text
        # -----------------------------
        correct_option_query = f"""
            SELECT option_text
            FROM mcq_question_options
            WHERE question_id = {question_id}
              AND is_correct = TRUE
        """
        correct_option_row = await db_handler.fetch_one_row(query=correct_option_query)
        correct_option_text = (
            correct_option_row.get("option_text")
            if correct_option_row else None
        )

        # -----------------------------
        # If not answered
        # -----------------------------
        if selected_option_id is None:
            question_summary.append({
                "question_id": question_id,
                "question_text": question_text,
                "image_path": question_image_path,
                "attempted_option": None,
                "correct_option": correct_option_text,
                "is_correct": False,
                "marks_awarded": 0
            })
            continue

        # -----------------------------
        # Fetch attempted option text
        # -----------------------------
        attempted_option_query = f"""
            SELECT option_text, is_correct
            FROM mcq_question_options
            WHERE question_id = {question_id}
              AND option_id = {selected_option_id}
        """
        attempted_option_row = await db_handler.fetch_one_row(query=attempted_option_query)

        attempted_option_text = (
            attempted_option_row.get("option_text")
            if attempted_option_row else None
        )

        is_correct = (
            attempted_option_row.get("is_correct") is True
            if attempted_option_row else False
        )

        # -----------------------------
        # Apply scoring
        # -----------------------------
        if is_correct:
            total_correct += 1
            final_score += correct_marks

            question_summary.append({
                "question_id": question_id,
                "question_text": question_text,
                "image_path": question_image_path,
                "attempted_option": attempted_option_text,
                "correct_option": correct_option_text,
                "is_correct": True,
                "marks_awarded": correct_marks
            })
        else:
            total_incorrect += 1
            final_score -= negative_marks

            question_summary.append({
                "question_id": question_id,
                "question_text": question_text,
                "image_path": question_image_path,
                "attempted_option": attempted_option_text,
                "correct_option": correct_option_text,
                "is_correct": False,
                "marks_awarded": -negative_marks
            })

    # 4) Update test_attempts
    update_attempt_query = f"""
        UPDATE test_attempts
        SET submit_time = NOW(),
            is_submitted = TRUE,
            final_score = {final_score},
            total_correct = {total_correct},
            total_incorrect = {total_incorrect},
            updated_at = NOW()
        WHERE attempt_id = {attempt_id}
        RETURNING attempt_id, test_id, student_id,
                  start_time, submit_time,
                  is_submitted, final_score,
                  total_correct, total_incorrect
    """
    updated_attempt = await db_handler.fetch_one_row(query=update_attempt_query)

    # Format datetime to IST
    if updated_attempt:
        updated_attempt["start_time"] = format_dt_ist(updated_attempt.get("start_time"))
        updated_attempt["submit_time"] = format_dt_ist(updated_attempt.get("submit_time"))

    return {
        "message": "Test submitted successfully",
        "attempt": updated_attempt,
        "summary": {
            "total_questions": total_questions,
            "total_correct": total_correct,
            "total_incorrect": total_incorrect,
            "final_score": final_score
        },
        "question_summary": question_summary
    }

# get submited test for student
async def get_submitted_test(subject_id: int, student_id: int, page: int, size: int):
    offset = (page - 1) * size
    limit = size

    query = f"""
        SELECT 
            ta.attempt_id,
            ta.test_id,
            mt.test_name,
            ta.start_time,
            ta.submit_time,
            ta.final_score
        FROM test_attempts ta
        JOIN mcq_tests mt ON ta.test_id = mt.test_id
        WHERE ta.student_id = {student_id}
          AND mt.subject_id = {subject_id}
          AND ta.is_submitted = TRUE
        ORDER BY ta.submit_time DESC
        LIMIT {limit}
        OFFSET {offset}
    """

    results = await db_handler.fetch_all_rows(query=query)

    # Format datetime to IST
    for row in results:
        row["start_time"] = format_dt_ist(row.get("start_time"))
        row["submit_time"] = format_dt_ist(row.get("submit_time"))

    return results



# get test summary with test 
async def get_test_summary(attempt_id: int):

    # -------------------------------------------------
    # 1) Fetch attempt details (READ ONLY)
    # -------------------------------------------------
    attempt_query = f"""
        SELECT attempt_id,
               test_id,
               start_time,
               submit_time,
               is_submitted
        FROM test_attempts
        WHERE attempt_id = {attempt_id}
    """
    attempt_row = await db_handler.fetch_one_row(query=attempt_query)

    if not attempt_row:
        return {"message": "Invalid attempt id"}

    test_id = attempt_row["test_id"]

    start_time = format_time_only_ist(attempt_row.get("start_time"))
    end_time = format_time_only_ist(attempt_row.get("submit_time"))

    start_time = format_dt_ist(attempt_row.get("start_time"))
    end_time = (
        format_dt_ist(attempt_row.get("submit_time"))
        if attempt_row.get("submit_time")
        else None
    )

    # -------------------------------------------------
    # 2) Fetch all answers of the attempt
    # -------------------------------------------------
    answers_query = f"""
        SELECT question_id, selected_option_id
        FROM attempt_answers
        WHERE attempt_id = {attempt_id}
    """
    answers_rows = await db_handler.fetch_all_rows(query=answers_query)

    if not answers_rows:
        return {"message": "No questions found for this attempt"}

    total_questions = len(answers_rows)
    total_correct = 0
    total_incorrect = 0
    final_score = 0

    question_summary = []

    # -------------------------------------------------
    # 3) Loop through each question
    # -------------------------------------------------
    for row in answers_rows:
        question_id = row["question_id"]
        selected_option_id = row["selected_option_id"]

        # Fetch question text
        question_query = f"""
            SELECT question_text, image_path
            FROM mcq_questions
            WHERE question_id = {question_id}
        """
        question_row = await db_handler.fetch_one_row(query=question_query)
        question_text = question_row.get("question_text") if question_row else None
        question_image_path = question_row.get("image_path") if question_row else None

        # Fetch marks configuration — prefer master question values
        marks_query = f"""
            SELECT
                COALESCE(mq.marks, mtq.correct_marks, 1) AS correct_marks,
                COALESCE(mq.negative_marks, mtq.negative_marks, 0) AS negative_marks
            FROM mcq_test_questions mtq
            LEFT JOIN mcq_questions mq ON mq.question_id = mtq.question_id
            WHERE mtq.test_id = {test_id}
              AND mtq.question_id = {question_id}
        """
        marks_row = await db_handler.fetch_one_row(query=marks_query)

        correct_marks = float(marks_row.get("correct_marks", 0)) if marks_row else 0
        negative_marks = float(marks_row.get("negative_marks", 0)) if marks_row else 0

        # Fetch correct option
        correct_option_query = f"""
            SELECT option_text
            FROM mcq_question_options
            WHERE question_id = {question_id}
              AND is_correct = TRUE
        """
        correct_option_row = await db_handler.fetch_one_row(
            query=correct_option_query
        )
        correct_option_text = (
            correct_option_row.get("option_text")
            if correct_option_row else None
        )

        # Case: Not answered
        if selected_option_id is None:
            question_summary.append({
                "question_text": question_text,
                "image_path": question_image_path,
                "attempted_option": None,
                "correct_option": correct_option_text,
                "is_correct": False,
                "marks_awarded": 0
            })
            continue

        # Fetch attempted option
        attempted_option_query = f"""
            SELECT option_text, is_correct
            FROM mcq_question_options
            WHERE question_id = {question_id}
              AND option_id = {selected_option_id}
        """
        attempted_option_row = await db_handler.fetch_one_row(
            query=attempted_option_query
        )

        attempted_option_text = (
            attempted_option_row.get("option_text")
            if attempted_option_row else None
        )

        is_correct = (
            attempted_option_row.get("is_correct") is True
            if attempted_option_row else False
        )

        # Apply scoring
        if is_correct:
            total_correct += 1
            final_score += correct_marks
            marks_awarded = correct_marks
        else:
            total_incorrect += 1
            final_score -= negative_marks
            marks_awarded = -negative_marks

        question_summary.append({
            "question_text": question_text,
            "image_path": question_image_path,
            "attempted_option": attempted_option_text,
            "correct_option": correct_option_text,
            "is_correct": is_correct,
            "marks_awarded": marks_awarded
        })

    # -------------------------------------------------
    # 4) Final response (NO UPDATE) — shape matches submit_test flow so the
    #    frontend can read the same fields whether the result was just
    #    submitted or fetched from history.
    # -------------------------------------------------
    return {
        "attempt": {
            "attempt_id": attempt_row["attempt_id"],
            "test_id": test_id,
            "start_time": start_time,
            "submit_time": end_time,
            "end_time": end_time,  # kept for backward compatibility
            "is_submitted": attempt_row["is_submitted"],
            "final_score": final_score,
            "total_correct": total_correct,
            "total_incorrect": total_incorrect,
        },
        "summary": {
            "total_questions": total_questions,
            "total_correct": total_correct,
            "total_incorrect": total_incorrect,
            "final_score": final_score
        },
        "question_summary": question_summary
    }
