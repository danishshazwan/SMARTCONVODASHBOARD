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