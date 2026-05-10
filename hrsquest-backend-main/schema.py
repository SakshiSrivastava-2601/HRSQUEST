from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional, List


class StudentRegistration(BaseModel):
    student_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone_number: str = Field(min_length=8, max_length=20)
    password: str = Field(min_length=8, max_length=128)
    grade_level: int


class TeacherRegistration(BaseModel):
    teacher_name: str = Field(min_length=2, max_length=100)
    username: str
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    username: str
    password: str = Field(min_length=8, max_length=128)

class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(min_length=10)

class ChangePassword(BaseModel):
    old_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)

# --- Question Creation Schema ---
class MCQOptionCreate(BaseModel):
    option_text: str = Field(..., min_length=1)
    is_correct: bool

class MCQQuestionCreate(BaseModel):
    question_text: str = Field(..., description="The main text of the question.")
    subject_id: int = Field(..., gt=0, description="Foreign Key to the subjects table.")
    topic_tag: str = Field(..., max_length=50, description="Topic of the Question")
    grade_level: int = Field(
        ..., gt=0, description="The target grade level for the question."
    )
    complexity_level: str = Field(
        ..., max_length=50, description="e.g., 'Easy', 'Medium', 'Hard'."
    )
    explanation_text: Optional[str] = Field(
        None, description="Detailed explanation for the correct answer."
    )
    options: List[MCQOptionCreate]
    image_path: Optional[str] = None
    marks : Optional[int] = Field(None, gt=0, description="Marks allocated for the question.")
    negative_marks: Optional[float] = Field(
        None, ge=0, description="Marks deducted for an incorrect answer (stored as a positive value)."
    )

    @field_validator('options')
    @classmethod
    def validate_mcq_logic(cls, v: List[MCQOptionCreate]):
        if not v:
            return v  # Allow empty list if it's an optional update
        
        # Rule 1: Minimum 2 options for an MCQ
        if len(v) < 2:
            raise ValueError("An MCQ must have at least 2 options.")
        
        # Rule 2: Exactly one option must be marked as correct
        correct_count = sum(1 for opt in v if opt.is_correct)
        if correct_count != 1:
            raise ValueError(f"Exactly one option must be correct. Found: {correct_count}")
            
        return v
    
class MCQOptionUpdate(BaseModel):
    option_id: int
    option_text: str = Field(..., min_length=1)
    is_correct: bool

class MCQQuestionUpdate(BaseModel):
    question_text: str = Field(..., description="The main text of the question.")
    subject_id: int = Field(..., gt=0, description="Foreign Key to the subjects table.")
    topic_tag: str = Field(..., max_length=50, description="Topic of the Question")
    grade_level: int = Field(
        ..., gt=0, description="The target grade level for the question."
    )
    complexity_level: str = Field(
        ..., max_length=50, description="e.g., 'Easy', 'Medium', 'Hard'."
    )
    explanation_text: Optional[str] = Field(
        None, description="Detailed explanation for the correct answer."
    )
    options: List[MCQOptionUpdate]
    image_path: Optional[str] = None
    marks : Optional[int] = Field(None, gt=0, description="Marks allocated for the question.")
    negative_marks: Optional[float] = Field(
        None, ge=0, description="Marks deducted for an incorrect answer (stored as a positive value)."
    )

    @field_validator('options')
    @classmethod
    def validate_mcq_logic(cls, v: List[MCQOptionUpdate]):
        if not v:
            return v  # Allow empty list if it's an optional update
        
        # Rule 1: Minimum 2 options for an MCQ
        if len(v) < 2:
            raise ValueError("An MCQ must have at least 2 options.")
        
        # Rule 2: Exactly one option must be marked as correct
        correct_count = sum(1 for opt in v if opt.is_correct)
        if correct_count != 1:
            raise ValueError(f"Exactly one option must be correct. Found: {correct_count}")
            
        return v


