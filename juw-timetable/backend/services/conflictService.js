// backend/services/conflictService.js
const pool = require('../config/db');

async function detectConflicts({ batch_id, teacher_id, room_id, day, time_slot, exclude_id = null }) {
  const conflicts = [];
  if (!day || !time_slot) return conflicts;
  const excl = exclude_id ? `AND t.id != ${parseInt(exclude_id)}` : '';

  // 1. Teacher conflict
  const teacherRes = await pool.query(
    `SELECT b.batch_name, s.name AS subject
     FROM timetable t
     JOIN batches b  ON t.batch_id   = b.id
     JOIN subjects s ON t.subject_id = s.id
     WHERE t.teacher_id = $1 AND t.day = $2 AND t.time_slot = $3 ${excl}`,
    [teacher_id, day, time_slot]
  );
  if (teacherRes.rows.length > 0) {
    const r = teacherRes.rows[0];
    conflicts.push({
      type: 'teacher',
      message: `Teacher conflict: This teacher is already teaching "${r.subject}" for ${r.batch_name} at ${day} slot ${time_slot}.`
    });
  }

  // 2. Room conflict — only if room_id is provided
  if (room_id) {
    const roomRes = await pool.query(
      `SELECT b.batch_name, s.name AS subject, r.room_id
       FROM timetable t
       JOIN batches b  ON t.batch_id   = b.id
       JOIN subjects s ON t.subject_id = s.id
       JOIN rooms r    ON t.room_id    = r.id
       WHERE t.room_id = $1 AND t.day = $2 AND t.time_slot = $3 ${excl}`,
      [room_id, day, time_slot]
    );
    if (roomRes.rows.length > 0) {
      const r = roomRes.rows[0];
      conflicts.push({
        type: 'room',
        message: `Room conflict: Room ${r.room_id} is already booked for "${r.subject}" (${r.batch_name}) at this time.`
      });
    }
  }

  // 3. Batch conflict
  const batchRes = await pool.query(
    `SELECT s.name AS subject
     FROM timetable t
     JOIN subjects s ON t.subject_id = s.id
     WHERE t.batch_id = $1 AND t.day = $2 AND t.time_slot = $3 ${excl}`,
    [batch_id, day, time_slot]
  );
  if (batchRes.rows.length > 0) {
    const r = batchRes.rows[0];
    conflicts.push({
      type: 'batch',
      message: `Batch conflict: This batch already has "${r.subject}" scheduled at this time slot.`
    });
  }

  // 4. Room capacity — only if room_id is provided
  if (room_id && batch_id) {
    const capacityRes = await pool.query(
      `SELECT r.capacity, r.room_id, b.student_count, b.batch_name
       FROM rooms r, batches b
       WHERE r.id = $1 AND b.id = $2`,
      [room_id, batch_id]
    );
    if (capacityRes.rows.length > 0) {
      const { capacity, room_id: rid, student_count, batch_name } = capacityRes.rows[0];
      if (student_count > capacity) {
        conflicts.push({
          type: 'capacity',
          message: `Capacity conflict: Room ${rid} holds ${capacity} students but ${batch_name} has ${student_count} students.`
        });
      }
    }
  }

  return conflicts;
}

module.exports = { detectConflicts };