// backend/controllers/approvalController.js
const pool = require('../config/db');

const SLOT_LABELS = {
  1:'9:00 - 10:00', 2:'10:00 - 11:00', 3:'11:00 - 12:00',
  4:'12:00 - 1:00', 5:'1:00 - 2:00'
};

const LAB_SLOT_LABELS = {
  1:'9:00 - 12:00 (Lab)', 2:'10:00 - 1:00 (Lab)', 3:'11:00 - 2:00 (Lab)',
  4:'12:00 - 3:00 (Lab)', 5:'1:00 - 4:00 (Lab)'
};

function getSlotLabel(time_slot, is_lab) {
  if (is_lab) return LAB_SLOT_LABELS[time_slot] || `Slot ${time_slot} (Lab)`;
  return SLOT_LABELS[time_slot] || `Slot ${time_slot}`;
}

// Enrich request_data with human-readable names
async function enrichData(data) {
  if (!data) return data;
  const d = { ...data };
  try {
    if (d.subject_id && !d.subject_name) {
      const r = await pool.query('SELECT name, short_name FROM subjects WHERE id=$1', [d.subject_id]);
      if (r.rows.length) { d.subject_name = r.rows[0].name; d.subject_short = r.rows[0].short_name; }
    }
    if (d.teacher_id && !d.teacher_name) {
      const r = await pool.query('SELECT full_name FROM teachers WHERE id=$1', [d.teacher_id]);
      if (r.rows.length) d.teacher_name = r.rows[0].full_name;
    }
    if (d.batch_id && !d.batch_name) {
      const r = await pool.query('SELECT batch_name FROM batches WHERE id=$1', [d.batch_id]);
      if (r.rows.length) d.batch_name = r.rows[0].batch_name;
    }
    if (d.room_id && !d.room_code) {
      const r = await pool.query('SELECT room_id FROM rooms WHERE id=$1', [d.room_id]);
      if (r.rows.length) d.room_code = r.rows[0].room_id;
    }
    if (d.time_slot && !d.slot_label) {
      d.slot_label = getSlotLabel(d.time_slot, d.is_lab);
    }
    if (d.timetable_entry_id && (!d.old_subject_name || !d.old_day)) {
      try {
        const old = await pool.query(
          `SELECT t.day, t.time_slot, t.is_lab,
                  b.batch_name, s.name AS subject_name,
                  te.full_name AS teacher_name, r.room_id AS room_code
           FROM timetable t
           JOIN batches b  ON t.batch_id   = b.id
           JOIN subjects s ON t.subject_id = s.id
           JOIN teachers te ON t.teacher_id = te.id
           JOIN rooms r    ON t.room_id    = r.id
           WHERE t.id = $1`, [d.timetable_entry_id]
        );
        if (old.rows.length) {
          const o = old.rows[0];
          d.old_day          = d.old_day          || o.day;
          d.old_slot_label   = d.old_slot_label   || getSlotLabel(o.time_slot, o.is_lab);
          d.old_batch_name   = d.old_batch_name   || o.batch_name;
          d.old_subject_name = d.old_subject_name || o.subject_name;
          d.old_teacher_name = d.old_teacher_name || o.teacher_name;
          d.old_room_code    = d.old_room_code    || o.room_code;
        }
      } catch (_) {}
    }
    if (d.timetable_id && !d.subject_name) {
      try {
        const e = await pool.query(
          `SELECT t.day, t.time_slot, t.is_lab,
                  b.batch_name, s.name AS subject_name,
                  te.full_name AS teacher_name, r.room_id AS room_code
           FROM timetable t
           JOIN batches b  ON t.batch_id   = b.id
           JOIN subjects s ON t.subject_id = s.id
           JOIN teachers te ON t.teacher_id = te.id
           JOIN rooms r    ON t.room_id    = r.id
           WHERE t.id = $1`, [d.timetable_id]
        );
        if (e.rows.length) {
          const o = e.rows[0];
          d.day          = o.day;
          d.slot_label   = getSlotLabel(o.time_slot, o.is_lab);
          d.batch_name   = o.batch_name;
          d.subject_name = o.subject_name;
          d.teacher_name = o.teacher_name;
          d.room_code    = o.room_code;
        }
      } catch (_) {}
    }
  } catch (e) {
    console.error('enrichData error:', e.message);
  }
  return d;
}

