// backend/services/conflictService.js
const pool = require('../config/db');

async function detectConflicts({ batch_id, subject_id, teacher_id, room_id, day, time_slot, exclude_id = null, is_shared = false }) {
  const conflicts = [];
  if (!day || !time_slot) return conflicts;
  const excl = exclude_id ? `AND t.id != ${parseInt(exclude_id)}` : '';

  // ── SHARED LECTURE MODE ──────────────────────────────────────────────────
  // Shared lecture = same teacher + same room + same slot, multiple batches.
  // Check:
  //   1. Batch conflict (same batch can't have 2 classes at same time) — always block
  //   2. Teacher must be same as whoever is already in that room at that slot
  //   3. Room must have same teacher (different teacher = different class = not shared)
  if (is_shared) {
    // 1. Batch conflict
    const batchRes = await pool.query(
      `SELECT s.name AS subject
       FROM timetable t
       JOIN subjects s ON t.subject_id = s.id
       WHERE t.batch_id = $1 AND t.day = $2 AND t.time_slot = $3 ${excl}`,
      [batch_id, day, time_slot]
    );
    if (batchRes.rows.length > 0) {
      conflicts.push({
        type: 'batch',
        message: `Batch conflict: This batch already has "${batchRes.rows[0].subject}" scheduled at this time slot.`
      });
      return conflicts;
    }

    // 2. Check existing class in this room at this slot
    if (room_id) {
      const roomCheck = await pool.query(
        `SELECT t.teacher_id, s.name AS subject, te.full_name AS teacher_name, r.room_id AS room_code
         FROM timetable t
         JOIN subjects s  ON t.subject_id = s.id
         JOIN rooms r     ON t.room_id    = r.id
         LEFT JOIN teachers te ON t.teacher_id = te.id
         WHERE t.room_id = $1 AND t.day = $2 AND t.time_slot = $3 ${excl}
         LIMIT 1`,
        [room_id, day, time_slot]
      );
      if (roomCheck.rows.length > 0) {
        const existing = roomCheck.rows[0];
        // Teacher must match
        if (parseInt(existing.teacher_id) !== parseInt(teacher_id)) {
          conflicts.push({
            type: 'shared_teacher_mismatch',
            message: `Shared lecture conflict: Room ${existing.room_code} already has a class with a different teacher (${existing.teacher_name}) at this slot. Shared lectures must have the same teacher.`
          });
        }
      }
    }

    // 3. Teacher must not be in a different room at this slot
    if (teacher_id) {
      const teacherCheck = await pool.query(
        `SELECT t.room_id, r.room_id AS room_code, s.name AS subject
         FROM timetable t
         JOIN subjects s ON t.subject_id = s.id
         JOIN rooms r    ON t.room_id    = r.id
         WHERE t.teacher_id = $1 AND t.day = $2 AND t.time_slot = $3 ${excl}
         LIMIT 1`,
        [teacher_id, day, time_slot]
      );
      if (teacherCheck.rows.length > 0) {
        const existing = teacherCheck.rows[0];
        if (parseInt(existing.room_id) !== parseInt(room_id)) {
          conflicts.push({
            type: 'shared_room_mismatch',
            message: `Shared lecture conflict: This teacher is already in room ${existing.room_code} at this slot. For shared lectures, the same room must be used.`
          });
        }
      }
    }

    return conflicts;
  }

  
  // ── NORMAL MODE — strict checks ──────────────────────────────────────────

  // 1. Teacher conflict
  if (teacher_id) {
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
  }

  // 2. Room conflict
  if (room_id) {
    const roomRes = await pool.query(
      `SELECT b.batch_name, s.name AS subject, r.room_id AS room_code
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
        message: `Room conflict: Room ${r.room_code} is already booked for "${r.subject}" (${r.batch_name}) at this time.`
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

  // 4. Room capacity
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