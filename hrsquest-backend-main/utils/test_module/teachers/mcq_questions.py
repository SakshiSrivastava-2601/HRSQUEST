from properties.config import run_async_tasks
from properties.helper_psql import db_handler


# async def create_question_mcq(
#     subject_id: int,
#     question_text: str,
#     grade_level: int,
#     complexity_level: str,
#     teacher_id: int,
#     options: list,
#     topic_tag: str = None,
#     explanation_text: str = None,
#     image_path: str = None,
#     marks: int = None,
# ):
#     # -------------------------------------------------
#     # 1. DUPLICATE CHECK (BEFORE INSERT)
#     # -------------------------------------------------
#     duplicate_query = f"""
#         SELECT 1
#         FROM mcq_questions
#         WHERE subject_id = {subject_id}
#           AND grade_level = {grade_level}
#           AND LOWER(TRIM(question_text)) = LOWER(TRIM('{question_text.strip()}'))
#         LIMIT 1
#     """

#     exists = await db_handler.fetch_exists(duplicate_query)
#     if exists:
#         raise ValueError("Question already exists")

#     # -------------------------------------------------
#     # 2. INSERT QUESTION
#     # -------------------------------------------------
#     mcq_question_data = {
#         "subject_id": subject_id,
#         "question_text": question_text.strip(),
#         "topic_tag": topic_tag,
#         "grade_level": grade_level,
#         "complexity_level": complexity_level,
#         "explanation_text": explanation_text,
#         "teacher_id": teacher_id,
#         "image_path": image_path,
#         "marks": marks,
#     }

#     question_id = await db_handler.insert_and_get_id(
#         table_name="mcq_questions",
#         data=mcq_question_data,
#         id_column="question_id",
#     )

#     # -------------------------------------------------
#     # 3. INSERT OPTIONS
#     # -------------------------------------------------
#     mcq_option_data = []
#     for opt in options:
#         mcq_option_data.append(
#             {
#                 "question_id": question_id,
#                 "option_text": opt.option_text,
#                 "is_correct": opt.is_correct,
#             }
#         )

#     await db_handler.bulk_insert_command(
#         table_name="mcq_question_options",
#         records=mcq_option_data,
#     )

#     return {
#         "message": "MCQ Question created successfully",
#         "question_id": question_id,
#     }


async def create_question_mcq(
    subject_id: int,
    question_text: str,
    grade_level: int,
    complexity_level: str,
    teacher_id: int,
    options: list,
    topic_tag: str = None,
    explanation_text: str = None,
    image_path: str = None,
    marks: int = None,
    negative_marks: float = None,
):
    # -------------------------------------------------
    # 1. NORMALIZE topic_tag (First letter capital)
    # -------------------------------------------------
    if topic_tag:
        topic_tag = topic_tag.strip().capitalize()

    # -------------------------------------------------
    # 2. DUPLICATE CHECK (BEFORE INSERT)
    # -------------------------------------------------
    duplicate_query = f"""
        SELECT 1
        FROM mcq_questions
        WHERE subject_id = {subject_id}
          AND grade_level = {grade_level}
          AND LOWER(TRIM(question_text)) = LOWER(TRIM('{question_text.strip()}'))
        LIMIT 1
    """

    exists = await db_handler.fetch_exists(duplicate_query)
    if exists:
        raise ValueError("Question already exists")

    # -------------------------------------------------
    # 3. INSERT QUESTION
    # -------------------------------------------------
    mcq_question_data = {
        "subject_id": subject_id,
        "question_text": question_text.strip(),
        "topic_tag": topic_tag,          # normalized value
        "grade_level": grade_level,
        "complexity_level": complexity_level,
        "explanation_text": explanation_text,
        "teacher_id": teacher_id,
        "image_path": image_path,
        "marks": marks,
        "negative_marks": negative_marks if negative_marks is not None else 0.0,
    }

    question_id = await db_handler.insert_and_get_id(
        table_name="mcq_questions",
        data=mcq_question_data,
        id_column="question_id",
    )

    # -------------------------------------------------
    # 4. INSERT OPTIONS
    # -------------------------------------------------
    mcq_option_data = []
    for opt in options:
        mcq_option_data.append(
            {
                "question_id": question_id,
                "option_text": opt.option_text,
                "is_correct": opt.is_correct,
            }
        )

    await db_handler.bulk_insert_command(
        table_name="mcq_question_options",
        records=mcq_option_data,
    )

    return {
        "message": "MCQ Question created successfully",
        "question_id": question_id,
    }


