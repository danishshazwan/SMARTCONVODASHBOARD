PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'guest',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "guests" ("id","name","email","password","role","created_at") VALUES(1,'Test Guest','testguest@gmail.com','$2b$10$moDXcBiN1Xa1cbkxSCGQ6Ok.QMghDWsmZCTdcnpQY9eA9eKZ4wMce','guest','2026-08-09 02:26:13');
INSERT INTO "guests" ("id","name","email","password","role","created_at") VALUES(2,'Suwandi','suwandimohdanang@gmail.com','$2b$10$JNsMYyBcYUSs81FwjNtZsui090ezU0tggUSvfqhxPMcEm5rX.SQyq','guest','2026-08-09 03:05:33');
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    course_code TEXT,
    course_name TEXT,
    password TEXT NOT NULL,
    verification_status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
, session TEXT DEFAULT 'JJ26', convocation_status TEXT DEFAULT 'registration', phone_number TEXT, faculty TEXT, cgpa REAL, queue_number INTEGER);
INSERT INTO "students" ("id","student_id","name","email","course_code","course_name","password","verification_status","created_at","session","convocation_status","phone_number","faculty","cgpa","queue_number") VALUES(1,'2402076','Danish Shazwan Bin Suwandi','2402076@lumut.tvetmara.edu.my','DFD','Diploma in Computer Technology Big Data Analytics','$2b$10$kc18EwAvXZ0VPDZGYanYJuaTAQe0HRzKYsiK2N8j6j6tD1S.d1m7i','pending','2026-08-09 06:08:13','JJ26','registration','0123456789','Electrical & Electronics',NULL,NULL);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('guests',2);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('students',1);