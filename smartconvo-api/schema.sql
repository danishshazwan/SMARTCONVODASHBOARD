CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'guest',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    course_code TEXT,
    course_name TEXT,
    password TEXT NOT NULL,

    verification_status TEXT DEFAULT 'pending',
    session TEXT DEFAULT 'JJ26',

    face_registration_status TEXT DEFAULT 'not_registered',
    face_verification_status TEXT DEFAULT 'pending',

    convocation_status TEXT DEFAULT 'registration',
    queue_number INTEGER DEFAULT NULL,

    phone_number TEXT,
    faculty TEXT,
    cgpa REAL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS correction_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    student_id TEXT NOT NULL,

    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT NOT NULL,
    reason TEXT,

    status TEXT NOT NULL DEFAULT 'pending',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,

    FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_correction_requests_status
ON correction_requests(status);

CREATE INDEX IF NOT EXISTS idx_correction_requests_student_id
ON correction_requests(student_id);

CREATE TABLE IF NOT EXISTS face_samples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    student_id TEXT NOT NULL,
    sample_number INTEGER NOT NULL,

    face_encoding TEXT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_face_samples_student_id
ON face_samples(student_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_face_samples_unique
ON face_samples(student_id, sample_number);