from fastapi import APIRouter, Depends, HTTPException, status
from schema import StudentRegistration, TeacherRegistration, UserLogin, ChangePassword, RefreshTokenRequest
from passlib.context import CryptContext
from properties.helper_psql import get_db_handler, AsyncDBHandler
from properties.log import app_logger
from utils.user_authentication import get_current_user
from utils.user_authentication import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
)
from utils.authz import ROLE_STUDENT, ROLE_SUPERADMIN, ROLE_TEACHER


router = APIRouter(tags=["User Registration and Authentication"])

# Define a context for handling password hashing (using bcrypt)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hashes the plain text password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def build_token_payload(user_info: dict, role: str) -> dict:
    safe_payload = dict(user_info)
    safe_payload["role"] = role
    return safe_payload


@router.post("/registration/student")
async def register_student(
    student_data: StudentRegistration,
    db_handler: AsyncDBHandler = Depends(get_db_handler),
):
    """
    Registers a new student, hashes the password, and inserts the record into the database.
    """
    app_logger.info(f"Attempting to register new student: {student_data.email}")

    # 1. Hash the password
    hashed_pw = hash_password(student_data.password)

    # 2. Prepare data for the generic insertion function.
    data_to_insert = {
        "student_name": student_data.student_name,
        "email": student_data.email,
        "phone_number": student_data.phone_number,
        "hashed_password": hashed_pw,
        "grade_level": student_data.grade_level,
        "current_grade_level": student_data.grade_level,
    }

    try:
        # 3. Call the generic insertion function to insert and get the new ID
        new_student_id = await db_handler.insert_and_get_id(
            table_name="students", data=data_to_insert, id_column="student_id"
        )

        app_logger.info(
            f"Student {student_data.email} registered with ID: {new_student_id}"
        )

        return {
            "message": "Student successfully registered.",
            "student_id": new_student_id,
            "email": student_data.email,
        }

    except ValueError as e:
        # Catches the specific UniqueViolationError handled in insert_and_get_id
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="User Already Exists"
        )
    except Exception as e:
        # Catches unexpected errors (e.g., severe connection failure)
        app_logger.error(f"Unhandled error during registration: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during registration.",
        )


@router.post("/registration/teacher")
async def register_teacher(
    teacher_data: TeacherRegistration,
    db_handler: AsyncDBHandler = Depends(get_db_handler),
    user_info=Depends(get_current_user),
):
    """
    Registers a new teacher, hashes the password, and inserts the record into the database.
    """
    app_logger.info(f"Attempting to register new teacher: {teacher_data.username}")

    if str(user_info.get("role", "")).lower() != ROLE_SUPERADMIN:
        app_logger.error("SuperAdmin role required for teacher registration")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="SuperAdmin access required.",
        )

    # 1. Hash the password
    hashed_pw = hash_password(teacher_data.password)

    # 2. Prepare data for the generic insertion function.
    data_to_insert = {
        "teacher_name": teacher_data.teacher_name,
        "username": teacher_data.username,
        "hashed_password": hashed_pw,
        "role": ROLE_TEACHER,
    }

    try:
        # 3. Call the generic insertion function to insert and get the new ID
        teacher_id = await db_handler.insert_and_get_id(
            table_name="teachers", data=data_to_insert, id_column="teacher_id"
        )

        app_logger.info(
            f"Teacher {teacher_data.username} registered with ID: {teacher_id}"
        )

        return {
            "message": "Teacher successfully registered.",
            "teacher_id": teacher_id,
            "username": teacher_data.username
        }

    except ValueError as e:
        # Catches the specific UniqueViolationError handled in insert_and_get_id
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="User Already Exists"
        )
    except Exception as e:
        # Catches unexpected errors (e.g., severe connection failure)
        app_logger.error(f"Unhandled error during registration: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during registration.",
        )


@router.post("/login/student")
async def student_login(
    request: UserLogin,
    db_handler: AsyncDBHandler = Depends(get_db_handler),
):
    "Checks the username/user-email and password. If valid returns back bearer token else returns relevant error/issue"
    username = request.username
    password = request.password

    query = """SELECT s.student_id, s.student_name, s.hashed_password, \
                    s.email, s.is_email_verified, s.phone_number, s.is_phone_verified,\
                    s.grade_level, s.current_grade_level
                FROM students s
                WHERE (s.email = $1 OR s.phone_number = $1) AND (s.is_deleted = false)

            """

    user_info = await db_handler.fetch_one_row(query, username)

    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Student Not Found"
        )

    if not verify_password(password, user_info.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Incorrect Password"
        )

    del user_info["hashed_password"]

    lifetime = 30
    token_payload = build_token_payload(user_info, ROLE_STUDENT)
    access_token = create_access_token(token_payload, lifetime)
    refresh_token = create_refresh_token(token_payload)
    app_logger.info(f"User with email {request.username} LOGGED IN")
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "lifetime": lifetime,
        "student_id": user_info.get("student_id"),
    }


