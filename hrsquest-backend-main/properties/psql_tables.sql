-- Student information table
CREATE TABLE IF NOT EXISTS students (
    student_id SERIAL PRIMARY KEY,
    student_name VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    phone_number VARCHAR(20) UNIQUE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    hashed_password VARCHAR(128) NOT NULL,
    grade_level INT8,
    current_grade_level INT8,
    is_deleted BOOLEAN DEFAULT FALSE,
    subscription_ending_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '3 months'),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Teachers/Faculty information table
CREATE TABLE IF NOT EXISTS teachers (
    teacher_id SERIAL PRIMARY KEY,
    teacher_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    hashed_password VARCHAR(128) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert the admin record
INSERT INTO teachers (teacher_id, teacher_name, username, hashed_password)
VALUES (1, 'Admin', 'admin@hrsquest.com', '$argon2id$v=19$m=65536,t=3,p=4$olTqfU8ppZSyNmYMwdh7jw$q+336iq7KVSwyt9JW/tn0qKGT08htK5UgZrRFVV04oQ')
ON CONFLICT (teacher_id) DO NOTHING;

-- Question Management Tables

-- Master list of all Subjects
CREATE TABLE IF NOT EXISTS subjects (
    subject_id SERIAL PRIMARY KEY,
    subject_name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Master pool of all available MCQ questions
CREATE TABLE IF NOT EXISTS mcq_questions (
    question_id SERIAL PRIMARY KEY,
    subject_id INT,
    question_text TEXT NOT NULL,
    topic_tag VARCHAR(100),
    grade_level INT8 NOT NULL,
    complexity_level VARCHAR(50),
    explanation_text TEXT,
    teacher_id INT,
    image_path VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    marks INT
);

-- Stores the options for each MCQ question
CREATE TABLE IF NOT EXISTS mcq_question_options (
    option_id SERIAL PRIMARY KEY,
    question_id INT NOT NULL,
    option_text VARCHAR(500) NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    -- Constraint to prevent the same options from being added twice to the same question
    UNIQUE (question_id, option_text),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--Test Structure Tables MCQ

-- Defines the blueprint of a MCQ test
CREATE TABLE IF NOT EXISTS mcq_tests (
    test_id SERIAL PRIMARY KEY,
    test_name VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id INT,
    target_grade_level INT8 NOT NULL,
    duration_minutes INT NOT NULL,
    max_total_marks NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    teacher_id INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction Table: Maps specific questions to a specific MCQ test
CREATE TABLE IF NOT EXISTS mcq_test_questions (
    test_question_id SERIAL PRIMARY KEY,
    test_id INT NOT NULL,
    question_id INT NOT NULL,
    correct_marks NUMERIC NOT NULL,
    negative_marks NUMERIC DEFAULT 0.0,
    display_order INT,
    -- Constraint to prevent the same question from being added twice to the same test
    UNIQUE (test_id, question_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--- Attempt and Scoring Tables

-- Tracks the student's overall attempt on a test
CREATE TABLE IF NOT EXISTS test_attempts (
    attempt_id SERIAL PRIMARY KEY,
    test_id INT NOT NULL,
    student_id INT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submit_time TIMESTAMPTZ,
    is_submitted BOOLEAN DEFAULT FALSE,
    final_score NUMERIC,
    total_correct INT,
    total_incorrect INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_attempt_per_student
ON test_attempts (test_id, student_id) WHERE is_submitted IS FALSE;

-- Records the student's answer for each question within an attempt
CREATE TABLE IF NOT EXISTS attempt_answers (
    attempt_answer_id SERIAL PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL, 
    question_order INT NOT NULL,
    selected_option_id INT,
    time_spent_seconds INT,
    marks_awarded NUMERIC,
    -- Constraint to ensure only one answer per question per attempt
    UNIQUE (attempt_id, question_id)
);



-- Stores main course information created by teachers
CREATE TABLE IF NOT EXISTS courses (
    course_id SERIAL PRIMARY KEY,
    teacher_id INT NOT NULL,  -- reference to users.user_id
    subject_id INT,          -- reference to subjects.subject_id
    grade_level INT8,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    price NUMERIC(10,2) DEFAULT 0.00,
    level VARCHAR(50), -- beginner, intermediate, advanced
    language VARCHAR(50),
    duration_seconds INT DEFAULT 0,
    total_students INT DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores sections inside a course
CREATE TABLE IF NOT EXISTS course_sections (
    section_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL,  -- reference to courses.course_id
    title VARCHAR(255) NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Prevent duplicate order inside same course
    UNIQUE (course_id, order_index)
);

-- Stores lectures (videos) inside sections
CREATE TABLE IF NOT EXISTS course_lectures (
    lecture_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL,   -- reference to courses.course_id
    section_id INT NOT NULL,  -- reference to course_sections.section_id
    title VARCHAR(255) NOT NULL,
    video_url TEXT NOT NULL,
    video_duration_seconds INT DEFAULT 0,
    order_index INT NOT NULL DEFAULT 0,
    is_preview BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Prevent duplicate lecture order inside same section
    UNIQUE (section_id, order_index)
);

-- Stores downloadable files (PDF, Notes, Docs) attached to lectures
CREATE TABLE IF NOT EXISTS lecture_resources (
    resource_id SERIAL PRIMARY KEY,
    lecture_id INT NOT NULL,  -- reference to course_lectures.lecture_id
    resource_title VARCHAR(255) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    -- example values: 'pdf', 'notes', 'doc', 'zip'
    file_url TEXT NOT NULL,
    file_size_kb INT,
    is_downloadable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
