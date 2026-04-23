// ============================================
// backend/controllers/officeController.js
// Teachers, Rooms, Batches, Subjects, Stats
// ============================================
const bcrypt = require('bcryptjs');
const pool   = require('../config/db');

// ── Dashboard Stats ──────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const [b, t, r, c] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM batches WHERE is_active=true'),
      pool.query('SELECT COUNT(*) FROM teachers WHERE is_active=true'),
      pool.query('SELECT COUNT(*) FROM rooms WHERE is_available=true'),
      pool.query('SELECT COUNT(*) FROM timetable')
    ]);
    res.json({
      totalBatches:  parseInt(b.rows[0].count),
      totalTeachers: parseInt(t.rows[0].count),
      totalRooms:    parseInt(r.rows[0].count),
      totalClasses:  parseInt(c.rows[0].count)
    });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
};

// ── Departments ──────────────────────────────
const getDepartments = async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM departments ORDER BY name');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
};

// ── Teachers ─────────────────────────────────
const getTeachers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.teacher_id, t.full_name, t.specialization, t.is_active,
              d.name AS department_name, d.code AS department_code,
              COALESCE(ARRAY_AGG(s.name) FILTER (WHERE s.name IS NOT NULL), '{}') AS subjects
       FROM teachers t
       LEFT JOIN departments d     ON t.department_id = d.id
       LEFT JOIN teacher_subjects ts ON t.id = ts.teacher_id
       LEFT JOIN subjects s        ON ts.subject_id = s.id
       GROUP BY t.id, d.name, d.code
       ORDER BY t.full_name`
    );
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
};

const addTeacher = async (req, res) => {
  try {
    const { teacher_id, full_name, department_id, specialization } = req.body;
    if (!teacher_id || !full_name || !department_id) {
      return res.status(400).json({ message: 'Teacher ID, name and department are required.' });
    }
    const exists = await pool.query('SELECT id FROM teachers WHERE teacher_id=$1', [teacher_id]);
    if (exists.rows.length) return res.status(400).json({ message: 'Teacher ID already exists. Use an unused ID.' });

    const hash = await bcrypt.hash('juw@2025', 10);
    const uRes = await pool.query(
      `INSERT INTO users (juw_id,password_hash,role,full_name,department_id)
       VALUES ($1,$2,'teacher',$3,$4) RETURNING id`,
      [teacher_id, hash, full_name, department_id]
    );
    const tRes = await pool.query(
      `INSERT INTO teachers (user_id,teacher_id,full_name,department_id,specialization)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [uRes.rows[0].id, teacher_id, full_name, department_id, specialization || null]
    );
    res.status(201).json({ message: 'Teacher added.', teacher: tRes.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
};

const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, department_id, specialization } = req.body;
    const r = await pool.query(
      'UPDATE teachers SET full_name=$1,department_id=$2,specialization=$3 WHERE id=$4 RETURNING *',
      [full_name, department_id, specialization, id]
    );
    if (!r.rows.length) return res.status(404).json({ message: 'Teacher not found.' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
};

const deleteTeacher = async (req, res) => {
  try {
    await pool.query('DELETE FROM teachers WHERE id=$1', [req.params.id]);
    res.json({ message: 'Teacher deleted.' });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
};

// ── Rooms ─────────────────────────────────────
const getRooms = async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM rooms ORDER BY room_id');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
};

const addRoom = async (req, res) => {
  try {
    const { room_id, room_name, capacity, room_type } = req.body;
    if (!room_id || !capacity) return res.status(400).json({ message: 'Room ID and capacity required.' });
    const exists = await pool.query('SELECT id FROM rooms WHERE room_id=$1', [room_id]);
    if (exists.rows.length) return res.status(400).json({ message: 'Room ID already exists.' });
    const r = await pool.query(
      'INSERT INTO rooms (room_id,room_name,capacity,room_type) VALUES ($1,$2,$3,$4) RETURNING *',
      [room_id, room_name || room_id, capacity, room_type || 'classroom']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
};

const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { room_name, capacity, room_type, is_available } = req.body;
    const r = await pool.query(
      'UPDATE rooms SET room_name=$1,capacity=$2,room_type=$3,is_available=$4 WHERE id=$5 RETURNING *',
      [room_name, capacity, room_type, is_available, id]
    );
    if (!r.rows.length) return res.status(404).json({ message: 'Room not found.' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
};

const deleteRoom = async (req, res) => {
  try {
    await pool.query('DELETE FROM rooms WHERE id=$1', [req.params.id]);
    res.json({ message: 'Room deleted.' });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
};

// ── Batches ───────────────────────────────────
const getBatches = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT b.*, d.name AS department_name FROM batches b
       LEFT JOIN departments d ON b.department_id=d.id
       WHERE b.year >= 2022
       ORDER BY b.year DESC, b.major_code, b.batch_name`
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
};

const addBatch = async (req, res) => {
  try {
    const { batch_name, major, major_code, year, semester, student_count, department_id } = req.body;
    if (parseInt(year) < 2022) {
      return res.status(400).json({ message: 'Cannot add batches from 2021 or earlier.' });
    }
    const r = await pool.query(
      `INSERT INTO batches (batch_name,major,major_code,year,semester,student_count,department_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [batch_name, major, major_code, year, semester || 1, student_count || 0, department_id]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Batch name already exists.' });
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteBatch = async (req, res) => {
  try {
    await pool.query('DELETE FROM batches WHERE id=$1', [req.params.id]);
    res.json({ message: 'Batch deleted.' });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
};

// ── Subjects ──────────────────────────────────
const getSubjects = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT s.*, d.name AS department_name FROM subjects s
       LEFT JOIN departments d ON s.department_id=d.id ORDER BY s.name`
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
};

const addSubject = async (req, res) => {
  try {
    const { code, name, short_name, credit_hours, department_id, has_lab, color } = req.body;
    const r = await pool.query(
      `INSERT INTO subjects (code,name,short_name,credit_hours,department_id,has_lab,color)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [code, name, short_name || code, credit_hours || 3, department_id || null, has_lab || false, color || '#4A90D9']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Subject code already exists.' });
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteSubject = async (req, res) => {
  try {
    await pool.query('DELETE FROM subjects WHERE id=$1', [req.params.id]);
    res.json({ message: 'Subject deleted.' });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
};

module.exports = {
  getDashboardStats, getDepartments,
  getTeachers, addTeacher, updateTeacher, deleteTeacher,
  getRooms, addRoom, updateRoom, deleteRoom,
  getBatches, addBatch, deleteBatch,
  getSubjects, addSubject, deleteSubject
};