// Helper: send notification to request owner
async function sendNotification(db, { userId, actorId, type, title, message, requestId }) {
  if (!userId) { console.log('[notify] skipped — no userId'); return; }
  try {
    await db.query(
      `INSERT INTO notifications (user_id, actor_id, type, title, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, actorId || null, type, title, message]
    );
    console.log(`[notify-approval] ${type} → user_id=${userId} OK`);
  } catch (e) {
    console.error('sendNotification error:', e.message);
  }
}

// GET /api/approvals
const getAllRequests = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT ar.*, u.full_name AS requested_by_name, u.juw_id AS requested_by_juw,
              rv.full_name AS reviewed_by_name
       FROM admin_requests ar
       JOIN users u ON ar.requested_by = u.id
       LEFT JOIN users rv ON ar.reviewed_by = rv.id
       ORDER BY ar.created_at DESC LIMIT 200`
    );
    const enriched = await Promise.all(
      r.rows.map(async row => ({ ...row, request_data: await enrichData(row.request_data) }))
    );
    res.json(enriched);
  } catch (err) {
    console.error('getAllRequests:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/approvals/pending
const getPendingRequests = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT ar.*, u.full_name AS requested_by_name, u.juw_id AS requested_by_juw
       FROM admin_requests ar
       JOIN users u ON ar.requested_by = u.id
       WHERE ar.status = 'pending'
       ORDER BY ar.created_at DESC`
    );
    const enriched = await Promise.all(
      r.rows.map(async row => ({ ...row, request_data: await enrichData(row.request_data) }))
    );
    res.json(enriched);
  } catch (err) {
    console.error('getPendingRequests:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/approvals/:id/approve
const approveRequest = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { review_note } = req.body;

    const reqRes = await client.query('SELECT * FROM admin_requests WHERE id=$1', [id]);
    if (!reqRes.rows.length) return res.status(404).json({ message: 'Request not found.' });
    const request = reqRes.rows[0];
    if (request.status !== 'pending') return res.status(400).json({ message: 'Already reviewed.' });

    const data = request.request_data;

    if (request.entity_type === 'timetable') {
      if (request.request_type === 'create') {
        const slotLabel = getSlotLabel(data.time_slot, data.is_lab);
        await client.query(
          `INSERT INTO timetable (batch_id,subject_id,teacher_id,room_id,day,time_slot,slot_label,is_lab)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [data.batch_id, data.subject_id, data.teacher_id, data.room_id,
           data.day, data.time_slot, slotLabel, data.is_lab || false]
        );
      } else if (request.request_type === 'update') {
        const entryId = data.timetable_entry_id || request.entity_id;
        const slotLabel = getSlotLabel(data.time_slot, data.is_lab);
        await client.query(
          `UPDATE timetable SET batch_id=$1,subject_id=$2,teacher_id=$3,room_id=$4,
           day=$5,time_slot=$6,slot_label=$7,is_lab=$8,updated_at=NOW() WHERE id=$9`,
          [data.batch_id, data.subject_id, data.teacher_id, data.room_id,
           data.day, data.time_slot, slotLabel, data.is_lab || false, entryId]
        );
      } else if (request.request_type === 'delete') {
        const entryId = data.timetable_id || request.entity_id;
        await client.query('DELETE FROM timetable WHERE id=$1', [entryId]);
      }
    }

    await client.query(
      `UPDATE admin_requests SET status='approved',reviewed_by=$1,review_note=$2,reviewed_at=NOW() WHERE id=$3`,
      [req.user.id, review_note || 'Approved', id]
    );

    // Build rich notification for the requesting teacher
    const d = await enrichData(data);
    let approveTitle, approveMsg;

    if (request.request_type === 'update') {
      // Reschedule approved
      const subj     = d.subject_name || d.old_subject_name || 'Your class';
      const batch    = d.batch_name   || d.old_batch_name   || '';
      const newDay   = d.day          || '';
      const newTime  = d.slot_label   || '';
      const newRoom  = d.room_code    ? ` in ${d.room_code}` : '';
      const oldDay   = d.old_day      || '';
      const oldTime  = d.old_slot_label || '';
      approveTitle = `Reschedule request approved`;
      approveMsg   = `Your request to reschedule ${subj}${batch ? ' ('+batch+')' : ''} has been approved.`
                   + (oldDay   ? ` Old schedule: ${oldDay} at ${oldTime}.` : '')
                   + (newDay   ? ` New schedule: ${newDay} at ${newTime}${newRoom}.` : '')
                   + (review_note ? ` Note: ${review_note}` : '');
    } else if (request.request_type === 'create') {
      const subj  = d.subject_name || 'A new class';
      const batch = d.batch_name   || '';
      const day   = d.day          || '';
      const time  = d.slot_label   || '';
      approveTitle = `Add class request approved`;
      approveMsg   = `Your request to add ${subj}${batch ? ' ('+batch+')' : ''}${day ? ' on '+day : ''}${time ? ' at '+time : ''} has been approved.`
                   + (review_note ? ` Note: ${review_note}` : '');
    } else {
      const subj  = d.subject_name || 'a class';
      const detail = `${subj}${d.batch_name?' for '+d.batch_name:''}${d.day?' on '+d.day:''}`;
      approveTitle = 'Request approved';
      approveMsg   = `Your request (${detail}) has been approved.`
                   + (review_note ? ` Note: ${review_note}` : '');
    }

    await client.query('COMMIT');

    // Send notification AFTER commit so it's never rolled back
    console.log(`[approval] Sending approved notif → requested_by=${request.requested_by}, type=request_approved`);
    await sendNotification(pool, {
      userId:    request.requested_by,
      actorId:   req.user.id,
      type:      'request_approved',
      title:     approveTitle,
      message:   approveMsg,
      requestId: parseInt(id),
    });

    res.json({ message: 'Request approved and applied.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('approveRequest:', err);
    res.status(500).json({ message: 'Server error.' });
  } finally { client.release(); }
};

