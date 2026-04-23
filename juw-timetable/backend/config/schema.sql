-- ============================================
-- JUW Timetable Management System
-- Database Schema - PostgreSQL (Neon)
-- ============================================

-- ── Departments ─────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  code        VARCHAR(20)  NOT NULL UNIQUE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ── Users (all roles) ───────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  juw_id        VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('office_assistant','department_admin','teacher','student')),
  full_name     VARCHAR(150) NOT NULL,
  email         VARCHAR(150),
  department_id INTEGER REFERENCES departments(id),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_juw_id ON users(juw_id);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users(role);

-- ── Teachers ────────────────────────────────
CREATE TABLE IF NOT EXISTS teachers (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
  teacher_id     VARCHAR(50)  NOT NULL UNIQUE,
  full_name      VARCHAR(150) NOT NULL,
  department_id  INTEGER REFERENCES departments(id),
  specialization VARCHAR(200),
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_teachers_tid ON teachers(teacher_id);

-- ── Subjects ────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id            SERIAL PRIMARY KEY,
  code          VARCHAR(30)  NOT NULL UNIQUE,
  name          VARCHAR(200) NOT NULL,
  short_name    VARCHAR(30),
  credit_hours  INTEGER DEFAULT 3,
  department_id INTEGER REFERENCES departments(id),
  has_lab       BOOLEAN DEFAULT FALSE,
  color         VARCHAR(20) DEFAULT '#4A90D9',
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── Rooms ───────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id           SERIAL PRIMARY KEY,
  room_id      VARCHAR(20) NOT NULL UNIQUE,
  room_name    VARCHAR(100),
  capacity     INTEGER NOT NULL DEFAULT 50,
  room_type    VARCHAR(20) DEFAULT 'classroom' CHECK (room_type IN ('classroom','lab','auditorium')),
  is_available BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rooms_rid ON rooms(room_id);

-- ── Batches ─────────────────────────────────
CREATE TABLE IF NOT EXISTS batches (
  id            SERIAL PRIMARY KEY,
  batch_name    VARCHAR(50) NOT NULL UNIQUE,
  major         VARCHAR(100) NOT NULL,
  major_code    VARCHAR(20)  NOT NULL,
  year          INTEGER NOT NULL,
  semester      INTEGER DEFAULT 1,
  student_count INTEGER DEFAULT 0,
  department_id INTEGER REFERENCES departments(id),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW(),
  CONSTRAINT batch_year_check CHECK (year >= 2022)
);
CREATE INDEX IF NOT EXISTS idx_batches_year  ON batches(year);
CREATE INDEX IF NOT EXISTS idx_batches_major ON batches(major_code);

-- ── Students ────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
  student_id      VARCHAR(50) NOT NULL UNIQUE,
  full_name       VARCHAR(150) NOT NULL,
  batch_id        INTEGER REFERENCES batches(id),
  department_id   INTEGER REFERENCES departments(id),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ── Teacher-Subject Mapping ──────────────────
CREATE TABLE IF NOT EXISTS teacher_subjects (
  id         SERIAL PRIMARY KEY,
  teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id)  ON DELETE CASCADE,
  UNIQUE(teacher_id, subject_id)
);

-- ── Timetable ───────────────────────────────
CREATE TABLE IF NOT EXISTS timetable (
  id            SERIAL PRIMARY KEY,
  batch_id      INTEGER NOT NULL REFERENCES batches(id)  ON DELETE CASCADE,
  subject_id    INTEGER NOT NULL REFERENCES subjects(id),
  teacher_id    INTEGER NOT NULL REFERENCES teachers(id),
  room_id       INTEGER NOT NULL REFERENCES rooms(id),
  day           VARCHAR(15) NOT NULL CHECK (day IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
  time_slot     INTEGER NOT NULL CHECK (time_slot BETWEEN 1 AND 5),
  slot_label    VARCHAR(20) NOT NULL,
  is_lab        BOOLEAN DEFAULT FALSE,
  academic_year VARCHAR(10) DEFAULT '2025',
  semester      INTEGER DEFAULT 2,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tt_batch    ON timetable(batch_id);
CREATE INDEX IF NOT EXISTS idx_tt_teacher  ON timetable(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tt_room     ON timetable(room_id);
CREATE INDEX IF NOT EXISTS idx_tt_day_slot ON timetable(day, time_slot);

-- ── Enrollment ──────────────────────────────
CREATE TABLE IF NOT EXISTS enrollment (
  id         SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  batch_id   INTEGER REFERENCES batches(id)  ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, batch_id)
);

-- ── Admin Approval Requests ─────────────────
CREATE TABLE IF NOT EXISTS admin_requests (
  id            SERIAL PRIMARY KEY,
  requested_by  INTEGER REFERENCES users(id),
  request_type  VARCHAR(20) NOT NULL CHECK (request_type IN ('create','update','delete')),
  entity_type   VARCHAR(30) NOT NULL,
  entity_id     INTEGER,
  request_data  JSONB NOT NULL,
  status        VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by   INTEGER REFERENCES users(id),
  review_note   TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  reviewed_at   TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_req_status ON admin_requests(status);
