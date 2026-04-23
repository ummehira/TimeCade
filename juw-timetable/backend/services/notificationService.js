// backend/services/notificationService.js
const pool = require('../config/db');

/**
 * Send a notification to one or more users
 */
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

/**
 * Notify all teachers + students affected by a timetable entry change
 * action: 'added' | 'updated' | 'removed' | 'rescheduled'
 */
async function notifyTimetableChange({ actor_id, entry, action }) {
  try {
    const { batch_id, teacher_id, subject_name, day, slot_label, room_code } = entry;
    const subj  = subject_name || 'a class';
    const time  = slot_label   || '';
    const room  = room_code    ? ` in ${room_code}` : '';

    const titles = {
      added:       `New class scheduled: ${subj}`,
      updated:     `Class updated: ${subj}`,
      removed:     `Class removed: ${subj}`,
      rescheduled: `Class rescheduled: ${subj}`,
    };
    const messages = {
      added:       `${subj} has been added on ${day} at ${time}${room}.`,
      updated:     `${subj} on ${day} has been updated (${time}${room}).`,
      removed:     `${subj} scheduled on ${day} at ${time} has been removed from the timetable.`,
      rescheduled: `${subj} has been rescheduled to ${day} at ${time}${room}.`,
    };

    const title   = titles[action]   || `Timetable updated: ${subj}`;
    const message = messages[action] || `Timetable change for ${subj}.`;

    const userIds = [];

    // Notify the teacher
    if (teacher_id) {
      const tRes = await pool.query(
        'SELECT user_id FROM teachers WHERE id=$1', [teacher_id]
      );
      if (tRes.rows[0]?.user_id) userIds.push(tRes.rows[0].user_id);
    }

    // Notify all students in the batch
    if (batch_id) {
      const sRes = await pool.query(
        'SELECT user_id FROM students WHERE batch_id=$1 AND user_id IS NOT NULL', [batch_id]
      );
      sRes.rows.forEach(r => { if (r.user_id) userIds.push(r.user_id); });
    }

    // Remove actor from recipients (don't notify yourself)
    const recipients = [...new Set(userIds)].filter(id => id !== actor_id);
    await sendNotification({ user_ids: recipients, actor_id, type: `timetable_${action}`, title, message });

    console.log(`[notify] ${action} → ${recipients.length} recipients`);
  } catch (err) {
    console.error('notifyTimetableChange error:', err.message);
  }
}

module.exports = { sendNotification, notifyTimetableChange };