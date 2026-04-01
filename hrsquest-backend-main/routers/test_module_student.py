from fastapi import APIRouter, Depends, HTTPException, status
from properties.log import app_logger
from utils.authz import get_current_student
from schema import MCQQuestionCreate, MCQTestCreate, MCQTestAddQuestion, TestAttemptRequest
from utils.test_module.students.mcq_tests import *
from datetime import timedelta
from schema import SaveAnswerRequest



router = APIRouter(tags=["Test Module Student"])

# get test for student
@router.get("/mcq/tests/student")
async def get_mcq_tests(
    subject_id: int,
    page: int = 1,
    size: int = 10,
    user_info=Depends(get_current_student),
):
    """
    Get MCQ Test Papersx
    """
    student_id = user_info.get("student_id")
    if not student_id:
        app_logger.error(f"Student not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student Not Found.",
        )
    
    grade_level = user_info.get("grade_level")

    try:
        result = await get_mcq_test_list(grade_level = grade_level ,subject_id = subject_id,student_id =student_id ,page=page, size=size)
        return result
    except ValueError as e:
        # Catches the specific UniqueViolationError handled in insert_and_get_id
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        # Catches unexpected errors (e.g., severe connection failure)
        app_logger.error(f"Unhandled error in getting mcq tests for subject id {subject_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error in getting mcq tests.",
        )


#start test for student api
@router.put("/mcq/tests/start")
async def get_mcq_tests(
    test_id: int,
    user_info=Depends(get_current_student),
):
    """
    Get MCQ Test Papersx
    """
    student_id = user_info.get("student_id")
    if not student_id:
        app_logger.error(f"Student not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student Not Found.",
        )
    
    result = await start_test(test_id = test_id,student_id =student_id)
    return result
    
@router.get("/mcq/attempt/status")
async def mcq_attempt_status(
    attempt_id: int,
    _user_info=Depends(get_current_student),
):

    result = await get_attempt_status(attempt_id=attempt_id)

    if "message" in result:
        raise HTTPException(status_code=404, detail=result["message"])

    return result


@router.get("/mcq/get_question")
async def mcq_get_question(
    attempt_id: int,
    question_order: int,
    _user_info=Depends(get_current_student),
):

    result = await get_question(attempt_id=attempt_id, question_order=question_order)

    if "message" in result:
        raise HTTPException(status_code=404, detail=result["message"])

    return result


@router.post("/mcq/save_answer")
async def mcq_save_answer(
    payload: SaveAnswerRequest,
    _user_info=Depends(get_current_student),
):
    result = await save_answer(
        attempt_id=payload.attempt_id,
        question_order=payload.question_order,
        option_id=payload.option_id
    )

    if "message" in result and result["message"] == "Invalid attempt_id or question_order":
        raise HTTPException(status_code=404, detail=result["message"])

    return result

# final submit the paper
@router.put("/mcq/submit_test")
async def mcq_submit_test(
    attempt_id: int,
    _user_info=Depends(get_current_student),
):

    result = await submit_test(attempt_id=attempt_id)

    if result.get("message") in ["Attempt not found", "No questions found for this attempt"]:
        raise HTTPException(status_code=404, detail=result["message"])

    if result.get("message") == "Test already submitted":
        raise HTTPException(status_code=400, detail=result["message"])

    return result

# get submited test for student
@router.get("/mcq/submitted_test")
async def submitted_test(
    subject_id: int,
    page: int = 1,
    size: int = 10,
    user_info=Depends(get_current_student),
):
    """
    Get Submitted MCQ Tests
    """
    student_id = user_info.get("student_id")
    if not student_id:
        app_logger.error(f"Student not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student Not Found.",
        )
        

    try:
        result = await get_submitted_test(subject_id=subject_id, student_id=student_id, page=page, size=size)
        return result
    except ValueError as e:
        # Catches the specific UniqueViolationError handled in insert_and_get_id
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        # Catches unexpected errors (e.g., severe connection failure)
        app_logger.error(f"Unhandled error in getting submitted mcq tests for subject id {subject_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error in getting submitted mcq tests.",
        )


# get test result for student
@router.get("/mcq/test_result")
async def mcq_test_result(
    attempt_id: int,
    _user_info=Depends(get_current_student),
):

    result = await get_test_summary(attempt_id=attempt_id)

    if "message" in result and result["message"] == "Attempt not found":
        raise HTTPException(status_code=404, detail=result["message"])

    return result