class GetMCQQuestions(BaseModel):
    subject_id: int
    grade_level: int
    test_id: Optional[int] = None
    topic_tag: Optional[list] = []
    complexity_level: Optional[list] = []
    get_all: Optional[bool] = True
    page: int = 1
    size: int = 10


# --- Test Creation Schema ---
class MCQTestCreate(BaseModel):
    test_name: str = Field(..., description="Name of the Test.")
    subject_id: int = Field(..., gt=0, description="Foreign Key to the subjects table.")
    target_grade_level: int = Field(
        ..., gt=0, description="The target grade level for the test."
    )
    duration_minutes: int = Field(..., gt=0, description="Test Duration in minutes.")
    max_total_marks: int = Field(..., gt=0, description="Maximum Marks of the test.")
    description: Optional[str] = Field(None, description="Description of the test.")


class MCQTestAddQuestion(BaseModel):
    test_id: int = Field(..., description="Foreign Key to the MCQ Test table.")
    question_id: int = Field(
        ..., gt=0, description="Foreign Key to the MCQ Questions table."
    )
    correct_marks: float = Field(..., gt=0, description="Correct Marks of the test.")
    negative_marks: float = Field(..., le=0, description="Negative marks of the test.")
    
class TestAttemptRequest(BaseModel):
    student_id: int
    test_id: int
    final_score: Optional[float] = None
    total_correct: Optional[int] = None
    total_incorrect: Optional[int] = None
    is_submitted : Optional[bool] = False
    submit_time : Optional[str] = None

class SaveAnswerRequest(BaseModel):
    attempt_id: int
    question_order: int
    option_id: int

#Course Schema
class CourseCreateSchema(BaseModel):
    title: str = None
    description: Optional[str] = None
    subject_id: Optional[int] = None
    grade_level: Optional[int] = None
    price: Optional[float] = 0.0
    level: Optional[str] = None
    language: Optional[str] = None
    thumbnail_url: Optional[str] = None

class CourseUpdateSchema(BaseModel):
    title: str = None
    description: Optional[str] = None
    subject_id: Optional[int] = None
    grade_level: Optional[int] = None
    price: Optional[float] = 0.0
    level: Optional[str] = None
    language: Optional[str] = None
    thumbnail_url: Optional[str] = None
    
class SectionCreateSchema(BaseModel):
    course_id: int
    title: str = Field(..., min_length=2)
    order_index: Optional[int] = 0


class SectionUpdateSchema(BaseModel):
    course_id: int
    section_id: int
    title: str = Field(..., min_length=2)
    order_index: Optional[int] = 0

class LectureCreateSchema(BaseModel):
    course_id: int
    section_id: int
    title: str = Field(..., min_length=2)
    description: Optional[str] = None
    video_url: Optional[str] = None
    notes: Optional[str] = None
    order_index: Optional[int] = 0
    is_preview: Optional[bool] = False
    video_duration_seconds: Optional[int] = 0

class LectureResourceCreateSchema(BaseModel):
    lecture_id: int
    resource_title: str
    resource_type: str  # pdf, notes, doc, zip
    file_url: Optional[str] = None
    file_size_kb: Optional[int] = None


class LectureResourceUpdateSchema(BaseModel):
    resource_id: int
    lecture_id: int
    resource_title: str = Field(..., min_length=2, max_length=255)
    resource_type: str = Field(..., min_length=2, max_length=50)
    file_url: Optional[str] = None
    file_size_kb: Optional[int] = None
    
class PublishCourseSchema(BaseModel):
    course_id: int


class AdminCourseCreateSchema(BaseModel):
    teacher_id: int = Field(..., gt=0)
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    subject_id: Optional[int] = Field(None, gt=0)
    grade_level: Optional[int] = Field(None, gt=0)
    price: Optional[float] = Field(0.0, ge=0)
    level: Optional[str] = Field(None, max_length=50)
    language: Optional[str] = Field(None, max_length=50)
    thumbnail_url: Optional[str] = None


