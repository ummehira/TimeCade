// backend/controllers/timetableController.js
const pool = require('../config/db');
const { detectConflicts }        = require('../services/conflictService');
const { notifyTimetableChange }  = require('../services/notificationService');

// ── Slot definitions ──────────────────────────────────────────────────────
// Regular slots: 1 hour
// Lab slots: same start time but 3-hour duration
const SLOT_LABELS = {
  1: '9:00 - 10:00',
  2: '10:00 - 11:00',
  3: '11:00 - 12:00',
  4: '12:00 - 1:00',
  5: '1:00 - 2:00',
};

const LAB_SLOT_LABELS = {
  1: '9:00 - 12:00 (Lab)',
  2: '10:00 - 1:00 (Lab)',
  3: '11:00 - 2:00 (Lab)',
  4: '12:00 - 3:00 (Lab)',
  5: '1:00 - 4:00 (Lab)',
};

function getSlotLabel(time_slot, is_lab) {
  if (is_lab) return LAB_SLOT_LABELS[time_slot] || `Slot ${time_slot} (Lab - 3hrs)`;
  return SLOT_LABELS[time_slot] || `Slot ${time_slot}`;
}

// GET /api/timetable
const getTimetable = async (req, res) => {
  try {
    const { batch_id, teacher_id, semester } = req.query;
    const { role, id: userId } = req.user;

    let where = 'WHERE 1=1';
    const params = [];

    if (role === 'teacher') {
      // If a specific batch_id is requested (e.g. from full timetable view), filter by batch only
      // Otherwise filter by the teacher's own entries
      if (batch_id) {
        params.push(batch_id);
        where += ` AND t.batch_id=$${params.length}`;
      } else {
        const tRes = await pool.query('SELECT id FROM teachers WHERE user_id=$1', [userId]);
        if (!tRes.rows.length) return res.json([]);
        params.push(tRes.rows[0].id);
        where += ` AND t.teacher_id=$${params.length}`;
      }
    } else if (role === 'student') {
      const sRes = await pool.query('SELECT batch_id FROM students WHERE user_id=$1', [userId]);
      if (!sRes.rows.length) return res.json([]);
      params.push(sRes.rows[0].batch_id);
      where += ` AND t.batch_id=$${params.length}`;
    } else {
      if (batch_id)   { params.push(batch_id);   where += ` AND t.batch_id=$${params.length}`; }
      if (teacher_id) { params.push(teacher_id); where += ` AND t.teacher_id=$${params.length}`; }
      // Show all classes for the batch regardless of session filter
      // Session/semester is informational only in the timetable view
    }

    const result = await pool.query(
      `SELECT t.id, t.day, t.time_slot, t.is_lab, t.semester,
              CASE WHEN t.is_lab THEN
                CASE t.time_slot
                  WHEN 1 THEN '9:00 - 12:00 (Lab)'
                  WHEN 2 THEN '10:00 - 1:00 (Lab)'
                  WHEN 3 THEN '11:00 - 2:00 (Lab)'
                  WHEN 4 THEN '12:00 - 3:00 (Lab)'
                  WHEN 5 THEN '1:00 - 4:00 (Lab)'
                  ELSE t.slot_label
                END
              ELSE
                CASE t.time_slot
                  WHEN 1 THEN '9:00 - 10:00'
                  WHEN 2 THEN '10:00 - 11:00'
                  WHEN 3 THEN '11:00 - 12:00'
                  WHEN 4 THEN '12:00 - 1:00'
                  WHEN 5 THEN '1:00 - 2:00'
                  ELSE t.slot_label
                END
              END AS slot_label,
              b.id AS batch_id, b.batch_name, b.major_code, b.year,
              s.id AS subject_id, s.name AS subject_name, s.short_name,
              s.has_lab AS subject_has_lab,
              te.id AS teacher_id, te.full_name AS teacher_name, te.teacher_id AS teacher_code,
              r.id AS room_id, r.room_id AS room_code, r.room_name, r.capacity
       FROM timetable t
       JOIN batches  b  ON t.batch_id   = b.id
       JOIN subjects s  ON t.subject_id = s.id
       LEFT JOIN teachers te ON t.teacher_id = te.id
       LEFT JOIN rooms    r  ON t.room_id    = r.id
       ${where}
       ORDER BY CASE t.day
         WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
         WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
       END, t.time_slot`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getTimetable:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Helper: enrich request data with human-readable names
async function enrichRequestData(data) {
  const enriched = { ...data };
  try {
    if (data.batch_id) {
      const r = await pool.query('SELECT batch_name FROM batches WHERE id=$1', [data.batch_id]);
      if (r.rows.length) enriched.batch_name = r.rows[0].batch_name;
    }
    if (data.subject_id) {
      const r = await pool.query('SELECT name, short_name, has_lab FROM subjects WHERE id=$1', [data.subject_id]);
      if (r.rows.length) {
        enriched.subject_name = r.rows[0].name;
        enriched.subject_short = r.rows[0].short_name;
        enriched.subject_has_lab = r.rows[0].has_lab;
      }
    }
    if (data.teacher_id) {
      const r = await pool.query('SELECT full_name FROM teachers WHERE id=$1', [data.teacher_id]);
      if (r.rows.length) enriched.teacher_name = r.rows[0].full_name;
    }
    if (data.room_id) {
      const r = await pool.query('SELECT room_id, capacity FROM rooms WHERE id=$1', [data.room_id]);
      if (r.rows.length) {
        enriched.room_code = r.rows[0].room_id;
        enriched.room_capacity = r.rows[0].capacity;
      }
    }
    if (data.time_slot) {
      enriched.slot_label = getSlotLabel(data.time_slot, data.is_lab);
    }
  } catch (e) {
    console.error('enrichRequestData error:', e.message);
  }
  return enriched;
}

// POST /api/timetable
const createEntry = async (req, res) => {
  try {
    const { batch_id, subject_id, teacher_id, room_id, day, time_slot, is_lab, semester } = req.body;
    // Check if this is an FYP course — teacher is optional for FYP
    const subjectRes = await pool.query('SELECT has_lab, name, code FROM subjects WHERE id=$1', [subject_id]);
    const isFYP = /fyp|final.year.project/i.test((subjectRes.rows[0]?.name||'')+' '+(subjectRes.rows[0]?.code||''));

    if (!batch_id || !subject_id || (!teacher_id && !isFYP) || !room_id || !day || !time_slot)
      return res.status(400).json({ message: isFYP ? 'batch_id, subject_id, room_id, day and time_slot are required.' : 'All fields are required.' });

    // Check if subject has lab — force is_lab if so
    const subjectHasLab = subjectRes.rows[0]?.has_lab || false;
    const finalIsLab = is_lab || false;

    // Lab sessions need 3 hours — slots 4 (12pm) and 5 (1pm) would exceed 2pm closing time
    if (finalIsLab && parseInt(time_slot) > 3) {
      return res.status(400).json({
        message: 'Lab sessions cannot start at slot 4 (12:00) or slot 5 (1:00) — they would exceed the 2:00 PM closing time. Choose slots 1 (9:00), 2 (10:00), or 3 (11:00).'
      });
    }

    const conflicts = await detectConflicts({ batch_id, teacher_id: teacher_id||null, room_id, day, time_slot });
    if (conflicts.length) return res.status(409).json({ message: 'Conflict detected', conflicts });

    const slot_label = getSlotLabel(time_slot, finalIsLab);



    const finalTeacherId = teacher_id || null;  // null for FYP courses
    const result = await pool.query(
      `INSERT INTO timetable (batch_id,subject_id,teacher_id,room_id,day,time_slot,slot_label,is_lab,semester)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [batch_id, subject_id, finalTeacherId, room_id||null, day, time_slot, slot_label, finalIsLab, semester || 1]
    );
    const created = result.rows[0];
    // Notify affected teacher and students
    notifyTimetableChange({
      actor_id: req.user.id,
      action: 'added',
      entry: {
        batch_id:     created.batch_id,
        teacher_id:   created.teacher_id,
        subject_name: subjectRes.rows[0]?.name || subject_id,
        day:          created.day,
        slot_label:   created.slot_label,
        room_code:    null,
      }
    });
    res.status(201).json(created);
  } catch (err) {
    console.error('createEntry:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/timetable/:id
const updateEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { batch_id, subject_id, teacher_id, room_id, day, time_slot, is_lab } = req.body;

    const finalTeacherId = teacher_id || null;
    const conflicts = await detectConflicts({ batch_id, teacher_id: finalTeacherId, room_id, day, time_slot, exclude_id: id });
    if (conflicts.length) return res.status(409).json({ message: 'Conflict detected', conflicts });

    const slot_label = getSlotLabel(time_slot, is_lab);

    const result = await pool.query(
      `UPDATE timetable SET batch_id=$1,subject_id=$2,teacher_id=$3,room_id=$4,
       day=$5,time_slot=$6,slot_label=$7,is_lab=$8,updated_at=NOW() WHERE id=$9 RETURNING *`,
      [batch_id, subject_id, finalTeacherId, room_id, day, time_slot, slot_label, is_lab || false, id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Entry not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateEntry:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/timetable/:id
const deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM timetable WHERE id=$1', [id]);
    res.json({ message: 'Entry deleted.' });
  } catch (err) {
    console.error('deleteEntry:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/timetable/check-conflicts
const checkConflicts = async (req, res) => {
  try {
    const { batch_id, teacher_id, room_id, day, time_slot, exclude_id } = req.body;
    const conflicts = await detectConflicts({ batch_id, teacher_id, room_id, day, time_slot, exclude_id });
    res.json({ hasConflict: conflicts.length > 0, conflicts });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/timetable/reschedule-request  (teacher only)
const teacherRescheduleRequest = async (req, res) => {
  try {
    const { timetable_id, new_day, new_time_slot, reason } = req.body;
    if (!timetable_id || !new_day || !new_time_slot)
      return res.status(400).json({ message: 'timetable_id, new_day and new_time_slot are required.' });

    const entryRes = await pool.query(
      `SELECT t.*, b.batch_name, s.name AS subject_name, s.short_name,
              te.full_name AS teacher_name, r.room_id AS room_code
       FROM timetable t
       JOIN batches b  ON t.batch_id   = b.id
       JOIN subjects s ON t.subject_id = s.id
       LEFT JOIN teachers te ON t.teacher_id = te.id
       LEFT JOIN rooms r    ON t.room_id    = r.id
       WHERE t.id = $1`, [timetable_id]
    );
    if (!entryRes.rows.length)
      return res.status(404).json({ message: 'Timetable entry not found.' });

    const entry = entryRes.rows[0];
    const { detectConflicts }        = require('../services/conflictService');
const { notifyTimetableChange }  = require('../services/notificationService');
    const conflicts = await detectConflicts({
      batch_id: entry.batch_id, teacher_id: entry.teacher_id,
      room_id: entry.room_id, day: new_day,
      time_slot: parseInt(new_time_slot), exclude_id: timetable_id
    });
    if (conflicts.length)
      return res.status(409).json({ message: 'Conflict detected', conflicts });

    const newSlotLabel = getSlotLabel(parseInt(new_time_slot), entry.is_lab);
    const oldSlotLabel = getSlotLabel(entry.time_slot, entry.is_lab);

    const requestData = {
      batch_id: entry.batch_id,   batch_name: entry.batch_name,
      subject_id: entry.subject_id, subject_name: entry.subject_name,
      teacher_id: entry.teacher_id, teacher_name: entry.teacher_name,
      room_id: entry.room_id,     room_code: entry.room_code,
      day: new_day,
      time_slot: parseInt(new_time_slot),
      slot_label: newSlotLabel,
      is_lab: entry.is_lab,
      timetable_entry_id: timetable_id,
      old_day: entry.day,
      old_slot_label: oldSlotLabel,
      old_batch_name: entry.batch_name,
      old_subject_name: entry.subject_name,
      old_teacher_name: entry.teacher_name,
      old_room_code: entry.room_code,
      teacher_reason: reason || '',
    };

    await pool.query(
      `INSERT INTO admin_requests (requested_by, request_type, entity_type, entity_id, request_data)
       VALUES ($1, 'update', 'timetable', $2, $3)`,
      [req.user.id, timetable_id, JSON.stringify(requestData)]
    );

    res.json({ message: 'Reschedule request submitted. Awaiting Office Assistant approval.' });
  } catch (err) {
    console.error('teacherRescheduleRequest:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getTimetable, createEntry, updateEntry, deleteEntry, checkConflicts, teacherRescheduleRequest };