async def update_question_mcq(
    question_id: int,
    subject_id: int,
    question_text: str,
    grade_level: int,
    complexity_level: str,
    teacher_id: int,
    options: list,
    topic_tag: str = None,
    explanation_text: str = None,
    image_path: str = None,
):
    # -------------------------------------------------
    # Update Question
    # -------------------------------------------------
    mcq_question_data = {
        "subject_id": subject_id,
        "question_text": question_text.strip(),
        "topic_tag": topic_tag,
        "grade_level": grade_level,
        "complexity_level": complexity_level,
        "explanation_text": explanation_text,
        "teacher_id": teacher_id,
        "image_path": image_path,
    }

    question_id = await db_handler.update_record(
        table_name="mcq_questions",
        data=mcq_question_data,
        condition_col="question_id",
        condition_val=question_id
    )

    # -------------------------------------------------
    # UPDATE OPTIONS
    # -------------------------------------------------
    mcq_option_data = []
    for opt in options:
        mcq_option_data.append(
            {
                "question_id": question_id,
                "option_text": opt.get("option_text"),
                "is_correct": opt.get("is_correct", False),
            }
        )

    await db_handler.bulk_insert_command(
        table_name="mcq_question_options",
        records=mcq_option_data,
    )

    return {
        "message": "MCQ Question created successfully",
        "question_id": question_id,
    }


async def get_question_mcq_list(
    subject_id: int,
    grade_level: int,
    test_id: int = None,
    topic_tag: list = [],
    complexity_level: list = [],
    get_all: bool = True,
    teacher_id: int = None,
    page: int = 1,
    size: int = 10,
):
    offset = (page - 1) * size
    limit = size
    where = f" subject_id = {subject_id} and grade_level = {grade_level}"
    if test_id:
        where += f""" and question_id IN 
                        (SELECT question_id 
                        FROM mcq_questions
                        EXCEPT 
                        SELECT question_id 
                        FROM mcq_test_questions 
                        WHERE test_id = {test_id})
                """
    if topic_tag:
        where += f""" and topic_tag IN ('{"', '".join(topic_tag)}') """

    if complexity_level:
        where += f""" and complexity_level IN ('{"', '".join(complexity_level)}') """

    if (not get_all) and teacher_id:
        where += f""" and teacher_id = {teacher_id} """

    query = f"""select mq.subject_id, s.subject_name, mq.grade_level, mq.question_id, mq.question_text, mq.topic_tag, mq.complexity_level, mq.explanation_text,\
                    mqo.option_id, mqo.option_text, mqo.is_correct , t.teacher_name, mq.marks, mq.negative_marks, mq.image_path
                from (select subject_id, grade_level, question_id, question_text, topic_tag, complexity_level, explanation_text, teacher_id, marks, negative_marks, image_path
                    from mcq_questions
                    where {where}
                    order by question_id DESC
                    limit {limit}
                    offset {offset}
                    ) as mq
                inner join mcq_question_options mqo
                on mqo.question_id = mq.question_id
                inner join teachers t
                on t.teacher_id = mq.teacher_id
                left join subjects s
                on s.subject_id = mq.subject_id
                order by question_id DESC
            """

    # Query for getting count of records
    query_count = f"""select count(question_id)
                    from mcq_questions 
                    where {where}
                """

    raw_results = db_handler.fetch_all_rows(query=query)
    count_results = db_handler.fetch_one_row(query=query_count)

    raw_results, count_results = await run_async_tasks(raw_results, count_results)

    if not raw_results:
        return {"data": raw_results, "count": count_results.get("count", 0)}

    questions = {}
    for row in raw_results:
        q_id = row["question_id"]

        if q_id not in questions:
            # Initialize the question structure once
            questions[q_id] = {
                "question_id": q_id,
                "subject_id": row["subject_id"],
                "subject_name": row["subject_name"],
                "grade_level": row["grade_level"],
                "question_text": row["question_text"],
                "topic_tag": row["topic_tag"],
                "complexity_level": row["complexity_level"],
                "explanation_text": row["explanation_text"],
                "options": [],
                "marks": row["marks"],
                "negative_marks": float(row["negative_marks"]) if row["negative_marks"] is not None else 0.0,
                "image_path": row["image_path"],
            }

        # Append the option to the question's options list
        questions[q_id]["options"].append(
            {
                "option_id": row["option_id"],
                "option_text": row["option_text"],
                "is_correct": row["is_correct"],
            }
        )

    final_question_list = list(questions.values())
    return {"data": final_question_list, "count": count_results.get("count", 0)}
