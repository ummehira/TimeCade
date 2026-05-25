// backend/services/notificationService.js
const pool = require('../config/db');

async function sendNotification({ user_id, user_ids, actor_id, type, title, message }) {
  const ids = user_ids || (user_id ? [user_id] : []);
  if (!ids.length) return;
  for (const uid of ids) {
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, actor_id, type, title, message)
         VALUES ($1, $2, $3, $4, $5)`,
        [uid, actor_id || null, type, title, message]
      );
    } catch (err) {
      console.error('sendNotification error:', err.message);
    }
  }
}

async function notifyTimetableChange({ actor_id, entry, action }) {
  try {
    let { batch_id, teacher_id, subject_id, subject_name, day, slot_label, room_code } = entry;

    // Always resolve subject name from DB — don't trust passed-in value
    if (subject_id && (!subject_name || /^\d+$/.test(String(subject_name)))) {
      try {
        const sr = await pool.query('SELECT name FROM subjects WHERE id=$1', [subject_id]);
        subject_name = sr.rows[0]?.name || subject_name;
      } catch(_) {}
    }

    // Resolve batch name for richer messages
    let batch_name = '';
    if (batch_id) {
      try {
        const br = await pool.query('SELECT batch_name FROM batches WHERE id=$1', [batch_id]);
        batch_name = br.rows[0]?.batch_name || '';
      } catch(_) {}
    }

    const subj = subject_name && !/^\d+$/.test(String(subject_name)) ? subject_name : 'a class';
    const time = slot_label || '';
    const room = room_code  ? ` in ${room_code}` : '';
    const batch = batch_name ? ` (${batch_name})` : '';

    const titles = {
      added:       `New class: ${subj}`,
      updated:     `Class updated: ${subj}`,
      removed:     `Class removed: ${subj}`,
      rescheduled: `Class rescheduled: ${subj}`,
    };
    const messages = {
      added:       `${subj}${batch} has been added on ${day} at ${time}${room}.`,
      updated:     `${subj}${batch} on ${day} has been updated (${time}${room}).`,
      removed:     `${subj}${batch} scheduled on ${day} at ${time} has been removed.`,
      rescheduled: `${subj}${batch} has been rescheduled to ${day} at ${time}${room}.`,
    };

    const title   = titles[action]   || `Timetable updated: ${subj}`;
    const message = messages[action] || `Timetable change for ${subj}.`;

    const userIds = [];

    // Notify the teacher
    if (teacher_id) {
      const tRes = await pool.query('SELECT user_id FROM teachers WHERE id=$1', [teacher_id]);
      if (tRes.rows[0]?.user_id) userIds.push(tRes.rows[0].user_id);
    }

    // Notify all students in the batch
    if (batch_id) {
      const sRes = await pool.query(
        'SELECT user_id FROM students WHERE batch_id=$1 AND user_id IS NOT NULL', [batch_id]
      );
      sRes.rows.forEach(r => { if (r.user_id) userIds.push(r.user_id); });
    }

    const recipients = [...new Set(userIds)].filter(id => id !== actor_id);
    await sendNotification({ user_ids: recipients, actor_id, type: `timetable_${action}`, title, message });
    console.log(`[notify] ${action} (${subj}) → ${recipients.length} recipients`);
  } catch (err) {
    console.error('notifyTimetableChange error:', err.message);
  }
}

module.exports = { sendNotification, notifyTimetableChange };