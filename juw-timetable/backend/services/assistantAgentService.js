const pool = require('../config/db');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOTS = [
  { id: 1, label: '9:00 - 10:00' },
  { id: 2, label: '10:00 - 11:00' },
  { id: 3, label: '11:00 - 12:00' },
  { id: 4, label: '12:00 - 1:00' },
  { id: 5, label: '1:00 - 2:00' },
];
const LAB_SLOTS = {
  1: '9:00 - 12:00 (Lab)',
  2: '10:00 - 1:00 (Lab)',
  3: '11:00 - 2:00 (Lab)',
  4: '12:00 - 3:00 (Lab)',
  5: '1:00 - 4:00 (Lab)',
};

const ASSISTANT_AGENT_SYSTEM_PROMPT = `
You are the Admin/Office Assistant AI Agent for a University Timetable Management System.
Unlike the Teacher Agent, you act on behalf of Admin/Office staff and are permitted to directly
create, reschedule, and cancel timetable entries, assign or reassign teachers to classes, and
approve or reject pending teacher rescheduling requests — without needing further approval.
You always validate against the live database: teacher availability, room availability, batch
availability, lab overlap, working hours, duplicate lectures, and room capacity before applying
any change. You never fabricate timetable data and never silently skip a conflict check. If a
requested batch, room, teacher, or subject does not exist, say so clearly instead of guessing.
You can also produce workload and room-utilization reports across the whole institution, not
just for a single teacher.
`;

function slotLabel(slot, isLab = false) {
  return isLab ? LAB_SLOTS[slot] || `Slot ${slot} (Lab)` : (SLOTS.find(s => s.id === Number(slot))?.label || `Slot ${slot}`);
}