// POST /api/approvals/:id/reject
const rejectRequest = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { review_note } = req.body;
    if (!review_note?.trim()) return res.status(400).json({ message: 'Rejection reason is required.' });

    const reqRes = await client.query('SELECT * FROM admin_requests WHERE id=$1 AND status=\'pending\'', [id]);
    if (!reqRes.rows.length) return res.status(404).json({ message: 'Request not found or already reviewed.' });
    const request = reqRes.rows[0];

    await client.query(
      `UPDATE admin_requests SET status='rejected',reviewed_by=$1,review_note=$2,reviewed_at=NOW() WHERE id=$3`,
      [req.user.id, review_note, id]
    );

    // Build rich rejection notification
    const d = await enrichData(request.request_data);
    let rejectTitle, rejectMsg;

    if (request.request_type === 'update') {
      const subj   = d.subject_name || d.old_subject_name || 'Your class';
      const batch  = d.batch_name   || d.old_batch_name   || '';
      const oldDay = d.old_day      || d.day || '';
      const oldTime= d.old_slot_label || d.slot_label || '';
      rejectTitle = `Reschedule request rejected`;
      rejectMsg   = `Your request to reschedule ${subj}${batch ? ' ('+batch+')' : ''}${oldDay ? ' from '+oldDay+' at '+oldTime : ''} was not approved.`
                  + ` Reason: ${review_note}`;
    } else if (request.request_type === 'create') {
      const subj  = d.subject_name || 'a new class';
      const batch = d.batch_name   || '';
      const day   = d.day          || '';
      const time  = d.slot_label   || '';
      rejectTitle = `Add class request rejected`;
      rejectMsg   = `Your request to add ${subj}${batch ? ' ('+batch+')' : ''}${day ? ' on '+day : ''}${time ? ' at '+time : ''} was not approved.`
                  + ` Reason: ${review_note}`;
    } else {
      const subj   = d.subject_name || 'a class';
      const detail = `${subj}${d.batch_name?' for '+d.batch_name:''}${d.day?' on '+d.day:''}`;
      rejectTitle  = 'Request rejected';
      rejectMsg    = `Your request (${detail}) was rejected. Reason: ${review_note}`;
    }

    await client.query('COMMIT');

    // Send notification AFTER commit so it's never rolled back
    console.log(`[approval] Sending rejected notif → requested_by=${request.requested_by}, type=request_rejected`);
    await sendNotification(pool, {
      userId:    request.requested_by,
      actorId:   req.user.id,
      type:      'request_rejected',
      title:     rejectTitle,
      message:   rejectMsg,
      requestId: parseInt(id),
    });

    res.json({ message: 'Request rejected.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('rejectRequest:', err);
    res.status(500).json({ message: 'Server error.' });
  } finally { client.release(); }
};

module.exports = { getAllRequests, getPendingRequests, approveRequest, rejectRequest };