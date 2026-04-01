ALTER TABLE teachers
    ADD COLUMN IF NOT EXISTS role VARCHAR(30) NOT NULL DEFAULT 'teacher';

UPDATE teachers
SET role = 'superadmin'
WHERE teacher_id = 1;

ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'draft';

UPDATE courses
SET status = CASE
    WHEN is_published = TRUE THEN 'published'
    WHEN is_active = FALSE THEN 'archived'
    ELSE 'draft'
END
WHERE status IS NULL OR status = '';

ALTER TABLE course_lectures
    ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE lecture_resources
    ADD COLUMN IF NOT EXISTS storage_path TEXT,
    ADD COLUMN IF NOT EXISTS original_file_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS mime_type VARCHAR(255),
    ADD COLUMN IF NOT EXISTS uploaded_by_teacher INT;

CREATE TABLE IF NOT EXISTS course_videos (
    video_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL,
    lesson_id INT NOT NULL,
    video_path TEXT NOT NULL,
    original_file_name VARCHAR(255),
    mime_type VARCHAR(255),
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    duration INT DEFAULT 0,
    uploaded_by_teacher INT NOT NULL,
    storage_provider VARCHAR(50) NOT NULL DEFAULT 'local_secure',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_videos_course_id ON course_videos(course_id);
CREATE INDEX IF NOT EXISTS idx_course_videos_lesson_id ON course_videos(lesson_id);

CREATE TABLE IF NOT EXISTS student_course_access (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
    unlocked_at TIMESTAMPTZ,
    updated_by INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_course_access UNIQUE (student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_student_course_access_student_id
    ON student_course_access(student_id);

CREATE INDEX IF NOT EXISTS idx_student_course_access_course_id
    ON student_course_access(course_id);
