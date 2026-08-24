const pool = require('../config/db');
const lookupTableService = require('./lookupTableService');
const { askAssistantAgentQwen } = require('./assistantAgentQwenService');

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

// These four now delegate to the cached, fuzzy-matching lookup table instead
// of re-querying the DB and doing plain substring checks on every call. The
// signature and return shape (a raw DB row, or null) are unchanged, so every
// caller below keeps working as-is. When a match is ambiguous or not found,
// `lastMatchInfo` on each function holds the detail (candidates, etc.) in
// case a caller wants to surface a clarifying question instead of just null.
findRoom.lastMatchInfo = null;
findBatch.lastMatchInfo = null;
findTeacher.lastMatchInfo = null;
findSubject.lastMatchInfo = null;

function logMatch(kind, text, result) {
  if (!process.env.DEBUG_ASSISTANT_AGENT) return;
  console.log(`[assistant-agent] ${kind} lookup for "${text}":`, result.matched
    ? `matched -> ${result.canonical} (id ${result.id})`
    : result.ambiguous
    ? `ambiguous -> candidates: ${JSON.stringify(result.candidates)}`
    : 'no match');
}

async function findRoom(text) {
  const result = lookupTableService.matchRoom(text);
  findRoom.lastMatchInfo = result;
  logMatch('room', text, result);
  return result.matched ? result.row : null;
}

async function findBatch(text) {
  const result = lookupTableService.matchBatch(text);
  findBatch.lastMatchInfo = result;
  logMatch('batch', text, result);
  return result.matched ? result.row : null;
}

async function findTeacher(text) {
  const result = lookupTableService.matchTeacher(text);
  findTeacher.lastMatchInfo = result;
  logMatch('teacher', text, result);
  return result.matched ? result.row : null;
}

async function findSubject(text) {
  const result = lookupTableService.matchSubject(text);
  findSubject.lastMatchInfo = result;
  logMatch('subject', text, result);
  return result.matched ? result.row : null;
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
  if (slot) matches = matches.filter(e => overlaps(slot, false, e.time_slot, e.is_lab));
  const courseMatches = matches.filter(e => lower.includes(normalizeText(e.subject_name)) || lower.includes(normalizeText(e.short_name || '')));
  if (courseMatches.length) matches = courseMatches;
  const batchMatches = matches.filter(e => lower.includes(normalizeText(e.batch_name)));
  if (batchMatches.length) matches = batchMatches;
  const teacherMatches = matches.filter(e => e.teacher_name && lower.includes(normalizeText(e.teacher_name)));
  if (teacherMatches.length) matches = teacherMatches;
  return matches.length === 1 ? matches[0] : (matches.length ? matches[0] : null);
}

async function resolveEntry({ course, batch, teacher, room, day, slot, isLab, rawText }) {
  const filters = {};
  if (day) filters.day = day;
  const batchRow = batch ? await findBatch(batch) : null;
  const teacherRow = teacher ? await findTeacher(teacher) : null;
  const roomRow = room ? await findRoom(room) : null;
  if (batchRow) filters.batchId = batchRow.id;
  if (teacherRow) filters.teacherId = teacherRow.id;
  if (roomRow) filters.roomId = roomRow.id;

  let entries = await getAllEntries(filters);
  if (slot) entries = entries.filter(e => overlaps(slot, isLab, e.time_slot, e.is_lab));
  if (course) {
    const subjectRow = await findSubject(course);
    if (subjectRow) entries = entries.filter(e => e.subject_id === subjectRow.id);
  }
  if (entries.length === 1) return entries[0];
  // Still ambiguous (or nothing narrowed at all) — fall back to scanning the
  // raw message against whatever candidates we have, same heuristic the old
  // router used for free-text disambiguation.
  return inferEntry(entries.length ? entries : await getAllEntries({}), rawText);
}

const FINDERS = { teacher: findTeacher, batch: findBatch, room: findRoom, subject: findSubject };