@router.post("/login/teacher")
async def teacher_login(
    request: UserLogin,
    db_handler: AsyncDBHandler = Depends(get_db_handler),
):
    "Checks the username/user-email and password. If valid returns back bearer token else returns relevant error/issue"
    username = request.username
    password = request.password

    query = """SELECT t.teacher_id, t.teacher_name, t.username, t.hashed_password, t.role
                FROM teachers t
                WHERE t.username = $1 AND t.is_deleted = false
            """

    user_info = await db_handler.fetch_one_row(query, username)

    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Teacher Not Found"
        )

    if not verify_password(password, user_info.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Incorrect Password"
        )

    role = str(user_info.get("role") or ROLE_TEACHER).lower()
    del user_info["hashed_password"]

    lifetime = 30
    token_payload = build_token_payload(user_info, role)
    access_token = create_access_token(token_payload, lifetime)
    refresh_token = create_refresh_token(token_payload)
    app_logger.info(f"User with username {request.username} LOGGED IN")
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "lifetime": lifetime,
        "teacher_id": user_info.get("teacher_id"),
    }


@router.post("/change_password/student")
async def student_change_password(
    request: ChangePassword,
    db_handler: AsyncDBHandler = Depends(get_db_handler),
    user_info=Depends(get_current_user),
):
    "Change Password of a Student"

    student_id = user_info.get("student_id")

    if not student_id:
        app_logger.error(f"Student Id not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student Not Found.",
        )

    old_password = request.old_password
    new_password = request.new_password

    query = """SELECT s.student_id, s.hashed_password
                FROM students s
                WHERE s.student_id = $1 AND s.is_deleted = false
            """

    user_info = await db_handler.fetch_one_row(query, student_id)

    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Student Not Found"
        )

    if not verify_password(old_password, user_info.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Incorrect Old Password",
        )

    hashed_pw = hash_password(new_password)

    result = await db_handler.execute_command(
        """UPDATE students
                SET hashed_password = $1, updated_at = NOW()
                WHERE student_id = $2
            """,
        hashed_pw,
        student_id,
    )
    rows_affected = int(result.split(" ")[-1])
    app_logger.info(
        f"Rows Affected in Update Password for Student Id {student_id} - {rows_affected}"
    )
    return "success"


@router.post("/change_password/teacher")
async def teacher_change_password(
    request: ChangePassword,
    db_handler: AsyncDBHandler = Depends(get_db_handler),
    user_info=Depends(get_current_user),
):
    "Change Password of a Teacher"
    teacher_id = user_info.get("teacher_id")

    if not teacher_id:
        app_logger.error(f"teacher Id not found")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher Not Found.",
        )

    old_password = request.old_password
    new_password = request.new_password

    query = """SELECT t.teacher_id, t.hashed_password
                FROM teachers t
                WHERE t.teacher_id = $1 AND t.is_deleted = false
            """

    user_info = await db_handler.fetch_one_row(query, teacher_id)

    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Teacher Not Found"
        )

    if not verify_password(old_password, user_info.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Incorrect Old Password",
        )

    hashed_pw = hash_password(new_password)

    result = await db_handler.execute_command(
        """UPDATE teachers
                SET hashed_password = $1, updated_at = NOW()
                WHERE teacher_id = $2
            """,
        hashed_pw,
        teacher_id,
    )
    rows_affected = int(result.split(" ")[-1])
    app_logger.info(
        f"Rows Affected in Update Password for Teacher Id {teacher_id} - {rows_affected}"
    )
    return "success"


@router.get("/decode_token")
async def decode_token(token: str):
    "Decode Token"
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"No Token Provided."
        )

    resp = decode_access_token(token)
    return resp


@router.get("/renew_token")
async def renew_token(token: str):
    "Renew Token"
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"No Token Provided."
        )

    user_info = decode_access_token(token)
    lifetime = 30
    access_token = create_access_token(user_info, lifetime)
    result = {
        "access_token": access_token,
        "token_type": "bearer",
        "lifetime": lifetime,
    }

    if user_info.get("student_id"):
        result["student_id"] = user_info.get("student_id")
    elif user_info.get("teacher_id"):
        result["teacher_id"] = user_info.get("teacher_id")

    return result


@router.post("/refresh_token")
async def refresh_token(request: RefreshTokenRequest):
    """
    Exchange a refresh token for a new access token.
    This keeps sessions stable across page refreshes without forcing logout when access tokens expire.
    """
    user_info = decode_refresh_token(request.refresh_token)
    lifetime = 30
    access_token = create_access_token(user_info, lifetime)
    result = {
        "access_token": access_token,
        "token_type": "bearer",
        "lifetime": lifetime,
    }
    if user_info.get("student_id"):
        result["student_id"] = user_info.get("student_id")
    elif user_info.get("teacher_id"):
        result["teacher_id"] = user_info.get("teacher_id")
    return result
