import uvicorn
from fastapi import FastAPI
from properties.app_startup import startup_db, shutdown_db , args
from routers import (
    admin_lms,
    course_module_teacher,
    helper_subjects,
    media,
    payments_razorpay,
    student_courses,
    student_dashboard,
    teacher_dashboard,
    teacher_upload,
    test_module_student,
    test_module_teacher,
    user_registration,
)
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI application
app = FastAPI(title="HR Science Quest", version="1.0.0")


# Register the handlers with FastAPI
app.add_event_handler("startup", startup_db)
app.add_event_handler("shutdown", shutdown_db)

# --- API Routers ---

app.include_router(user_registration.router)

app.include_router(student_dashboard.router)

app.include_router(helper_subjects.router)

app.include_router(teacher_dashboard.router)

app.include_router(test_module_teacher.router)

app.include_router(test_module_student.router)

app.include_router(course_module_teacher.router)

app.include_router(admin_lms.router)

app.include_router(teacher_upload.router)

app.include_router(student_courses.router)

app.include_router(media.router)

app.include_router(payments_razorpay.router)

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],
)


@app.get("/")
async def root():
    return "Welcome to HR Science Quest"


# --- Run Application ---

if __name__ == "__main__":
    uvicorn.run(
        "app_hrsquest:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
    )