function notFound(kind, label) {
  // If the lookup didn't fail outright but was ambiguous (e.g. "Hira" matches
  // two teachers), guide the user to the actual candidates instead of wrongly
  // reporting that the name doesn't exist.
  const info = FINDERS[kind] && FINDERS[kind].lastMatchInfo;
  if (info && info.ambiguous && info.candidates && info.candidates.length) {
    const list = info.candidates.join(', ');
    return response({
      intent: `${kind}_ambiguous`,
      summary: `More than one ${kind} matches "${label}". Did you mean: ${list}? Please be more specific.`,
      missing: [kind],
    });
  }
  return response({
    intent: `${kind}_not_found`,
    summary: `${label} was not found in the ${kind} database.`,
    conflicts: [{ type: `${kind}_not_found`, message: `${label} does not exist.` }],
  });
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

  let parsed;
  try {
    parsed = await askAssistantAgentQwen(text);
  } catch (err) {
    console.error('Assistant Agent NLU error:', err);
    return response({ intent: 'nlu_error', summary: 'The AI classification service is temporarily unavailable. Please try again in a moment.' });
  }

  const day = parsed.day ? getDayFromText(parsed.day) : null;
  const targetDay = parsed.target_day ? getDayFromText(parsed.target_day) : null;
  const slot = parsed.time_slot || (parsed.time_text ? getSlotFromText(parsed.time_text) : null);
  const targetSlot = parsed.target_time_slot || null;
  const isLab = !!parsed.is_lab;

  if (process.env.DEBUG_ASSISTANT_AGENT) {
    console.log('[assistant-agent] message:', text);
    console.log('[assistant-agent] parsed from LLM:', JSON.stringify(parsed));
    console.log('[assistant-agent] resolved day/slot:', { day, targetDay, slot, targetSlot, isLab });
  }

  switch (parsed.intent) {
    case 'greeting':
      return response({ intent: 'greeting', summary: 'Hello! How can I help with the timetable today?' });

    case 'view_teacher_schedule': {
      const teacher = await findTeacher(parsed.teacher || text);
      if (!teacher) return notFound('teacher', parsed.teacher || 'The requested teacher');
      const entries = await getAllEntries({ teacherId: teacher.id, day: day || undefined });
      return response({
        intent: 'view_teacher_schedule',
        summary: entries.length ? `Here is the schedule for ${teacher.full_name}${day ? ` on ${day}` : ''}.` : `No scheduled classes were found for ${teacher.full_name}${day ? ` on ${day}` : ''}.`,
        rows: entries.map(formatEntry),
      });
    }

    case 'view_batch_schedule': {
      const batch = await findBatch(parsed.batch || text);
      if (!batch) return notFound('batch', parsed.batch || 'The requested batch');
      const entries = await getAllEntries({ batchId: batch.id, day: day || undefined });
      return response({
        intent: 'view_batch_schedule',
        summary: entries.length ? `Here is the schedule for ${batch.batch_name}${day ? ` on ${day}` : ''}.` : `No scheduled classes were found for ${batch.batch_name}${day ? ` on ${day}` : ''}.`,
        rows: entries.map(formatEntry),
      });
    }

    case 'view_room_schedule': {
      const room = await findRoom(parsed.room || text);
      if (!room) return notFound('room', parsed.room || 'The requested room');
      const entries = await getAllEntries({ roomId: room.id, day: day || undefined });
      return response({
        intent: 'view_room_schedule',
        summary: entries.length ? `Here is the schedule for ${room.room_id}${day ? ` on ${day}` : ''}.` : `No scheduled classes were found for ${room.room_id}${day ? ` on ${day}` : ''}.`,
        rows: entries.map(formatEntry),
      });
    }

    case 'view_day':
    case 'view_weekly': {
      const entries = await getAllEntries({ day: day || undefined });
      return response({
        intent: day ? 'view_day' : 'view_weekly',
        summary: entries.length ? `Here is the timetable${day ? ` for ${day}` : ' for the week'}.` : 'No scheduled entries were found.',
        rows: entries.map(formatEntry),
      });
    }

    case 'view_pending_requests': {
      const rows = await getPendingRequests();
      return response({
        intent: 'view_pending_requests',
        summary: rows.length ? `There are ${rows.length} pending request(s) awaiting review.` : 'No pending requests were found.',
        rows: rows.map(r => ({ id: r.id, type: r.request_type, entity: r.entity_type, requestedBy: r.requested_by_email, data: r.request_data, createdAt: r.created_at })),
      });
    }

    case 'approve_request': {
      const requestId = parsed.request_id || Number((text.match(/\b(?:request\s*#?)(\d+)\b/i) || [])[1]);
      if (!requestId) return response({ intent: 'approve_request', summary: 'Please specify the request ID to approve, e.g. "approve request 12".', missing: ['request_id'] });
      const result = await approveRequest({ requestId: Number(requestId), reviewerId: user.id, note: null });
      if (result.error) return response({ intent: 'approve_request', summary: result.error, conflicts: result.conflicts || [] });
      return response({ intent: 'approve_request', summary: `Request #${requestId} was approved and applied to the timetable.` });
    }

    case 'reject_request': {
      const requestId = parsed.request_id || Number((text.match(/\b(?:request\s*#?)(\d+)\b/i) || [])[1]);
      if (!requestId) return response({ intent: 'reject_request', summary: 'Please specify the request ID to reject, e.g. "reject request 12".', missing: ['request_id'] });
      const result = await rejectRequest({ requestId: Number(requestId), reviewerId: user.id, note: null });
      if (result.error) return response({ intent: 'reject_request', summary: result.error });
      return response({ intent: 'reject_request', summary: `Request #${requestId} was rejected.` });
    }

    case 'teacher_workload_report': {
      const report = await teacherWorkloadReport();
      return response({ intent: 'teacher_workload_report', summary: 'Here is the teaching workload across all teachers.', report });
    }

    case 'room_utilization_report': {
      const report = await roomUtilizationReport();
      return response({ intent: 'room_utilization_report', summary: 'Here is room utilization across the week.', report });
    }

    case 'cancel_class': {
      const entry = await resolveEntry({ course: parsed.course, batch: parsed.batch, teacher: parsed.teacher, room: parsed.room, day, slot, isLab, rawText: text });
      if (!entry) {
        return response({ intent: 'cancel_class', summary: 'I could not identify a unique class to cancel. Please include the course, batch, day, and time.', missing: ['course/batch', 'day', 'time'] });
      }
      await cancelClass(entry);
      return response({ intent: 'cancel_class', summary: `Cancelled ${entry.subject_name} for ${entry.batch_name} on ${entry.day} at ${entry.slot_label}.`, rows: [formatEntry(entry)] });
    }

    case 'assign_teacher': {
      const entry = await resolveEntry({ course: parsed.course, batch: parsed.batch, room: parsed.room, day, slot, isLab, rawText: text });
      if (!entry) {
        return response({ intent: 'assign_teacher', summary: 'Please specify which class (course, batch, day, time) needs a teacher assigned.', missing: ['course/batch', 'day', 'time'] });
      }
      const teacher = parsed.teacher ? await findTeacher(parsed.teacher) : null;
      if (parsed.teacher && !teacher) return notFound('teacher', parsed.teacher);
      if (!teacher) {
        return response({ intent: 'assign_teacher', summary: 'Please specify which teacher to assign, e.g. "assign teacher Ali Raza to the DLD class".', missing: ['teacher'] });
      }
      const result = await assignTeacher({ entry, teacher });
      if (result.conflicts.length) {
        return response({ intent: 'assign_teacher', summary: `Cannot assign ${teacher.full_name}: conflicts were found.`, conflicts: result.conflicts });
      }
      return response({ intent: 'assign_teacher', summary: `${teacher.full_name} was assigned to ${entry.subject_name} (${entry.batch_name}) on ${entry.day} at ${entry.slot_label}.`, rows: [formatEntry(result.entry)] });
    }

    case 'schedule_class': {
      const batch = parsed.batch ? await findBatch(parsed.batch) : null;
      const subject = parsed.course ? await findSubject(parsed.course) : null;
      const teacher = parsed.teacher ? await findTeacher(parsed.teacher) : null;
      const room = parsed.room ? await findRoom(parsed.room) : null;
      const missing = [];
      if (!batch) missing.push('batch');
      if (!subject) missing.push('course/subject');
      if (!day) missing.push('day');
      if (!slot) missing.push('time slot');
      if (missing.length) {
        return response({ intent: 'schedule_class', summary: `Please provide the missing details to schedule this class: ${missing.join(', ')}.`, missing });
      }
      const result = await scheduleClass({ userId: user.id, batch, subject, teacher, room, day, slot, isLab });
      if (result.conflicts.length) {
        return response({ intent: 'schedule_class', summary: 'This class could not be scheduled because of conflicts.', conflicts: result.conflicts });
      }
      return response({ intent: 'schedule_class', summary: `Scheduled ${subject.name} for ${batch.batch_name} on ${day} at ${slotLabel(slot, isLab)}.`, rows: [formatEntry(result.entry)] });
    }

    case 'reschedule_class': {
      const entry = await resolveEntry({ course: parsed.course, batch: parsed.batch, teacher: parsed.teacher, room: parsed.room, day, slot, isLab, rawText: text });
      if (!entry) {
        return response({ intent: 'reschedule_class', summary: 'I could not identify a unique class to reschedule. Please include the course, batch, current day, and time.', missing: ['course/batch', 'current day', 'current time'] });
      }
      const finalTargetDay = targetDay || day;
      const finalTargetSlot = targetSlot || slot;
      const targetRoom = parsed.target_room ? await findRoom(parsed.target_room) : null;
      if (!finalTargetDay || !finalTargetSlot) {
        return response({ intent: 'reschedule_class', summary: 'Please specify the new day and time slot for this class.', missing: ['target day', 'target time'] });
      }
      const result = await rescheduleClass({ entry, day: finalTargetDay, slot: finalTargetSlot, room: targetRoom });
      if (result.conflicts.length) {
        return response({ intent: 'reschedule_class', summary: 'This class could not be rescheduled because of conflicts.', conflicts: result.conflicts });
      }
      return response({
        intent: 'reschedule_class',
        summary: `Moved ${entry.subject_name} (${entry.batch_name}) from ${entry.day} ${entry.slot_label} to ${finalTargetDay} ${slotLabel(finalTargetSlot, entry.is_lab)}.`,
        rows: [formatEntry(result.entry)],
      });
    }

    case 'find_available_slots': {
      const batch = parsed.batch ? await findBatch(parsed.batch) : null;
      const teacher = parsed.teacher ? await findTeacher(parsed.teacher) : null;
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

    case 'find_available_rooms': {
      if (!day || !slot) {
        return response({ intent: 'find_available_rooms', summary: 'Please provide a day and time to find available rooms.', missing: ['day', 'time'] });
      }
      const rooms = (await pool.query('SELECT id, room_id, capacity, room_type, is_available FROM rooms ORDER BY room_id')).rows;
      const rows = [];
      for (const r of rooms) {
        if (!r.is_available) continue;
        const c = await getSlotOccupants({ day, slot, isLab, roomId: r.id });
        if (!c.length) rows.push({ classroom: r.room_id, day, time: slotLabel(slot, isLab), availabilityStatus: 'Available', conflictStatus: 'None' });
      }
      return response({ intent: 'find_available_rooms', summary: rows.length ? 'Here are the available classrooms for the requested slot.' : 'No free classrooms were found for the requested slot.', rows });
    }

    case 'conflict_check': {
      const entry = await resolveEntry({ course: parsed.course, batch: parsed.batch, teacher: parsed.teacher, room: parsed.room, day, slot, isLab, rawText: text });
      if (!entry) return response({ intent: 'conflict_check', summary: 'No scheduled class was found to check conflicts against.' });
      const alternatives = await findAlternatives(entry, 10);
      return response({ intent: 'conflict_check', summary: alternatives.length ? 'Here are conflict-free alternatives.' : 'No conflict-free alternatives were found.', alternatives });
    }

    case 'free_periods': {
      const teacher = parsed.teacher ? await findTeacher(parsed.teacher) : null;
      const batch = !teacher && parsed.batch ? await findBatch(parsed.batch) : null;
      const room = !teacher && !batch && parsed.room ? await findRoom(parsed.room) : null;
      const target = teacher
        ? { idFilter: { teacherId: teacher.id }, label: teacher.full_name }
        : batch
        ? { idFilter: { batchId: batch.id }, label: batch.batch_name }
        : room
        ? { idFilter: { roomId: room.id }, label: room.room_id }
        : null;
      // A named-but-unresolved entity means "not found" or "ambiguous", not
      // "you forgot to name one" — surface the right message via notFound.
      if (!target && parsed.teacher) return notFound('teacher', parsed.teacher);
      if (!target && parsed.batch) return notFound('batch', parsed.batch);
      if (!target && parsed.room) return notFound('room', parsed.room);
      if (!target) return response({ intent: 'free_periods', summary: 'Please mention a room, batch, or teacher to check free periods for.', missing: ['room/batch/teacher'] });
      if (!day) return response({ intent: 'free_periods', summary: 'Please specify a day to check free periods for.', missing: ['day'] });
      const rows = await getFreePeriods({ day, ...target.idFilter });
      return response({
        intent: 'free_periods',
        summary: rows.length ? `Here are the free periods for ${target.label} on ${day}.` : `No free periods were found for ${target.label} on ${day}.`,
        rows,
      });
    }

    case 'availability_check': {
      if (!day || !slot) {
        return response({ intent: 'availability_check', summary: 'Please provide both day and time slot so I can check live availability.', missing: ['day', 'time slot'] });
      }
      const room = parsed.room ? await findRoom(parsed.room) : null;
      const batch = parsed.batch ? await findBatch(parsed.batch) : null;
      const teacher = parsed.teacher ? await findTeacher(parsed.teacher) : null;

      if (parsed.room && !room) return notFound('room', parsed.room);
      if (parsed.batch && !batch) return notFound('batch', parsed.batch);
      if (parsed.teacher && !teacher) return notFound('teacher', parsed.teacher);
      if (!room && !batch && !teacher) {
        return response({ intent: 'availability_check', summary: 'Please mention a room, batch, or teacher to check availability for.', missing: ['room/batch/teacher'] });
      }

      const rows = [];
      const conflicts = [];
      if (room) {
        const roomConflicts = await getSlotOccupants({ day, slot, isLab, roomId: room.id });
        conflicts.push(...roomConflicts.map(r => ({ type: 'room', message: conflictMessage('room', r) })));
        rows.push({ classroom: room.room_id, day, time: slotLabel(slot, isLab), availabilityStatus: roomConflicts.length || !room.is_available ? 'Unavailable' : 'Available', conflictStatus: roomConflicts.length ? 'Conflict detected' : 'None' });
      }
      if (batch) {
        const batchConflicts = await getSlotOccupants({ day, slot, isLab, batchId: batch.id });
        conflicts.push(...batchConflicts.map(r => ({ type: 'batch', message: conflictMessage('batch', r) })));
        rows.push({ batch: batch.batch_name, day, time: slotLabel(slot, isLab), availabilityStatus: batchConflicts.length ? 'Unavailable' : 'Available', conflictStatus: batchConflicts.length ? 'Conflict detected' : 'None' });
      }
      if (teacher) {
        const teacherConflicts = await getSlotOccupants({ day, slot, isLab, teacherId: teacher.id });
        conflicts.push(...teacherConflicts.map(r => ({ type: 'teacher', message: conflictMessage('teacher', r) })));
        rows.push({ teacher: teacher.full_name, day, time: slotLabel(slot, isLab), availabilityStatus: teacherConflicts.length ? 'Unavailable' : 'Available', conflictStatus: teacherConflicts.length ? 'Conflict detected' : 'None' });
      }
      return response({ intent: 'availability_check', summary: conflicts.length ? 'Availability checked. Conflicts were found.' : 'Availability checked. No conflicts were found.', rows, conflicts });
    }

    case 'unclear':
      return response({ intent: 'unclear', summary: 'I did not fully understand that request. Could you rephrase it with the course, batch, day, and time involved?', missing: parsed.missing || [] });

    case 'out_of_scope':
      return response({ intent: 'out_of_scope', summary: "That's outside what I can help with — I only handle timetable scheduling, availability, and admin requests." });

    default:
      return response({
        intent: 'help',
        summary: 'I can schedule new classes, reschedule or cancel existing ones, assign teachers, check availability and conflicts, find free rooms/slots, review and approve/reject pending requests, and run teacher workload or room utilization reports.',
      });
  }
}

module.exports = {
  ASSISTANT_AGENT_SYSTEM_PROMPT,
  handleAssistantAgentMessage,
};