class AssignTeacherSchema(BaseModel):
    teacher_id: int = Field(..., gt=0)


class UpdateCourseAccessSchema(BaseModel):
    student_id: int = Field(..., gt=0)
    course_id: int = Field(..., gt=0)
    payment_status: str = Field(..., min_length=4, max_length=20)

    @field_validator("payment_status")
    @classmethod
    def validate_payment_status(cls, value: str):
        normalized = value.lower()
        if normalized not in {"paid", "unpaid"}:
            raise ValueError("payment_status must be either 'paid' or 'unpaid'")
        return normalized


class AdminTeacherCreateSchema(BaseModel):
    teacher_name: str = Field(min_length=2, max_length=100)
    username: str = Field(min_length=3, max_length=100)
    password: Optional[str] = Field(None, min_length=8, max_length=128)
    generate_password: Optional[bool] = True
    subject_ids: Optional[List[int]] = []

    @field_validator("subject_ids")
    @classmethod
    def validate_subject_ids(cls, value):
        if value is None:
            return []
        cleaned = []
        for v in value:
            iv = int(v)
            if iv <= 0:
                raise ValueError("subject_ids must contain positive integers")
            cleaned.append(iv)
        # de-dupe while preserving order
        seen = set()
        out = []
        for iv in cleaned:
            if iv in seen:
                continue
            seen.add(iv)
            out.append(iv)
        return out


class AdminTeacherUpdateSchema(BaseModel):
    teacher_name: Optional[str] = Field(None, min_length=2, max_length=100)
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    role: Optional[str] = Field(None, min_length=3, max_length=30)
    subject_ids: Optional[List[int]] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, value):
        if value is None:
            return None
        normalized = str(value).lower()
        if normalized not in {"teacher", "superadmin"}:
            raise ValueError("role must be 'teacher' or 'superadmin'")
        return normalized

    @field_validator("subject_ids")
    @classmethod
    def validate_subject_ids(cls, value):
        if value is None:
            return None
        cleaned = []
        for v in value:
            iv = int(v)
            if iv <= 0:
                raise ValueError("subject_ids must contain positive integers")
            cleaned.append(iv)
        seen = set()
        out = []
        for iv in cleaned:
            if iv in seen:
                continue
            seen.add(iv)
            out.append(iv)
        return out


class AdminTeacherResetPasswordSchema(BaseModel):
    password: str = Field(min_length=8, max_length=128)


class AdminStudentUpdateSchema(BaseModel):
    student_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(None, min_length=8, max_length=20)
    grade_level: Optional[int] = Field(None, gt=0)


class StudentSelfUpdateSchema(BaseModel):
    student_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(None, min_length=8, max_length=20)


class UploadVideoForm(BaseModel):
    model_config = ConfigDict(extra="ignore")

    course_id: int = Field(..., gt=0)
    section_id: int = Field(..., gt=0)
    lesson_title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    notes: Optional[str] = None
    order_index: Optional[int] = Field(0, ge=0)
    is_preview: Optional[bool] = False
    video_duration_seconds: Optional[int] = Field(0, ge=0)


class UploadMaterialForm(BaseModel):
    model_config = ConfigDict(extra="ignore")

    course_id: int = Field(..., gt=0)
    lesson_id: int = Field(..., gt=0)
    resource_title: str = Field(..., min_length=2, max_length=255)
    resource_type: Optional[str] = Field(None, max_length=50)


class StudentCourseListItem(BaseModel):
    course_id: int
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    teacher_id: int
    teacher_name: Optional[str] = None
    price: float
    status: str
    is_unlocked: bool
    payment_status: str
    created_at: Optional[str] = None


class StudentCourseDetailResponse(BaseModel):
    course_id: int
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    teacher_id: int
    teacher_name: Optional[str] = None
    price: float
    status: str
    is_unlocked: bool
    payment_status: str
    modules: list