function normalizeText(value = '') {
  return String(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

function isGreeting(text) {
  return /^(hi|hello|hey|salam|assalam o alaikum|assalamu alaikum|good morning|good afternoon|good evening)\W*$/i.test(String(text || '').trim());
}

function formatEntry(row) {
  return {
    id: row.id,
    course: row.subject_name,
    batch: row.batch_name,
    teacher: row.teacher_name,
    classroom: row.room_code,
    day: row.day,
    time: row.slot_label || slotLabel(row.time_slot, row.is_lab),
    availabilityStatus: 'Scheduled',
    conflictStatus: 'None',
  };
}

function getDayFromText(text) {
  const lower = normalizeText(text);
  const direct = DAYS.find(day => lower.includes(day.toLowerCase()));
  if (direct) return direct;
  if (lower.includes('today')) {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Asia/Karachi' }).format(new Date());
  }
  if (lower.includes('tomorrow')) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Asia/Karachi' }).format(d);
  }
  return null;
}

function getSlotFromText(text) {
  const lower = normalizeText(text);
  const slotMatch = lower.match(/\bslot\s*([1-5])\b/);
  if (slotMatch) return Number(slotMatch[1]);
  const timeMap = [
    { re: /\b(9|09)(:00)?\b/, slot: 1 },
    { re: /\b10(:00)?\b/, slot: 2 },
    { re: /\b11(:00)?\b/, slot: 3 },
    { re: /\b12(:00)?\b/, slot: 4 },
    { re: /\b(1|01)(:00)?\s*(pm)?\b/, slot: 5 },
  ];
  return timeMap.find(t => t.re.test(lower))?.slot || null;
}

function isLabText(text) {
  return /\blab\b|laboratory|3\s*hour|three\s*hour/i.test(text);
}

function requestedRoomName(text) {
  const value = String(text || '');
  const roomMatch = value.match(/\b(room|lab|laboratory)\s+([a-z0-9\-()]+)/i);
  if (!roomMatch) return null;
  return `${roomMatch[1]} ${roomMatch[2]}`.trim();
}

function requestedBatchName(text) {
  const value = String(text || '');
  const batchMatch = value.match(/\b(BS[A-Z]{2,4}[-\s]?\d+[A-Z]?)\b/i);
  return batchMatch ? batchMatch[1].replace(/\s+/, '-').toUpperCase() : null;
}

function requestedTeacherName(text) {
  const match = String(text || '').match(/\b(?:teacher|instructor|sir|ma'?am|prof\.?|professor)\s+([a-z][a-z .]{1,60})/i);
  return match ? match[1].trim() : null;
}

function getRescheduleParts(text) {
  const match = String(text).match(/\b(?:to|into)\b/i);
  if (!match) return { sourceText: text, targetText: text };
  return {
    sourceText: text.slice(0, match.index),
    targetText: text.slice(match.index + match[0].length),
  };
}

function slotWindow(slot, isLab = false) {
  const start = Number(slot);
  return { start, end: start + (isLab ? 2 : 0) };
}

function overlaps(aSlot, aIsLab, bSlot, bIsLab) {
  const a = slotWindow(aSlot, aIsLab);
  const b = slotWindow(bSlot, bIsLab);
  return a.start <= b.end && b.start <= a.end;
}

function conflictMessage(type, row) {
  if (type === 'teacher') return `Teacher conflict: ${row.teacher_name} is already teaching ${row.subject_name} for ${row.batch_name} at ${row.slot_label}.`;
  if (type === 'room') return `Classroom conflict: ${row.room_code} is already booked for ${row.subject_name} (${row.batch_name}) at ${row.slot_label}.`;
  if (type === 'batch') return `Batch conflict: ${row.batch_name} already has ${row.subject_name} at ${row.slot_label}.`;
  if (type === 'capacity') return `Room capacity conflict: ${row.room_code} holds ${row.capacity} students but ${row.batch_name} has ${row.student_count}.`;
  return 'Conflict detected.';
}

const ENTRY_SELECT = `
  SELECT t.id, t.day, t.time_slot::int AS time_slot, t.is_lab, t.semester,
         CASE WHEN t.is_lab THEN
           CASE t.time_slot::int WHEN 1 THEN '9:00 - 12:00 (Lab)' WHEN 2 THEN '10:00 - 1:00 (Lab)'
             WHEN 3 THEN '11:00 - 2:00 (Lab)' WHEN 4 THEN '12:00 - 3:00 (Lab)'
             WHEN 5 THEN '1:00 - 4:00 (Lab)' ELSE t.slot_label END
         ELSE
           CASE t.time_slot::int WHEN 1 THEN '9:00 - 10:00' WHEN 2 THEN '10:00 - 11:00'
             WHEN 3 THEN '11:00 - 12:00' WHEN 4 THEN '12:00 - 1:00'
             WHEN 5 THEN '1:00 - 2:00' ELSE t.slot_label END
         END AS slot_label,
         b.id AS batch_id, b.batch_name, b.student_count,
         s.id AS subject_id, s.name AS subject_name, s.short_name, s.code,
         te.id AS teacher_id, te.full_name AS teacher_name,
         r.id AS room_id, r.room_id AS room_code, r.capacity
  FROM timetable t
  JOIN batches b ON t.batch_id = b.id
  JOIN subjects s ON t.subject_id = s.id
  LEFT JOIN teachers te ON t.teacher_id = te.id
  LEFT JOIN rooms r ON t.room_id = r.id
`;

const DAY_ORDER = `CASE t.day WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
  WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 END`;

async function getAllEntries(filters = {}) {
  const params = [];
  const clauses = [];
  if (filters.day) { params.push(filters.day); clauses.push(`t.day = $${params.length}`); }
  if (filters.batchId) { params.push(filters.batchId); clauses.push(`t.batch_id = $${params.length}`); }
  if (filters.teacherId) { params.push(filters.teacherId); clauses.push(`t.teacher_id = $${params.length}`); }
  if (filters.roomId) { params.push(filters.roomId); clauses.push(`t.room_id = $${params.length}`); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return (await pool.query(
    `${ENTRY_SELECT} ${where} ORDER BY ${DAY_ORDER}, t.time_slot::int`,
    params
  )).rows;
}

async function findRoom(text) {
  const rooms = (await pool.query('SELECT id, room_id, room_name, capacity, room_type, is_available FROM rooms ORDER BY room_id')).rows;
  const lower = normalizeText(text);
  return rooms.find(r =>
    lower.includes(normalizeText(r.room_id)) ||
    (r.room_name && lower.includes(normalizeText(r.room_name)))
  ) || null;
}

async function findBatch(text) {
  const batches = (await pool.query('SELECT id, batch_name, student_count FROM batches ORDER BY batch_name')).rows;
  const lower = normalizeText(text);
  return batches.find(b => lower.includes(normalizeText(b.batch_name))) || null;
}

async function findTeacher(text) {
  const teachers = (await pool.query('SELECT id, teacher_id, full_name FROM teachers ORDER BY full_name')).rows;
  const lower = normalizeText(text);
  const words = new Set(lower.split(' ').filter(w => w.length >= 3));

  // Prefer an exact full-name or teacher-id match first.
  const exact = teachers.find(t => lower.includes(normalizeText(t.teacher_id)) || lower.includes(normalizeText(t.full_name)));
  if (exact) return exact;

  // Fall back to matching on any individual name token (e.g. "miss tehreem" -> "Tehreem Zafar"),
  // but only when exactly one teacher matches, to avoid guessing between two similarly-named staff.
  const candidates = teachers.filter(t =>
    normalizeText(t.full_name).split(' ').some(part => part.length >= 3 && words.has(part))
  );
  return candidates.length === 1 ? candidates[0] : null;
}

async function findSubject(text) {
  const subjects = (await pool.query('SELECT id, name, short_name, code FROM subjects ORDER BY name')).rows;
  const lower = normalizeText(text);
  return subjects.find(s => [s.name, s.short_name, s.code].filter(Boolean).some(v => lower.includes(normalizeText(v)))) || null;
}

async function getSlotOccupants({ day, slot, isLab = false, teacherId, roomId, batchId, excludeId }) {
  const params = [day];
  let where = 'WHERE t.day = $1';
  if (excludeId) { params.push(excludeId); where += ` AND t.id <> $${params.length}`; }
  if (teacherId) { params.push(teacherId); where += ` AND t.teacher_id = $${params.length}`; }
  if (roomId) { params.push(roomId); where += ` AND t.room_id = $${params.length}`; }
  if (batchId) { params.push(batchId); where += ` AND t.batch_id = $${params.length}`; }
  const rows = (await pool.query(`${ENTRY_SELECT} ${where}`, params)).rows;
  return rows.filter(row => overlaps(slot, isLab, row.time_slot, row.is_lab));
}

async function validateSlot({ teacherId, roomId, batchId, studentCount, day, slot, isLab, excludeId }) {
  const conflicts = [];
  if (!DAYS.includes(day)) conflicts.push({ type: 'working_hours', message: 'Requested day is outside university working days.' });
  if (!slot || slot < 1 || slot > 5) conflicts.push({ type: 'working_hours', message: 'Requested time slot is outside university working hours.' });
  if (isLab && slot > 3) conflicts.push({ type: 'working_hours', message: 'Lab sessions must start in slots 1, 2, or 3 to remain within working hours.' });
  if (conflicts.length) return conflicts;

  const checks = await Promise.all([
    teacherId ? getSlotOccupants({ day, slot, isLab, teacherId, excludeId }) : [],
    roomId ? getSlotOccupants({ day, slot, isLab, roomId, excludeId }) : [],
    batchId ? getSlotOccupants({ day, slot, isLab, batchId, excludeId }) : [],
  ]);
  checks[0].forEach(row => conflicts.push({ type: 'teacher', message: conflictMessage('teacher', row) }));
  checks[1].forEach(row => conflicts.push({ type: 'room', message: conflictMessage('room', row) }));
  checks[2].forEach(row => conflicts.push({ type: 'batch', message: conflictMessage('batch', row) }));

  if (roomId && studentCount != null) {
    const room = (await pool.query('SELECT room_id, capacity FROM rooms WHERE id = $1', [roomId])).rows[0];
    if (room && Number(studentCount) > Number(room.capacity)) {
      conflicts.push({ type: 'capacity', message: conflictMessage('capacity', { room_code: room.room_id, capacity: room.capacity, batch_name: '', student_count: studentCount }) });
    }
  }
  return conflicts;
}

async function scheduleClass({ userId, batch, subject, teacher, room, day, slot, isLab }) {
  const conflicts = await validateSlot({
    teacherId: teacher?.id, roomId: room?.id, batchId: batch.id,
    studentCount: batch.student_count, day, slot, isLab,
  });
  if (conflicts.length) return { conflicts, entry: null };

  const inserted = await pool.query(
    `INSERT INTO timetable (day, time_slot, is_lab, batch_id, subject_id, teacher_id, room_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [day, slot, !!isLab, batch.id, subject.id, teacher?.id || null, room?.id || null]
  );
  const [entry] = await getAllEntries({}).then(rows => rows.filter(r => r.id === inserted.rows[0].id));
  return { conflicts: [], entry };
}

async function rescheduleClass({ entry, day, slot, room }) {
  const conflicts = await validateSlot({
    teacherId: entry.teacher_id, roomId: room?.id || entry.room_id, batchId: entry.batch_id,
    studentCount: entry.student_count, day, slot, isLab: entry.is_lab, excludeId: entry.id,
  });
  if (conflicts.length) return { conflicts, entry: null };

  await pool.query(
    `UPDATE timetable SET day = $1, time_slot = $2, room_id = $3 WHERE id = $4`,
    [day, slot, room?.id || entry.room_id, entry.id]
  );
  const [updated] = await getAllEntries({}).then(rows => rows.filter(r => r.id === entry.id));
  return { conflicts: [], entry: updated };
}

async function cancelClass(entry) {
  await pool.query('DELETE FROM timetable WHERE id = $1', [entry.id]);
  return { cancelled: true, entry };
}

async function assignTeacher({ entry, teacher }) {
  const conflicts = await validateSlot({
    teacherId: teacher.id, roomId: entry.room_id, batchId: entry.batch_id,
    studentCount: entry.student_count, day: entry.day, slot: entry.time_slot,
    isLab: entry.is_lab, excludeId: entry.id,
  });
  if (conflicts.length) return { conflicts, entry: null };

  await pool.query('UPDATE timetable SET teacher_id = $1 WHERE id = $2', [teacher.id, entry.id]);
  const [updated] = await getAllEntries({}).then(rows => rows.filter(r => r.id === entry.id));
  return { conflicts: [], entry: updated };
}

async function getPendingRequests() {
  return (await pool.query(
    `SELECT ar.id, ar.status, ar.request_type, ar.entity_type, ar.request_data, ar.created_at,
            u.email AS requested_by_email
     FROM admin_requests ar
     LEFT JOIN users u ON ar.requested_by = u.id
     WHERE ar.status = 'pending'
     ORDER BY ar.created_at ASC LIMIT 50`
  )).rows;
}

async function approveRequest({ requestId, reviewerId, note }) {
  const req = (await pool.query('SELECT * FROM admin_requests WHERE id = $1', [requestId])).rows[0];
  if (!req) return { error: 'Request not found.' };
  const data = req.request_data;

  if (req.entity_type === 'timetable' && req.request_type === 'update') {
    const conflicts = await validateSlot({
      teacherId: data.teacher_id, roomId: data.room_id, batchId: data.batch_id,
      day: data.day, slot: data.time_slot, isLab: data.is_lab, excludeId: data.timetable_entry_id,
    });
    if (conflicts.length) {
      return { error: 'Cannot approve: the requested slot now has conflicts.', conflicts };
    }
    await pool.query(
      `UPDATE timetable SET day = $1, time_slot = $2, room_id = $3 WHERE id = $4`,
      [data.day, data.time_slot, data.room_id, data.timetable_entry_id]
    );
  }

  await pool.query(
    `UPDATE admin_requests SET status = 'approved', reviewed_at = NOW(), reviewed_by = $1, review_note = $2 WHERE id = $3`,
    [reviewerId, note || null, requestId]
  );
  return { approved: true, requestId };
}

async function rejectRequest({ requestId, reviewerId, note }) {
  const req = (await pool.query('SELECT id FROM admin_requests WHERE id = $1', [requestId])).rows[0];
  if (!req) return { error: 'Request not found.' };
  await pool.query(
    `UPDATE admin_requests SET status = 'rejected', reviewed_at = NOW(), reviewed_by = $1, review_note = $2 WHERE id = $3`,
    [reviewerId, note || null, requestId]
  );
  return { rejected: true, requestId };
}

async function findAlternatives(entry, limit = 5) {
  const alternatives = [];
  for (const day of DAYS) {
    for (const slot of SLOTS.map(s => s.id)) {
      if (entry.is_lab && slot > 3) continue;
      if (day === entry.day && Number(slot) === Number(entry.time_slot)) continue;
      const conflicts = await validateSlot({
        teacherId: entry.teacher_id, roomId: entry.room_id, batchId: entry.batch_id,
        studentCount: entry.student_count, day, slot, isLab: entry.is_lab, excludeId: entry.id,
      });
      if (!conflicts.length) {
        alternatives.push({
          course: entry.subject_name, batch: entry.batch_name, teacher: entry.teacher_name,
          classroom: entry.room_code, day, time: slotLabel(slot, entry.is_lab),
          availabilityStatus: 'Available', conflictStatus: 'None',
        });
      }
      if (alternatives.length >= limit) return alternatives;
    }
  }
  return alternatives;
}

async function findAvailableRoomsForEntry(entry, day = entry.day, slot = entry.time_slot, limit = 10) {
  const rooms = (await pool.query(
    `SELECT id, room_id, capacity, room_type, is_available FROM rooms
     WHERE is_available = TRUE AND capacity >= $1 ORDER BY capacity, room_id`,
    [entry.student_count || 0]
  )).rows;
  const available = [];
  for (const room of rooms) {
    const conflicts = await getSlotOccupants({ day, slot, isLab: entry.is_lab, roomId: room.id, excludeId: entry.id });
    if (!conflicts.length) {
      available.push({
        course: entry.subject_name, batch: entry.batch_name, teacher: entry.teacher_name,
        classroom: room.room_id, day, time: slotLabel(slot, entry.is_lab),
        availabilityStatus: 'Available', conflictStatus: 'None',
      });
    }
    if (available.length >= limit) return available;
  }
  return available;
}

async function getFreePeriods({ day, teacherId, batchId, roomId, isLab = false }) {
  const free = [];
  for (const slot of SLOTS.map(s => s.id)) {
    if (isLab && slot > 3) continue;
    const conflicts = await getSlotOccupants({ day, slot, isLab, teacherId, batchId, roomId });
    if (!conflicts.length) free.push({ day, time: slotLabel(slot, isLab), availabilityStatus: 'Available', conflictStatus: 'None' });
  }
  return free;
}

async function teacherWorkloadReport() {
  const rows = (await pool.query(
    `SELECT te.id, te.full_name, t.day, t.is_lab
     FROM timetable t JOIN teachers te ON t.teacher_id = te.id`
  )).rows;
  const byTeacher = new Map();
  for (const r of rows) {
    if (!byTeacher.has(r.id)) byTeacher.set(r.id, { teacher: r.full_name, lectures: 0, hours: 0, byDay: {} });
    const entry = byTeacher.get(r.id);
    entry.lectures += 1;
    entry.hours += r.is_lab ? 3 : 1;
    entry.byDay[r.day] = (entry.byDay[r.day] || 0) + (r.is_lab ? 3 : 1);
  }
  return [...byTeacher.values()].sort((a, b) => b.hours - a.hours);
}

async function roomUtilizationReport() {
  const rows = (await pool.query(
    `SELECT r.id, r.room_id, r.capacity, t.day, t.is_lab
     FROM timetable t JOIN rooms r ON t.room_id = r.id`
  )).rows;
  const totalSlotsPerWeek = DAYS.length * SLOTS.length;
  const byRoom = new Map();
  for (const r of rows) {
    if (!byRoom.has(r.id)) byRoom.set(r.id, { room: r.room_id, capacity: r.capacity, bookedHours: 0 });
    byRoom.get(r.id).bookedHours += r.is_lab ? 3 : 1;
  }
  return [...byRoom.values()].map(r => ({
    ...r,
    utilizationPercent: Math.round((r.bookedHours / totalSlotsPerWeek) * 100),
  })).sort((a, b) => b.utilizationPercent - a.utilizationPercent);
}

function inferEntry(entries, text) {
  const day = getDayFromText(text);
  const slot = getSlotFromText(text);
  const lower = normalizeText(text);
  let matches = entries;
  if (day) matches = matches.filter(e => e.day === day);
  if (slot) matches = matches.filter(e => overlaps(slot, isLabText(text), e.time_slot, e.is_lab));
  const courseMatches = matches.filter(e => lower.includes(normalizeText(e.subject_name)) || lower.includes(normalizeText(e.short_name || '')));
  if (courseMatches.length) matches = courseMatches;
  const batchMatches = matches.filter(e => lower.includes(normalizeText(e.batch_name)));
  if (batchMatches.length) matches = batchMatches;
  const teacherMatches = matches.filter(e => e.teacher_name && lower.includes(normalizeText(e.teacher_name)));
  if (teacherMatches.length) matches = teacherMatches;
  return matches.length === 1 ? matches[0] : (matches.length ? matches[0] : null);
}

function response({ intent, summary, rows = [], conflicts = [], alternatives = [], missing = [], request = null, report = null }) {
  return { agent: 'Assistant AI Agent', intent, summary, rows, conflicts, alternatives, missing, request, report };
}

async function handleAssistantAgentMessage({ user, message }) {
  const text = String(message || '').trim();
  if (!text) return response({ intent: 'missing_message', summary: 'Please enter a scheduling or admin request.', missing: ['message'] });

  if (isGreeting(text)) {
    return response({ intent: 'greeting', summary: 'Hello! I can schedule, reschedule, or cancel classes, assign teachers, check availability and conflicts, review pending requests, or run workload/utilization reports. How can I help?' });
  }

  const lower = normalizeText(text);
  const day = getDayFromText(text);
  const slot = getSlotFromText(text);

  // ---- View intent guard ----
  // Question-style phrasing ("what is the schedule of...", "show me...", "which classes...")
  // must always resolve to a lookup, never to a create/modify action, even when it contains
  // words like "schedule" that also appear in action triggers further down.
  const isQuestionPhrasing = /^(what|who|which|show|tell|give|find|list|display|is|does|do)\b/.test(lower)
    || /\b(schedule|timetable|classes)\s+(of|for)\b/.test(lower);

  if (isQuestionPhrasing && /\bschedule|timetable|classes\b/.test(lower)) {
    const teacherForView = await findTeacher(text);
    if (teacherForView) {
      const entries = await getAllEntries({ teacherId: teacherForView.id });
      return response({ intent: 'view_teacher_schedule', summary: `Here is the schedule for ${teacherForView.full_name}.`, rows: entries.map(formatEntry) });
    }
    const batchForView = await findBatch(text);
    if (batchForView) {
      const entries = await getAllEntries({ batchId: batchForView.id });
      return response({ intent: 'view_batch_schedule', summary: `Here is the schedule for ${batchForView.batch_name}.`, rows: entries.map(formatEntry) });
    }
    const roomForView = await findRoom(text);
    if (roomForView) {
      const entries = await getAllEntries({ roomId: roomForView.id });
      return response({ intent: 'view_room_schedule', summary: `Here is the schedule for ${roomForView.room_id}.`, rows: entries.map(formatEntry) });
    }
  }

  // ---- Pending requests: view / approve / reject ----
  if (/\bpending\b.*\brequest|requests?\b.*\bpending\b/.test(lower)) {
    const rows = await getPendingRequests();
    return response({
      intent: 'view_pending_requests',
      summary: rows.length ? `There are ${rows.length} pending request(s) awaiting review.` : 'No pending requests were found.',
      rows: rows.map(r => ({ id: r.id, type: r.request_type, entity: r.entity_type, requestedBy: r.requested_by_email, data: r.request_data, createdAt: r.created_at })),
    });
  }

  if (/\bapprove\b/.test(lower)) {
    const idMatch = lower.match(/\b(?:request\s*#?)(\d+)\b/);
    if (!idMatch) {
      return response({ intent: 'approve_request', summary: 'Please specify the request ID to approve, e.g. "approve request 12".', missing: ['request_id'] });
    }
    const result = await approveRequest({ requestId: Number(idMatch[1]), reviewerId: user.id, note: null });
    if (result.error) return response({ intent: 'approve_request', summary: result.error, conflicts: result.conflicts || [] });
    return response({ intent: 'approve_request', summary: `Request #${idMatch[1]} was approved and applied to the timetable.` });
  }

  if (/\breject\b|\bdecline\b/.test(lower)) {
    const idMatch = lower.match(/\b(?:request\s*#?)(\d+)\b/);
    if (!idMatch) {
      return response({ intent: 'reject_request', summary: 'Please specify the request ID to reject, e.g. "reject request 12".', missing: ['request_id'] });
    }
    const result = await rejectRequest({ requestId: Number(idMatch[1]), reviewerId: user.id, note: null });
    if (result.error) return response({ intent: 'reject_request', summary: result.error });
    return response({ intent: 'reject_request', summary: `Request #${idMatch[1]} was rejected.` });
  }

  // ---- Reports ----
  if (/\bworkload\b/.test(lower) && /\ball\b|\bteachers\b|\bfaculty\b/.test(lower)) {
    const report = await teacherWorkloadReport();
    return response({ intent: 'teacher_workload_report', summary: 'Here is the teaching workload across all teachers.', report });
  }

  if (/\butiliz|\broom usage|\bhow (busy|full) (is|are) (the )?rooms?\b/.test(lower)) {
    const report = await roomUtilizationReport();
    return response({ intent: 'room_utilization_report', summary: 'Here is room utilization across the week.', report });
  }

  // ---- Cancel a class ----
  if (!isQuestionPhrasing && /\bcancel\b|\bremove\b|\bdelete\b/.test(lower) && /\bclass|lecture|session\b/.test(lower)) {
    const entries = await getAllEntries({ day });
    const entry = inferEntry(entries, text);
    if (!entry) {
      return response({ intent: 'cancel_class', summary: 'I could not identify a unique class to cancel. Please include the course, batch, day, and time.', missing: ['course/batch', 'day', 'time'] });
    }
    await cancelClass(entry);
    return response({ intent: 'cancel_class', summary: `Cancelled ${entry.subject_name} for ${entry.batch_name} on ${entry.day} at ${entry.slot_label}.`, rows: [formatEntry(entry)] });
  }

  // ---- Assign / reassign a teacher ----
  if (!isQuestionPhrasing && (/\bassign\b.*\bteacher\b/.test(lower) || /\breassign\b/.test(lower))) {
    const entries = await getAllEntries({ day });
    const entry = inferEntry(entries, text);
    const teacherName = requestedTeacherName(text);
    const teacher = await findTeacher(text);
    if (!entry) {
      return response({ intent: 'assign_teacher', summary: 'Please specify which class (course, batch, day, time) needs a teacher assigned.', missing: ['course/batch', 'day', 'time'] });
    }
    if (teacherName && !teacher) {
      return response({ intent: 'assign_teacher', summary: `${teacherName} was not found in the teacher database.`, conflicts: [{ type: 'teacher_not_found', message: `${teacherName} does not exist in the teachers table.` }] });
    }
    if (!teacher) {
      return response({ intent: 'assign_teacher', summary: 'Please specify which teacher to assign, e.g. "assign teacher Ali Raza to the DLD class".', missing: ['teacher'] });
    }
    const result = await assignTeacher({ entry, teacher });
    if (result.conflicts.length) {
      return response({ intent: 'assign_teacher', summary: `Cannot assign ${teacher.full_name}: conflicts were found.`, conflicts: result.conflicts });
    }
    return response({ intent: 'assign_teacher', summary: `${teacher.full_name} was assigned to ${entry.subject_name} (${entry.batch_name}) on ${entry.day} at ${entry.slot_label}.`, rows: [formatEntry(result.entry)] });
  }

  // ---- Schedule a brand-new class ----
  const looksLikeCreateCommand = /\b(schedule|add|create|book)\b.{0,25}\b(class|lecture|session)\b/.test(lower)
    || /\b(class|lecture|session)\b.{0,25}\b(schedule|add|create|book)\b/.test(lower);
  if (looksLikeCreateCommand && !isQuestionPhrasing) {
    const batch = await findBatch(text);
    const subject = await findSubject(text);
    const teacher = await findTeacher(text);
    const room = await findRoom(text);
    const missing = [];
    if (!batch) missing.push('batch');
    if (!subject) missing.push('course/subject');
    if (!day) missing.push('day');
    if (!slot) missing.push('time slot');
    if (missing.length) {
      return response({ intent: 'schedule_class', summary: `Please provide the missing details to schedule this class: ${missing.join(', ')}.`, missing });
    }
    const result = await scheduleClass({
      userId: user.id, batch, subject, teacher, room, day, slot, isLab: isLabText(text),
    });
    if (result.conflicts.length) {
      return response({ intent: 'schedule_class', summary: 'This class could not be scheduled because of conflicts.', conflicts: result.conflicts });
    }
    return response({ intent: 'schedule_class', summary: `Scheduled ${subject.name} for ${batch.batch_name} on ${day} at ${slotLabel(slot, isLabText(text))}.`, rows: [formatEntry(result.entry)] });
  }

  // ---- Reschedule an existing class (direct, no approval needed) ----
  if (!isQuestionPhrasing && /\breschedule\b|\bmove\b|\bshift\b|\bchange\b.*\b(time|day|room)\b/.test(lower) && /\bclass|lecture|session\b/.test(lower)) {
    const { sourceText, targetText } = getRescheduleParts(text);
    const entries = await getAllEntries({});
    const entry = inferEntry(entries, sourceText) || inferEntry(entries, text);
    if (!entry) {
      return response({ intent: 'reschedule_class', summary: 'I could not identify a unique class to reschedule. Please include the course, batch, current day, and time.', missing: ['course/batch', 'current day', 'current time'] });
    }
    const targetDay = getDayFromText(targetText) || day;
    const targetSlot = getSlotFromText(targetText) || slot;
    const targetRoom = await findRoom(targetText);
    if (!targetDay || !targetSlot) {
      return response({ intent: 'reschedule_class', summary: 'Please specify the new day and time slot for this class.', missing: ['target day', 'target time'] });
    }
    const result = await rescheduleClass({ entry, day: targetDay, slot: targetSlot, room: targetRoom });
    if (result.conflicts.length) {
      return response({ intent: 'reschedule_class', summary: 'This class could not be rescheduled because of conflicts.', conflicts: result.conflicts });
    }
    return response({
      intent: 'reschedule_class',
      summary: `Moved ${entry.subject_name} (${entry.batch_name}) from ${entry.day} ${entry.slot_label} to ${targetDay} ${slotLabel(targetSlot, entry.is_lab)}.`,
      rows: [formatEntry(result.entry)],
    });
  }

  // ---- Availability / conflict checks and finders ----
  if (/\bavailable slots|free slots|find slots|time slots\b/.test(lower)) {
    const batch = await findBatch(text);
    const teacher = await findTeacher(text);
    if (batch) {
      const rows = [];
      for (const d of DAYS) rows.push(...await getFreePeriods({ day: d, batchId: batch.id }));
      return response({ intent: 'find_available_slots', summary: rows.length ? `Here are free slots for ${batch.batch_name}.` : `No free slots found for ${batch.batch_name}.`, rows: rows.map(r => ({ ...r, batch: batch.batch_name })) });
    }
    if (teacher) {
      const rows = [];
      for (const d of DAYS) rows.push(...await getFreePeriods({ day: d, teacherId: teacher.id }));
      return response({ intent: 'find_available_slots', summary: rows.length ? `Here are free slots for ${teacher.full_name}.` : `No free slots found for ${teacher.full_name}.`, rows: rows.map(r => ({ ...r, teacher: teacher.full_name })) });
    }
    return response({ intent: 'find_available_slots', summary: 'Please specify a batch or teacher to find free slots for.', missing: ['batch or teacher'] });
  }

  if (/\bavailable classroom|available classrooms|free rooms|available rooms|find rooms\b/.test(lower)) {
    const entries = await getAllEntries({ day });
    const entry = inferEntry(entries, text);
    if (!day || !slot) {
      return response({ intent: 'find_available_rooms', summary: 'Please provide a day and time (or reference an existing class) to find available rooms.', missing: ['day', 'time'] });
    }
    const rooms = (await pool.query('SELECT id, room_id, capacity, room_type, is_available FROM rooms ORDER BY room_id')).rows;
    const rows = [];
    for (const r of rooms) {
      if (!r.is_available) continue;
      const c = await getSlotOccupants({ day, slot, isLab: isLabText(text), roomId: r.id, excludeId: entry?.id });
      if (!c.length) rows.push({ classroom: r.room_id, day, time: slotLabel(slot, isLabText(text)), availabilityStatus: 'Available', conflictStatus: 'None' });
    }
    return response({ intent: 'find_available_rooms', summary: rows.length ? 'Here are the available classrooms for the requested slot.' : 'No free classrooms were found for the requested slot.', rows });
  }

  if (/\bconflict|alternative\b/.test(lower)) {
    const entries = await getAllEntries({ day });
    const entry = inferEntry(entries, text) || entries[0];
    if (!entry) return response({ intent: 'conflict_check', summary: 'No scheduled class was found to check conflicts against.' });
    const alternatives = await findAlternatives(entry, 10);
    return response({ intent: 'conflict_check', summary: alternatives.length ? 'Here are conflict-free alternatives.' : 'No conflict-free alternatives were found.', alternatives });
  }

  if (/\b(available|availability|free)\b/.test(lower)) {
    if (!day || !slot) {
      return response({ intent: 'availability_check', summary: 'Please provide both day and time slot so I can check live availability.', missing: ['day', 'time slot'] });
    }
    const room = await findRoom(text);
    const batch = await findBatch(text);
    const teacher = await findTeacher(text);
    const rows = [];
    const conflicts = [];

    const requestedRoom = requestedRoomName(text);
    if (requestedRoom && !room) {
      return response({ intent: 'availability_check', summary: `${requestedRoom} was not found in the room database.`, conflicts: [{ type: 'room_not_found', message: `${requestedRoom} does not exist in the rooms table.` }] });
    }
    const requestedBatch = requestedBatchName(text);
    if (requestedBatch && !batch) {
      return response({ intent: 'availability_check', summary: `${requestedBatch} was not found in the batch database.`, conflicts: [{ type: 'batch_not_found', message: `${requestedBatch} does not exist in the batches table.` }] });
    }

    if (room) {
      const roomConflicts = await getSlotOccupants({ day, slot, isLab: isLabText(text), roomId: room.id });
      conflicts.push(...roomConflicts.map(r => ({ type: 'room', message: conflictMessage('room', r) })));
      rows.push({ classroom: room.room_id, day, time: slotLabel(slot, isLabText(text)), availabilityStatus: roomConflicts.length || !room.is_available ? 'Unavailable' : 'Available', conflictStatus: roomConflicts.length ? 'Conflict detected' : 'None' });
    }
    if (batch) {
      const batchConflicts = await getSlotOccupants({ day, slot, isLab: isLabText(text), batchId: batch.id });
      conflicts.push(...batchConflicts.map(r => ({ type: 'batch', message: conflictMessage('batch', r) })));
      rows.push({ batch: batch.batch_name, day, time: slotLabel(slot, isLabText(text)), availabilityStatus: batchConflicts.length ? 'Unavailable' : 'Available', conflictStatus: batchConflicts.length ? 'Conflict detected' : 'None' });
    }
    if (teacher) {
      const teacherConflicts = await getSlotOccupants({ day, slot, isLab: isLabText(text), teacherId: teacher.id });
      conflicts.push(...teacherConflicts.map(r => ({ type: 'teacher', message: conflictMessage('teacher', r) })));
      rows.push({ teacher: teacher.full_name, day, time: slotLabel(slot, isLabText(text)), availabilityStatus: teacherConflicts.length ? 'Unavailable' : 'Available', conflictStatus: teacherConflicts.length ? 'Conflict detected' : 'None' });
    }
    if (!room && !batch && !teacher) {
      return response({ intent: 'availability_check', summary: 'Please mention a room, batch, or teacher to check availability for.', missing: ['room/batch/teacher'] });
    }
    return response({ intent: 'availability_check', summary: conflicts.length ? 'Availability checked. Conflicts were found.' : 'Availability checked. No conflicts were found.', rows, conflicts });
  }

  // ---- View schedules ----
  if (/\btoday|tomorrow|weekly|week\b/.test(lower) || day) {
    const entries = await getAllEntries({ day: day || undefined });
    return response({
      intent: day ? 'view_day' : 'view_weekly',
      summary: entries.length ? `Here is the timetable${day ? ` for ${day}` : ' for the week'}.` : 'No scheduled entries were found.',
      rows: entries.map(formatEntry),
    });
  }

  const teacherLookup = await findTeacher(text);
  if (teacherLookup && /\bschedule|timetable|classes\b/.test(lower)) {
    const entries = await getAllEntries({ teacherId: teacherLookup.id });
    return response({ intent: 'view_teacher_schedule', summary: `Here is the schedule for ${teacherLookup.full_name}.`, rows: entries.map(formatEntry) });
  }

  const batchLookup = await findBatch(text);
  if (batchLookup && /\bschedule|timetable|classes\b/.test(lower)) {
    const entries = await getAllEntries({ batchId: batchLookup.id });
    return response({ intent: 'view_batch_schedule', summary: `Here is the schedule for ${batchLookup.batch_name}.`, rows: entries.map(formatEntry) });
  }

  return response({
    intent: 'help',
    summary: 'I can schedule new classes, reschedule or cancel existing ones, assign teachers, check availability and conflicts, find free rooms/slots, review and approve/reject pending requests, and run teacher workload or room utilization reports.',
  });
}

module.exports = {
  ASSISTANT_AGENT_SYSTEM_PROMPT,
  handleAssistantAgentMessage,
};