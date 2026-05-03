// backend/routes/assignmentRoutes.js
// Handles batch-subject and teacher-subject assignments + sessions
const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const canEdit = authorize('office_assistant');

// ══════════════════════════════════════════════════════════════
// BATCH-SUBJECT ASSIGNMENTS
// ══════════════════════════════════════════════════════════════

// GET /api/assignments/batch-subjects?batch_id=X&semester=Y
router.get('/batch-subjects', authenticate, async (req, res) => {
  try {
    const { batch_id, semester } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (batch_id) { params.push(batch_id); where += ` AND bs.batch_id=$${params.length}`; }
    if (semester) { params.push(semester); where += ` AND bs.semester=$${params.length}`; }

    const r = await pool.query(
      `SELECT bs.id, bs.batch_id, bs.subject_id, bs.semester,
              b.batch_name, s.name AS subject_name, s.short_name, s.credit_hours, s.has_lab,
              ARRAY(
                SELECT json_build_object('id', t.id, 'full_name', t.full_name, 'teacher_id', t.teacher_id)
                FROM teacher_subjects ts
                JOIN teachers t ON ts.teacher_id = t.id
                WHERE ts.subject_id = bs.subject_id
              ) AS assigned_teachers
       FROM batch_subjects bs
       JOIN batches b  ON bs.batch_id  = b.id
       JOIN subjects s ON bs.subject_id = s.id
       ${where}
       ORDER BY bs.semester, s.name`,
      params
    );
    res.json(r.rows);
  } catch (err) {
    console.error('getBatchSubjects:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/assignments/batch-subjects — assign subject to batch+semester
router.post('/batch-subjects', authenticate, canEdit, async (req, res) => {
  try {
    const { batch_id, subject_id, semester } = req.body;
    if (!batch_id || !subject_id || !semester)
      return res.status(400).json({ message: 'batch_id, subject_id and semester are required.' });

    const r = await pool.query(
      `INSERT INTO batch_subjects (batch_id, subject_id, semester)
       VALUES ($1,$2,$3) ON CONFLICT (batch_id, subject_id, semester) DO NOTHING RETURNING *`,
      [batch_id, subject_id, parseInt(semester)]
    );
    if (!r.rows.length) return res.status(400).json({ message: 'Subject already assigned to this batch and semester.' });
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('addBatchSubject:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/assignments/batch-subjects/:id
router.delete('/batch-subjects/:id', authenticate, canEdit, async (req, res) => {
  try {
    await pool.query('DELETE FROM batch_subjects WHERE id=$1', [req.params.id]);
    res.json({ message: 'Subject removed from batch.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ══════════════════════════════════════════════════════════════
// TEACHER-SUBJECT ASSIGNMENTS
// ══════════════════════════════════════════════════════════════

// GET /api/assignments/teacher-subjects?subject_id=X or teacher_id=Y
router.get('/teacher-subjects', authenticate, async (req, res) => {
  try {
    const { subject_id, teacher_id } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (subject_id) { params.push(subject_id); where += ` AND ts.subject_id=$${params.length}`; }
    if (teacher_id) { params.push(teacher_id); where += ` AND ts.teacher_id=$${params.length}`; }

    const r = await pool.query(
      `SELECT ts.id, ts.teacher_id, ts.subject_id,
              t.full_name AS teacher_name, t.teacher_id AS teacher_code,
              s.name AS subject_name, s.short_name, s.has_lab
       FROM teacher_subjects ts
       JOIN teachers t ON ts.teacher_id = t.id
       JOIN subjects s ON ts.subject_id = s.id
       ${where}
       ORDER BY s.name, t.full_name`,
      params
    );
    res.json(r.rows);
  } catch (err) {
    console.error('getTeacherSubjects:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/assignments/teacher-subjects
router.post('/teacher-subjects', authenticate, canEdit, async (req, res) => {
  try {
    const { teacher_id, subject_id } = req.body;
    if (!teacher_id || !subject_id)
      return res.status(400).json({ message: 'teacher_id and subject_id are required.' });

    const r = await pool.query(
      `INSERT INTO teacher_subjects (teacher_id, subject_id)
       VALUES ($1,$2) ON CONFLICT (teacher_id, subject_id) DO NOTHING RETURNING *`,
      [teacher_id, subject_id]
    );
    if (!r.rows.length) return res.status(400).json({ message: 'Teacher already assigned to this course.' });
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/assignments/teacher-subjects/:id
router.delete('/teacher-subjects/:id', authenticate, canEdit, async (req, res) => {
  try {
    await pool.query('DELETE FROM teacher_subjects WHERE id=$1', [req.params.id]);
    res.json({ message: 'Teacher removed from course.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ══════════════════════════════════════════════════════════════
// SESSIONS
// ══════════════════════════════════════════════════════════════

// GET /api/assignments/sessions?batch_id=X
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const { batch_id } = req.query;
    let where = '';
    const params = [];
    if (batch_id) { params.push(batch_id); where = `WHERE s.batch_id=$1`; }

    const r = await pool.query(
      `SELECT s.*, b.batch_name,
              (SELECT COUNT(*) FROM timetable t WHERE t.session_id = s.id) AS class_count
       FROM sessions s
       JOIN batches b ON s.batch_id = b.id
       ${where}
       ORDER BY s.batch_id, s.semester`,
      params
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/assignments/sessions
router.post('/sessions', authenticate, canEdit, async (req, res) => {
  try {
    const { batch_id, semester, session_name, start_date, end_date } = req.body;
    if (!batch_id || !semester || !session_name)
      return res.status(400).json({ message: 'batch_id, semester and session_name are required.' });

    const r = await pool.query(
      `INSERT INTO sessions (batch_id, semester, session_name, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (batch_id, semester) DO UPDATE
       SET session_name=$3, start_date=$4, end_date=$5
       RETURNING *`,
      [batch_id, semester, session_name, start_date || null, end_date || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/assignments/sessions/:id
router.delete('/sessions/:id', authenticate, canEdit, async (req, res) => {
  try {
    await pool.query('DELETE FROM sessions WHERE id=$1', [req.params.id]);
    res.json({ message: 'Session deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ══════════════════════════════════════════════════════════════
// SMART LOOKUPS for timetable form
// ══════════════════════════════════════════════════════════════

// GET /api/assignments/batch-courses?batch_id=X&semester=Y
// Returns subjects assigned to a batch for a semester (for timetable form dropdown)
router.get('/batch-courses', authenticate, async (req, res) => {
  try {
    const { batch_id, semester } = req.query;
    if (!batch_id) return res.status(400).json({ message: 'batch_id is required.' });

    const r = await pool.query(
      `SELECT s.id, s.name, s.short_name, s.code, s.credit_hours, s.has_lab,
              COALESCE(s.credit_format, CASE WHEN s.has_lab AND s.credit_hours>=3 THEN '3+1' WHEN s.has_lab AND s.credit_hours=2 THEN '2+1' WHEN s.has_lab AND s.credit_hours=0 THEN '0+3' WHEN NOT s.has_lab AND s.credit_hours=2 THEN '2+0' ELSE '3+0' END) AS credit_format,
              ARRAY(
                SELECT json_build_object('id', t.id, 'full_name', t.full_name)
                FROM teacher_subjects ts
                JOIN teachers t ON ts.teacher_id = t.id
                WHERE ts.subject_id = s.id
              ) AS teachers
       FROM batch_subjects bs
       JOIN subjects s ON bs.subject_id = s.id
       WHERE bs.batch_id = $1 ${semester ? 'AND bs.semester = $2' : ''}
       ORDER BY s.name`,
      semester ? [batch_id, semester] : [batch_id]
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/assignments/course-teachers?subject_id=X
// Returns teachers assigned to a specific course
router.get('/course-teachers', authenticate, async (req, res) => {
  try {
    const { subject_id } = req.query;
    if (!subject_id) return res.status(400).json({ message: 'subject_id is required.' });

    const r = await pool.query(
      `SELECT t.id, t.full_name, t.teacher_id AS teacher_code, t.specialization
       FROM teacher_subjects ts
       JOIN teachers t ON ts.teacher_id = t.id
       WHERE ts.subject_id = $1
       ORDER BY t.full_name`,
      [subject_id]
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;