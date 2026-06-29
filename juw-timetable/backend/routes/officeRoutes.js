// backend/routes/officeRoutes.js
const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const canEdit = authorize('office_assistant');

// ── Departments ───────────────────────────────────────────────────────────
router.get('/departments', authenticate, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM departments ORDER BY name');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

// ── Batches ───────────────────────────────────────────────────────────────
router.get('/batches', authenticate, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT b.*, d.name AS department_name, r.room_id AS default_room_code, r.capacity AS default_room_capacity
       FROM batches b
       LEFT JOIN departments d ON b.department_id = d.id
       LEFT JOIN rooms r ON b.default_room_id = r.id
       ORDER BY b.year DESC, b.batch_name`
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

router.post('/batches', authenticate, canEdit, async (req, res) => {
  try {
    const { batch_name, major, major_code, year, semester, student_count, department_id, default_room_id } = req.body;
    if (!batch_name || !major) return res.status(400).json({ message: 'batch_name and major are required.' });
    const r = await pool.query(
      `INSERT INTO batches (batch_name, major, major_code, year, semester, student_count, department_id, default_room_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [batch_name, major, major_code || '', year || new Date().getFullYear(),
       semester || 1, student_count || 45, department_id || null, default_room_id || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Batch already exists.' });
    res.status(500).json({ message: 'Server error.' });
  }
});

router.put('/batches/:id', authenticate, canEdit, async (req, res) => {
  try {
    const { batch_name, major, major_code, year, semester, student_count, department_id, default_room_id } = req.body;
    const r = await pool.query(
      `UPDATE batches SET batch_name=$1, major=$2, major_code=$3, year=$4,
       semester=$5, student_count=$6, department_id=$7, default_room_id=$8 WHERE id=$9 RETURNING *`,
      [batch_name, major, major_code, year, semester, student_count, department_id, default_room_id||null, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ message: 'Batch not found.' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

router.delete('/batches/:id', authenticate, canEdit, async (req, res) => {
  try {
    await pool.query('DELETE FROM batch_subjects WHERE batch_id=$1', [req.params.id]);
    await pool.query('DELETE FROM timetable WHERE batch_id=$1', [req.params.id]);
    const r = await pool.query('DELETE FROM batches WHERE id=$1 RETURNING *', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ message: 'Batch not found.' });
    res.json({ message: 'Batch deleted.' });
  } catch (err) {
    console.error('deleteBatch:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── Teachers ──────────────────────────────────────────────────────────────
router.get('/teachers', authenticate, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT te.*, d.name AS department_name,
              ARRAY(
                SELECT DISTINCT s.name FROM timetable t
                JOIN subjects s ON t.subject_id = s.id
                WHERE t.teacher_id = te.id
              ) AS subjects
       FROM teachers te
       LEFT JOIN departments d ON te.department_id = d.id
       ORDER BY te.full_name`
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

router.post('/teachers', authenticate, canEdit, async (req, res) => {
  try {
    const { teacher_id, full_name, department_id, specialization } = req.body;
    if (!teacher_id || !full_name) return res.status(400).json({ message: 'teacher_id and full_name are required.' });
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('juw@2025', 10);
    const uRes = await pool.query(
      `INSERT INTO users (juw_id, password_hash, role, full_name, department_id)
       VALUES ($1,$2,'teacher',$3,$4)
       ON CONFLICT (juw_id) DO NOTHING RETURNING id`,
      [teacher_id, hash, full_name, department_id || null]
    );
    const userId = uRes.rows[0]?.id || (
      await pool.query('SELECT id FROM users WHERE juw_id=$1', [teacher_id])
    ).rows[0]?.id;
    const r = await pool.query(
      `INSERT INTO teachers (user_id, teacher_id, full_name, department_id, specialization)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (teacher_id) DO NOTHING RETURNING *`,
      [userId, teacher_id, full_name, department_id || null, specialization || '']
    );
    if (!r.rows.length) return res.status(400).json({ message: 'Teacher ID already exists.' });
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Teacher already exists.' });
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.put('/teachers/:id', authenticate, canEdit, async (req, res) => {
  try {
    const { full_name, department_id, specialization } = req.body;
    const r = await pool.query(
      `UPDATE teachers SET full_name=$1, department_id=$2, specialization=$3 WHERE id=$4 RETURNING *`,
      [full_name, department_id || null, specialization || '', req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ message: 'Teacher not found.' });
    await pool.query('UPDATE users SET full_name=$1 WHERE id=(SELECT user_id FROM teachers WHERE id=$2)', [full_name, req.params.id]);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

// ── DELETE /api/office/teachers/:id ──────────────────────────────────────
router.delete('/teachers/:id', authenticate, canEdit, async (req, res) => {
  try {
    const { id } = req.params;

    // Get user_id before deleting teacher record
    const teacherRes = await pool.query('SELECT user_id FROM teachers WHERE id=$1', [id]);
    if (!teacherRes.rows.length) return res.status(404).json({ message: 'Teacher not found.' });
    const userId = teacherRes.rows[0].user_id;

    // Remove teacher's course assignments
    await pool.query('DELETE FROM teacher_subjects WHERE teacher_id=$1', [id]);

    // Nullify timetable entries (keep the class, just remove the teacher reference)
    await pool.query('UPDATE timetable SET teacher_id=NULL WHERE teacher_id=$1', [id]);

    // Delete teacher record
    await pool.query('DELETE FROM teachers WHERE id=$1', [id]);

    // Delete the linked user account
    if (userId) {
      await pool.query('DELETE FROM users WHERE id=$1', [userId]);
    }

    res.json({ message: 'Teacher deleted.' });
  } catch (err) {
    console.error('deleteTeacher:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ── Subjects ──────────────────────────────────────────────────────────────
router.get('/subjects', authenticate, async (req, res) => {
  try {
    const { major_code } = req.query;
    let where = '';
    const params = [];
    if (major_code) {
      params.push(major_code);
      where = `WHERE EXISTS (
        SELECT 1 FROM subject_majors sm
        WHERE sm.subject_id = s.id AND sm.major_code = $1
      )`;
    }
    const r = await pool.query(
      `SELECT s.*,
              d.name AS department_name, d.code AS major_code,
              ARRAY(
                SELECT sm.major_code FROM subject_majors sm
                WHERE sm.subject_id = s.id ORDER BY sm.major_code
              ) AS major_codes
       FROM subjects s
       LEFT JOIN departments d ON s.department_id = d.id
       ${where}
       ORDER BY s.name`,
      params
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

router.post('/subjects', authenticate, canEdit, async (req, res) => {
  try {
    const { code, name, short_name, credit_hours, department_id, has_lab, credit_format, major_codes } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required.' });
    if (code && !/^[A-Z]{3} \d{4}$/.test(code)) {
      return res.status(400).json({ message: 'Invalid course code format. Must be 3 uppercase letters, a space, then 4 digits (e.g. CFG 4123).' });
    }
    const r = await pool.query(
      `INSERT INTO subjects (code, name, short_name, credit_hours, department_id, has_lab, credit_format)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [code || '', name, short_name || name.slice(0,8), credit_hours || 3, department_id || null, has_lab || false, credit_format || '3+0']
    );
    const subject = r.rows[0];
    const majors = Array.isArray(major_codes) ? major_codes : (major_codes ? [major_codes] : []);
    for (const mc of majors) {
      await pool.query(
        `INSERT INTO subject_majors (subject_id, major_code) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [subject.id, mc]
      );
    }
    subject.major_codes = majors;
    res.status(201).json(subject);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'A course with this code already exists.' });
    res.status(500).json({ message: 'Server error.' });
  }
});

router.put('/subjects/:id', authenticate, canEdit, async (req, res) => {
  try {
    const { code, name, short_name, credit_hours, department_id, has_lab, credit_format, major_codes } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required.' });
    if (code) {
      const existing = await pool.query('SELECT code FROM subjects WHERE id=$1', [req.params.id]);
      const currentCode = existing.rows[0]?.code;
      if (code !== currentCode && !/^[A-Z]{3} \d{4}$/.test(code)) {
        return res.status(400).json({ message: 'Invalid course code format. Must be 3 uppercase letters, a space, then 4 digits (e.g. CFG 4123).' });
      }
    }
    const r = await pool.query(
      `UPDATE subjects SET code=$1, name=$2, short_name=$3, credit_hours=$4,
       department_id=$5, has_lab=$6, credit_format=$7 WHERE id=$8 RETURNING *`,
      [code||name, name, short_name||name, parseInt(credit_hours)||3, department_id||null, has_lab||false, credit_format||'3+0', req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ message: 'Subject not found.' });
    const majors = Array.isArray(major_codes) ? major_codes : (major_codes ? [major_codes] : []);
    if (majors.length > 0) {
      await pool.query('DELETE FROM subject_majors WHERE subject_id=$1', [req.params.id]);
      for (const mc of majors) {
        await pool.query(
          `INSERT INTO subject_majors (subject_id, major_code) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [req.params.id, mc]
        );
      }
    }
    const subject = r.rows[0];
    subject.major_codes = majors;
    res.json(subject);
  } catch (err) {
    console.error('PUT /subjects/:id error:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.delete('/subjects/:id', authenticate, canEdit, async (req, res) => {
  try {
    await pool.query('DELETE FROM batch_subjects WHERE subject_id=$1',   [req.params.id]);
    await pool.query('DELETE FROM teacher_subjects WHERE subject_id=$1', [req.params.id]);
    await pool.query('DELETE FROM timetable WHERE subject_id=$1',        [req.params.id]);
    const r = await pool.query('DELETE FROM subjects WHERE id=$1 RETURNING *', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ message: 'Course not found.' });
    res.json({ message: 'Course deleted.' });
  } catch (err) {
    console.error('deleteCourse:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── Rooms ─────────────────────────────────────────────────────────────────
router.get('/rooms', authenticate, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM rooms ORDER BY room_id');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

router.post('/rooms', authenticate, canEdit, async (req, res) => {
  try {
    const { room_id, room_name, capacity, room_type } = req.body;
    if (!room_id || !capacity) return res.status(400).json({ message: 'room_id and capacity are required.' });
    const r = await pool.query(
      `INSERT INTO rooms (room_id, room_name, capacity, room_type, is_available)
       VALUES ($1,$2,$3,$4,true) RETURNING *`,
      [room_id, room_name || room_id, capacity, room_type || 'classroom']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Room ID already exists.' });
    res.status(500).json({ message: 'Server error.' });
  }
});

router.put('/rooms/:id', authenticate, canEdit, async (req, res) => {
  try {
    const { room_name, capacity, room_type, is_available } = req.body;
    const r = await pool.query(
      `UPDATE rooms SET room_name=$1, capacity=$2, room_type=$3, is_available=$4 WHERE id=$5 RETURNING *`,
      [room_name, capacity, room_type || 'classroom', is_available !== undefined ? is_available : true, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ message: 'Room not found.' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

// ── Room Schedule ─────────────────────────────────────────────────────────
router.get('/room-schedule', authenticate, async (req, res) => {
  try {
    const { room_id } = req.query;
    if (!room_id) return res.status(400).json({ message: 'room_id is required.' });
    const result = await pool.query(
      `SELECT t.id, t.day, t.time_slot::int AS time_slot, t.is_lab,
              CASE WHEN t.is_lab THEN
                CASE t.time_slot::int
                  WHEN 1 THEN '9:00 - 12:00 (Lab)' WHEN 2 THEN '10:00 - 1:00 (Lab)'
                  WHEN 3 THEN '11:00 - 2:00 (Lab)' WHEN 4 THEN '12:00 - 3:00 (Lab)'
                  WHEN 5 THEN '1:00 - 4:00 (Lab)' ELSE t.slot_label END
              ELSE
                CASE t.time_slot::int
                  WHEN 1 THEN '9:00 - 10:00' WHEN 2 THEN '10:00 - 11:00'
                  WHEN 3 THEN '11:00 - 12:00' WHEN 4 THEN '12:00 - 1:00'
                  WHEN 5 THEN '1:00 - 2:00' ELSE t.slot_label END
              END AS slot_label,
              b.id AS batch_id, b.batch_name,
              s.id AS subject_id, s.name AS subject_name, s.short_name,
              te.id AS teacher_id, te.full_name AS teacher_name,
              r.id AS room_id, r.room_id AS room_code, r.capacity
       FROM timetable t
       JOIN batches  b  ON t.batch_id   = b.id
       JOIN subjects s  ON t.subject_id = s.id
       LEFT JOIN teachers te ON t.teacher_id = te.id
       JOIN rooms    r  ON t.room_id    = r.id
       WHERE r.id = $1
       ORDER BY CASE t.day
         WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
         WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
       END, t.time_slot::int`,
      [room_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getRoomSchedule:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── Batch Timetable ───────────────────────────────────────────────────────
router.get('/batch-timetable', authenticate, async (req, res) => {
  try {
    const { batch_id, semester } = req.query;
    if (!batch_id) return res.status(400).json({ message: 'batch_id is required.' });

    let whereClause = 'WHERE t.batch_id = $1';
    const params = [batch_id];
    if (semester) { params.push(parseInt(semester)); whereClause += ` AND t.semester = $${params.length}`; }

    const result = await pool.query(
      `SELECT t.id, t.day, t.time_slot::int AS time_slot, t.is_lab, t.semester,
              CASE WHEN t.is_lab THEN
                CASE t.time_slot::int
                  WHEN 1 THEN '9:00 - 12:00 (Lab)' WHEN 2 THEN '10:00 - 1:00 (Lab)'
                  WHEN 3 THEN '11:00 - 2:00 (Lab)' WHEN 4 THEN '12:00 - 3:00 (Lab)'
                  WHEN 5 THEN '1:00 - 4:00 (Lab)' ELSE t.slot_label END
              ELSE
                CASE t.time_slot::int
                  WHEN 1 THEN '9:00 - 10:00' WHEN 2 THEN '10:00 - 11:00'
                  WHEN 3 THEN '11:00 - 12:00' WHEN 4 THEN '12:00 - 1:00'
                  WHEN 5 THEN '1:00 - 2:00' ELSE t.slot_label END
              END AS slot_label,
              b.id AS batch_id, b.batch_name, b.major_code,
              s.id AS subject_id, s.name AS subject_name, s.short_name,
              te.id AS teacher_id, te.full_name AS teacher_name,
              r.id AS room_id, r.room_id AS room_code, r.capacity
       FROM timetable t
       JOIN batches  b  ON t.batch_id   = b.id
       JOIN subjects s  ON t.subject_id = s.id
       JOIN teachers te ON t.teacher_id = te.id
       JOIN rooms    r  ON t.room_id    = r.id
       ${whereClause}
       ORDER BY CASE t.day
         WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
         WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
       END, t.time_slot::int`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error('batchTimetable error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ── Stats ─────────────────────────────────────────────────────────────────
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [batches, teachers, rooms, classes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM batches'),
      pool.query('SELECT COUNT(*) FROM teachers'),
      pool.query('SELECT COUNT(*) FROM rooms'),
      pool.query('SELECT COUNT(*) FROM timetable'),
    ]);
    res.json({
      totalBatches:  parseInt(batches.rows[0].count),
      totalTeachers: parseInt(teachers.rows[0].count),
      totalRooms:    parseInt(rooms.rows[0].count),
      totalClasses:  parseInt(classes.rows[0].count),
    });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

module.exports = router;