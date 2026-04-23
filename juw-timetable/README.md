# JUW Timetable Management System

Role-based academic timetable system for **Jinnah University for Women** — CS & SE Department.

---

## Project Structure

```
juw-timetable/
├── backend/
│   ├── config/
│   │   ├── db.js           ← Neon PostgreSQL pool
│   │   ├── schema.sql      ← All 10 DB tables
│   │   ├── seed.sql        ← Data from PDF (33 teachers, 31 subjects, 14 rooms, 13 batches)
│   │   └── migrate.js      ← Run once to setup DB
│   ├── controllers/        ← auth, timetable, office, approval, enrollment
│   ├── middleware/
│   │   └── authMiddleware.js  ← JWT + role authorization
│   ├── routes/             ← authRoutes, timetableRoutes, officeRoutes, approvalRoutes, enrollmentRoutes
│   ├── services/
│   │   └── conflictService.js ← Teacher / Room / Batch conflict detection
│   ├── uploads/            ← CSV files (auto-cleared after processing)
│   ├── .env                ← YOUR SECRETS
│   ├── package.json
│   └── server.js           ← Express entry point
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js          ← Routes + role guards
│   │   ├── index.js
│   │   ├── index.css       ← All styles (SlotSync reference design)
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── utils/
│   │   │   └── api.js      ← Axios instance with JWT interceptor
│   │   ├── components/
│   │   │   ├── common/     ← Sidebar, TopHeader, ConflictAlert, Toast
│   │   │   └── timetable/  ← TimetableGrid (drag & drop), AddEntryModal
│   │   └── pages/
│   │       ├── LandingPage.js
│   │       ├── LoginPage.js
│   │       ├── assistant/  ← AssistantDashboard, Home, Timetable, OfficeMgmt, Approvals
│   │       ├── admin/      ← AdminDashboard, Home, Enrollment
│   │       ├── teacher/    ← TeacherDashboard (read-only timetable)
│   │       └── student/    ← StudentDashboard (read-only batch timetable)
│   ├── .env
│   └── package.json
│
└── package.json            ← Root scripts (npm run dev starts both)
```

---

## Neon PostgreSQL Setup (Step by Step)

### 1. Create Neon Account
Go to **https://neon.tech** → Sign up free

### 2. Create Project
- Click **New Project**
- Name: `juw-timetable`
- Region: `AWS ap-southeast-1` (Singapore — closest to Pakistan)
- Click **Create Project**

### 3. Get Connection String
- Go to **Connection Details** in your project
- Select **Pooled connection**
- Copy the string — looks like:
```
postgresql://neondb_owner:AbCdEf@ep-name-123.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### 4. Configure backend/.env
Open `backend/.env` and paste your connection string:
```env
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@YOUR_HOST.neon.tech/neondb?sslmode=require
JWT_SECRET=change_this_to_any_long_random_string
CLIENT_URL=http://localhost:3000
PORT=5000
```

### 5. Install Dependencies
```bash
# From project root
npm run install:all
```

### 6. Run Database Migration (ONE TIME)
```bash
npm run setup:db
```
This creates all tables and inserts the complete seed data from the 2025 timetable PDF.

### 7. Start the System
```bash
npm run dev
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

## Login Credentials

All passwords: **`juw@2025`**

| JUW ID | Role | Access |
|--------|------|--------|
| `ASSIST001` | Office Assistant | Full control + approve requests |
| `ADMIN001`  | Department Admin | All features via approval workflow |
| `T001`      | Teacher (Ms. Ummay Faseeha) | View own schedule only |
| `STU001`    | Student | View batch timetable only |

---

## Features

| Feature | Assistant | Admin | Teacher | Student |
|---------|:---------:|:-----:|:-------:|:-------:|
| View Timetable | All | All | Own | Batch |
| Add/Edit Timetable | Direct | Via approval | — | — |
| Drag & Drop | Yes | Yes | — | — |
| Conflict Detection | Yes | Yes | — | — |
| Manage Teachers/Rooms/Batches | Full CRUD | Submit request | — | — |
| Approve/Reject Requests | Yes | — | — | — |
| Enroll Students | Yes | Yes | — | — |
| CSV Bulk Upload | Yes | Yes | — | — |

---

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/login` | Login (auto role detection) |
| GET | `/api/auth/profile` | Current user profile |
| GET | `/api/timetable` | Get timetable (role-filtered) |
| POST | `/api/timetable` | Add entry |
| PUT | `/api/timetable/:id` | Update / drag-drop entry |
| DELETE | `/api/timetable/:id` | Delete entry |
| POST | `/api/timetable/check-conflicts` | Conflict check only |
| GET | `/api/office/stats` | Dashboard stats |
| GET/POST | `/api/office/teachers` | Teacher management |
| GET/POST | `/api/office/rooms` | Room management |
| GET/POST | `/api/office/batches` | Batch management |
| GET/POST | `/api/office/subjects` | Subject management |
| GET | `/api/approvals/pending` | Pending requests |
| POST | `/api/approvals/:id/approve` | Approve + execute |
| POST | `/api/approvals/:id/reject` | Reject with note |
| GET/POST | `/api/enrollment` | Student enrollment |
| POST | `/api/enrollment/bulk` | CSV bulk upload |

---

## CSV Bulk Enrollment Format

Download the template from the Enrollment page, or create:
```csv
student_id,full_name
STU2025001,Ms. Fatima Khan
STU2025002,Ms. Ayesha Ahmed
```

---

*Final Year Project — Jinnah University for Women, CS & SE Department, 2025*
