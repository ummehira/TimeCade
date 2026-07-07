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

const TEACHER_AGENT_SYSTEM_PROMPT = `
You are a Teacher AI Agent integrated with a University Timetable Management System.
If the teacher sends a greeting such as hello, hi, salam, or good morning, respond warmly and ask how you can help.
For timetable requests, understand natural language, use latest database records, enforce teacher-only permissions,
validate teacher, classroom, batch, time slot, working-hour, duplicate lecture, lab-overlap, and room-capacity conflicts.
Never fabricate timetable data. Never generate or permanently modify the university timetable. Never approve or reject
requests. Teachers may view their own timetable, check resource availability, find conflict-free alternatives, and submit
rescheduling requests for their own classes only. Rescheduling requests must be inserted for Admin/Office approval, not
applied directly to the timetable. If a requested batch, room, teacher, or course does not exist, say that clearly.
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

function getTimeRangeFromText(text) {
  const lower = normalizeText(text);
  const afterMatch = lower.match(/\bafter\s+(\d{1,2})(?::00)?\s*(am|pm)?\b/);
  const betweenMatch = lower.match(/\bbetween\s+(\d{1,2})(?::00)?\s*(am|pm)?\s+(?:and|to|-)\s+(\d{1,2})(?::00)?\s*(am|pm)?\b/);

  const toHour24 = (hour, meridian) => {
    let h = Number(hour);
    if (meridian === 'pm' && h !== 12) h += 12;
    if (meridian === 'am' && h === 12) h = 0;
    if (!meridian && h >= 1 && h <= 4) h += 12;
    return h;
  };

  const hourToSlot = (hour) => {
    if (hour === 9) return 1;
    if (hour === 10) return 2;
    if (hour === 11) return 3;
    if (hour === 12) return 4;
    if (hour === 13) return 5;
    return null;
  };

  if (betweenMatch) {
    const startHour = toHour24(betweenMatch[1], betweenMatch[2]);
    const endHour = toHour24(betweenMatch[3], betweenMatch[4] || betweenMatch[2]);
    const slots = SLOTS.map(s => s.id).filter(slot => {
      const slotStart = slot + 8;
      return slotStart >= startHour && slotStart < endHour;
    });
    return { type: 'between', startHour, endHour, slots };
  }

  if (afterMatch) {
    const startHour = toHour24(afterMatch[1], afterMatch[2]);
    const slots = SLOTS.map(s => s.id).filter(slot => (slot + 8) >= startHour);
    return { type: 'after', startHour, endHour: 14, slots };
  }

  return null;
}

function isOutsideWorkingHours(range) {
  if (!range) return false;
  return !range.slots.length;
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

function requestedCourseName(text) {
  const value = String(text || '');
  const courseMatch = value.match(/\b(?:my|the)?\s*([a-z][a-z0-9 &.-]{1,80}?)\s+(?:class|lecture|course)\b/i);
  if (!courseMatch) return null;
  return courseMatch[1]
    .replace(/\b(move|shift|change|reschedule|submit|find|available|classroom|room|to|from|for|my|the)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
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

async function getLoggedInTeacher(userId) {
  const r = await pool.query(
    `SELECT t.id, t.teacher_id, t.full_name, t.department_id, u.id AS user_id
     FROM teachers t
     JOIN users u ON t.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );
  return r.rows[0] || null;
}

async function getTeacherEntries(teacherId, filters = {}) {
  const params = [teacherId];
  let where = 'WHERE t.teacher_id = $1';
  if (filters.day) {
    params.push(filters.day);
    where += ` AND t.day = $${params.length}`;
  }
  return (await pool.query(
    `SELECT t.id, t.day, t.time_slot::int AS time_slot, t.is_lab, t.semester,
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
            s.id AS subject_id, s.name AS subject_name, s.short_name,
            te.id AS teacher_id, te.full_name AS teacher_name,
            r.id AS room_id, r.room_id AS room_code, r.capacity
     FROM timetable t
     JOIN batches b ON t.batch_id = b.id
     JOIN subjects s ON t.subject_id = s.id
     LEFT JOIN teachers te ON t.teacher_id = te.id
     LEFT JOIN rooms r ON t.room_id = r.id
     ${where}
     ORDER BY CASE t.day WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
       WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 END, t.time_slot::int`,
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

async function findTeacher(text, fallbackTeacher) {
  const lower = normalizeText(text);
  if (lower.includes('my ') || lower.includes('me ') || lower.includes('teacher availability')) return fallbackTeacher;
  const teachers = (await pool.query('SELECT id, teacher_id, full_name FROM teachers ORDER BY full_name')).rows;
  return teachers.find(t => lower.includes(normalizeText(t.teacher_id)) || lower.includes(normalizeText(t.full_name))) || fallbackTeacher;
}

async function findCourse(text, teacherId) {
  const courses = (await pool.query(
    `SELECT DISTINCT s.id, s.name, s.short_name, s.code
     FROM timetable t
     JOIN subjects s ON t.subject_id = s.id
     WHERE t.teacher_id = $1
     ORDER BY s.name`,
    [teacherId]
  )).rows;
  const lower = normalizeText(text);
  return courses.find(s => [s.name, s.short_name, s.code].filter(Boolean).some(v => lower.includes(normalizeText(v)))) || null;
}

async function findEntryByCourse(entries, text) {
  const course = await findCourse(text, entries[0]?.teacher_id);
  if (!course) return null;
  const matches = entries.filter(e => Number(e.subject_id) === Number(course.id));
  return matches.length === 1 ? matches[0] : matches[0] || null;
}

async function findTargetRoom(text) {
  const { targetText } = getRescheduleParts(text);
  return findRoom(targetText || text);
}

async function getSlotOccupants({ day, slot, isLab = false, teacherId, roomId, batchId, excludeId }) {
  const params = [day];
  let where = 'WHERE t.day = $1';
  if (excludeId) {
    params.push(excludeId);
    where += ` AND t.id <> $${params.length}`;
  }
  if (teacherId) {
    params.push(teacherId);
    where += ` AND t.teacher_id = $${params.length}`;
  }
  if (roomId) {
    params.push(roomId);
    where += ` AND t.room_id = $${params.length}`;
  }
  if (batchId) {
    params.push(batchId);
    where += ` AND t.batch_id = $${params.length}`;
  }
  const rows = (await pool.query(
    `SELECT t.id, t.day, t.time_slot::int AS time_slot, t.is_lab,
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
            s.id AS subject_id, s.name AS subject_name,
            te.id AS teacher_id, te.full_name AS teacher_name,
            r.id AS room_id, r.room_id AS room_code, r.capacity
     FROM timetable t
     JOIN batches b ON t.batch_id = b.id
     JOIN subjects s ON t.subject_id = s.id
     LEFT JOIN teachers te ON t.teacher_id = te.id
     LEFT JOIN rooms r ON t.room_id = r.id
     ${where}`,
    params
  )).rows;
  return rows.filter(row => overlaps(slot, isLab, row.time_slot, row.is_lab));
}

async function validateSlot({ entry, day, slot, roomId, excludeId }) {
  const isLab = !!entry.is_lab;
  const conflicts = [];
  if (!DAYS.includes(day)) conflicts.push({ type: 'working_hours', message: 'Requested day is outside university working days.' });
  if (!slot || slot < 1 || slot > 5) conflicts.push({ type: 'working_hours', message: 'Requested time slot is outside university working hours.' });
  if (isLab && slot > 3) conflicts.push({ type: 'working_hours', message: 'Lab sessions must start in slots 1, 2, or 3 to remain within working hours.' });
  if (conflicts.length) return conflicts;

  const checks = await Promise.all([
    getSlotOccupants({ day, slot, isLab, teacherId: entry.teacher_id, excludeId }),
    getSlotOccupants({ day, slot, isLab, roomId: roomId || entry.room_id, excludeId }),
    getSlotOccupants({ day, slot, isLab, batchId: entry.batch_id, excludeId }),
  ]);
  checks[0].forEach(row => conflicts.push({ type: 'teacher', message: conflictMessage('teacher', row) }));
  checks[1].forEach(row => conflicts.push({ type: 'room', message: conflictMessage('room', row) }));
  checks[2].forEach(row => conflicts.push({ type: 'batch', message: conflictMessage('batch', row) }));

  const room = (await pool.query(
    `SELECT r.room_id, r.capacity, b.batch_name, b.student_count
     FROM rooms r, batches b
     WHERE r.id = $1 AND b.id = $2`,
    [roomId || entry.room_id, entry.batch_id]
  )).rows[0];
  if (room && Number(room.student_count) > Number(room.capacity)) {
    conflicts.push({ type: 'capacity', message: conflictMessage('capacity', room) });
  }
  return conflicts;
}

async function submitTimetableUpdateRequest({ userId, entry, day, slot, room, reason }) {
  const requestData = {
    batch_id: entry.batch_id,
    batch_name: entry.batch_name,
    subject_id: entry.subject_id,
    subject_name: entry.subject_name,
    teacher_id: entry.teacher_id,
    teacher_name: entry.teacher_name,
    room_id: room?.id || entry.room_id,
    room_code: room?.room_id || entry.room_code,
    day,
    time_slot: slot,
    slot_label: slotLabel(slot, entry.is_lab),
    is_lab: entry.is_lab,
    timetable_entry_id: entry.id,
    old_day: entry.day,
    old_slot_label: slotLabel(entry.time_slot, entry.is_lab),
    old_batch_name: entry.batch_name,
    old_subject_name: entry.subject_name,
    old_teacher_name: entry.teacher_name,
    old_room_code: entry.room_code,
    teacher_reason: reason,
    submitted_by_agent: true,
  };
  const inserted = await pool.query(
    `INSERT INTO admin_requests (requested_by, request_type, entity_type, entity_id, request_data)
     VALUES ($1, 'update', 'timetable', $2, $3) RETURNING id, status`,
    [userId, entry.id, JSON.stringify(requestData)]
  );
  return { requestData, request: inserted.rows[0] };
}

async function findAlternatives(entry, limit = 5) {
  const alternatives = [];
  for (const day of DAYS) {
    for (const slot of SLOTS.map(s => s.id)) {
      if (entry.is_lab && slot > 3) continue;
      if (day === entry.day && Number(slot) === Number(entry.time_slot)) continue;
      const conflicts = await validateSlot({ entry, day, slot, excludeId: entry.id });
      if (!conflicts.length) {
        alternatives.push({
          course: entry.subject_name,
          batch: entry.batch_name,
          teacher: entry.teacher_name,
          classroom: entry.room_code,
          day,
          time: slotLabel(slot, entry.is_lab),
          availabilityStatus: 'Available',
          conflictStatus: 'None',
        });
      }
      if (alternatives.length >= limit) return alternatives;
    }
  }
  return alternatives;
}

async function findAvailableRoomsForEntry(entry, day = entry.day, slot = entry.time_slot, limit = 10) {
  const rooms = (await pool.query(
    `SELECT id, room_id, capacity, room_type, is_available
     FROM rooms
     WHERE is_available = TRUE AND capacity >= $1
     ORDER BY capacity, room_id`,
    [entry.student_count || 0]
  )).rows;
  const available = [];
  for (const room of rooms) {
    const conflicts = await getSlotOccupants({ day, slot, isLab: entry.is_lab, roomId: room.id, excludeId: entry.id });
    if (!conflicts.length) {
      available.push({
        course: entry.subject_name,
        batch: entry.batch_name,
        teacher: entry.teacher_name,
        classroom: room.room_id,
        day,
        time: slotLabel(slot, entry.is_lab),
        availabilityStatus: 'Available',
        conflictStatus: 'None',
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
    if (!conflicts.length) {
      free.push({
        day,
        time: slotLabel(slot, isLab),
        availabilityStatus: 'Available',
        conflictStatus: 'None',
      });
    }
  }
  return free;
}

async function getWeeklyFreePeriods({ teacherId }) {
  const rows = [];
  for (const day of DAYS) {
    rows.push(...await getFreePeriods({ day, teacherId }));
  }
  return rows;
}

function getTeachingLoadByDay(entries) {
  return DAYS.map(day => {
    const dayEntries = entries.filter(e => e.day === day);
    const hours = dayEntries.reduce((total, e) => total + (e.is_lab ? 3 : 1), 0);
    return { day, lectures: dayEntries.length, hours, entries: dayEntries };
  });
}

async function getPendingRequests(userId) {
  return (await pool.query(
    `SELECT id, status, request_data, created_at, reviewed_at, review_note
     FROM admin_requests
     WHERE requested_by = $1 AND entity_type = 'timetable'
     ORDER BY created_at DESC LIMIT 50`,
    [userId]
  )).rows;
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
  return matches.length === 1 ? matches[0] : null;
}

function response({ intent, summary, rows = [], conflicts = [], alternatives = [], missing = [], request = null }) {
  return { agent: 'Teacher AI Agent', intent, summary, rows, conflicts, alternatives, missing, request };
}

async function handleTeacherAgentMessage({ user, message }) {
  const text = String(message || '').trim();
  if (!text) return response({ intent: 'missing_message', summary: 'Please enter a timetable-related request.', missing: ['message'] });

  if (isGreeting(text)) {
    return response({
      intent: 'greeting',
      summary: 'Hello! I can help you check your timetable, room or batch availability, free periods, workload, conflict-free alternatives, and rescheduling requests. How can I help you today?',
    });
  }

  const teacher = await getLoggedInTeacher(user.id);
  if (!teacher) return response({ intent: 'teacher_not_found', summary: 'Your teacher profile could not be found.' });

  const lower = normalizeText(text);
  const entries = await getTeacherEntries(teacher.id);
  const day = getDayFromText(text);
  const slot = getSlotFromText(text);
  const range = getTimeRangeFromText(text);

  if (/\b(changes|changed|updates|updated)\b/.test(lower) && /\b(this week|week)\b/.test(lower)) {
    const requests = await getPendingRequests(user.id);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recent = requests.filter(r => new Date(r.created_at) >= weekAgo || (r.reviewed_at && new Date(r.reviewed_at) >= weekAgo));
    return response({
      intent: 'weekly_timetable_changes',
      summary: recent.length ? 'These timetable change requests were made or reviewed this week.' : 'No timetable change requests were found for this week.',
      rows: recent.map(r => ({
        id: r.id,
        course: r.request_data.subject_name || r.request_data.old_subject_name || 'Class',
        batch: r.request_data.batch_name || r.request_data.old_batch_name || '',
        teacher: teacher.full_name,
        classroom: r.request_data.room_code || r.request_data.old_room_code || '',
        day: r.request_data.day || r.request_data.old_day || '',
        time: r.request_data.slot_label || r.request_data.old_slot_label || '',
        availabilityStatus: r.status,
        conflictStatus: r.review_note || 'Awaiting review',
      })),
    });
  }

  if (/\b(status|request status|approval|pending|approved|rejected|rescheduled|reschedule requests?)\b/.test(lower)) {
    const requests = await getPendingRequests(user.id);
    const filtered = lower.includes('pending') ? requests.filter(r => r.status === 'pending') : requests;
    return response({
      intent: 'reschedule_status',
      summary: filtered.length ? 'Here are your timetable request statuses.' : 'No matching timetable change requests were found.',
      rows: filtered.map(r => ({
        id: r.id,
        course: r.request_data.subject_name || r.request_data.old_subject_name || 'Class',
        batch: r.request_data.batch_name || r.request_data.old_batch_name || '',
        teacher: teacher.full_name,
        classroom: r.request_data.room_code || r.request_data.old_room_code || '',
        day: r.request_data.day || r.request_data.old_day || '',
        time: r.request_data.slot_label || r.request_data.old_slot_label || '',
        availabilityStatus: r.status,
        conflictStatus: r.review_note || 'Awaiting review',
      })),
    });
  }

  if (/\b(highest teaching load|most teaching load|busiest day|which day has.*teaching load)\b/.test(lower)) {
    const loads = getTeachingLoadByDay(entries);
    const highest = loads.reduce((best, item) => item.hours > best.hours ? item : best, loads[0]);
    return response({
      intent: 'highest_teaching_load',
      summary: highest.hours
        ? `${highest.day} has your highest teaching load: ${highest.lectures} lecture${highest.lectures === 1 ? '' : 's'} and about ${highest.hours} teaching hour${highest.hours === 1 ? '' : 's'}.`
        : 'No teaching load was found in your timetable.',
      rows: highest.entries.map(formatEntry),
    });
  }

  if (/\b(workload|teaching load|how many lectures|lectures do i have)\b/.test(lower)) {
    const filtered = day ? entries.filter(e => e.day === day) : entries;
    const labCount = filtered.filter(e => e.is_lab).length;
    const hours = filtered.reduce((total, e) => total + (e.is_lab ? 3 : 1), 0);
    return response({
      intent: 'workload',
      summary: day
        ? `You have ${filtered.length} lecture${filtered.length === 1 ? '' : 's'} on ${day}, with an estimated workload of ${hours} hour${hours === 1 ? '' : 's'}.`
        : `You have ${filtered.length} lecture${filtered.length === 1 ? '' : 's'} this week, including ${labCount} lab session${labCount === 1 ? '' : 's'}, with an estimated workload of ${hours} hour${hours === 1 ? '' : 's'}.`,
      rows: filtered.map(formatEntry),
    });
  }

  if (/\b(which|what)\b/.test(lower) && /\b(classroom|room)\b/.test(lower) && /\b(assigned|for my|to my)\b/.test(lower)) {
    const entry = await findEntryByCourse(entries, text);
    if (!entry) {
      const requestedCourse = requestedCourseName(text);
      return response({
        intent: 'assigned_classroom_for_course',
        summary: requestedCourse
          ? `${requestedCourse} was not found in your assigned timetable. Please check the exact course name.`
          : 'Please mention the exact course name so I can find its assigned classroom.',
        missing: ['course'],
        rows: [],
      });
    }
    if (day && entry.day !== day) {
      const dayMatch = entries.find(e => Number(e.subject_id) === Number(entry.subject_id) && e.day === day);
      if (!dayMatch) {
        return response({
          intent: 'assigned_classroom_for_course',
          summary: `${entry.subject_name} is not scheduled for you on ${day}.`,
          rows: [],
        });
      }
      return response({
        intent: 'assigned_classroom_for_course',
        summary: `${dayMatch.subject_name} is assigned to ${dayMatch.room_code} today at ${dayMatch.slot_label}.`,
        rows: [formatEntry(dayMatch)],
      });
    }
    return response({
      intent: 'assigned_classroom_for_course',
      summary: `${entry.subject_name} is assigned to ${entry.room_code} on ${entry.day} at ${entry.slot_label}.`,
      rows: [formatEntry(entry)],
    });
  }

  if (/\b(free periods|free period|my availability|am i free|check my availability)\b/.test(lower)) {
    if (range && isOutsideWorkingHours(range)) {
      return response({
        intent: 'teacher_availability',
        summary: 'That time is outside the configured university working slots. The current system has slots from 9:00 AM to 2:00 PM.',
      });
    }
    if (day && range?.slots?.length) {
      const rows = [];
      for (const s of range.slots) {
        const conflicts = await getSlotOccupants({ day, slot: s, teacherId: teacher.id });
        rows.push({
          teacher: teacher.full_name,
          day,
          time: slotLabel(s),
          availabilityStatus: conflicts.length ? 'Unavailable' : 'Available',
          conflictStatus: conflicts.length ? conflictMessage('teacher', conflicts[0]) : 'None',
        });
      }
      return response({
        intent: 'teacher_availability',
        summary: rows.some(r => r.availabilityStatus === 'Available') ? 'Here is your availability for that time range.' : 'You are not free in the requested working slots.',
        rows,
      });
    }
    if (day) {
      const rows = await getFreePeriods({ day, teacherId: teacher.id });
      return response({
        intent: 'teacher_availability',
        summary: rows.length ? `These are your free periods on ${day}.` : `You have no free periods on ${day}.`,
        rows: rows.map(r => ({ ...r, teacher: teacher.full_name })),
      });
    }
    const rows = await getWeeklyFreePeriods({ teacherId: teacher.id });
    return response({
      intent: 'teacher_availability',
      summary: rows.length ? 'These are your free periods this week.' : 'No free periods were found this week.',
      rows: rows.map(r => ({ ...r, teacher: teacher.full_name })),
    });
  }

  if (/\b(suggest|nearest|conflict-free|missed lecture)\b/.test(lower) && /\b(slot|time)\b/.test(lower)) {
    if (/\bmeeting|students|student meeting|office hour\b/.test(lower)) {
      const rows = day
        ? await getFreePeriods({ day, teacherId: teacher.id })
        : await getWeeklyFreePeriods({ teacherId: teacher.id });
      return response({
        intent: 'meeting_slot',
        summary: rows.length ? 'Here are free 1-hour slots you can use for meeting students.' : 'No free 1-hour meeting slots were found.',
        rows: rows.slice(0, 10).map(r => ({ ...r, teacher: teacher.full_name })),
      });
    }
    const entry = await findEntryByCourse(entries, text) || entries[0];
    if (!entry) {
      return response({
        intent: 'suggest_alternative_slot',
        summary: 'No scheduled class was found to use for alternative slot suggestions.',
      });
    }
    const alternatives = await findAlternatives(entry, 10);
    return response({
      intent: 'suggest_alternative_slot',
      summary: alternatives.length ? 'Here are the nearest conflict-free alternatives.' : 'No conflict-free alternatives were found.',
      rows: [formatEntry(entry)],
      alternatives,
    });
  }

  if (/\b(will this|why can't|why cant|conflicts before|create any conflicts|check for timetable conflicts)\b/.test(lower)) {
    const { sourceText, targetText } = getRescheduleParts(text);
    const targetDay = getDayFromText(targetText || text);
    const targetSlot = getSlotFromText(targetText || text);
    const entry = inferEntry(entries, sourceText) || await findEntryByCourse(entries, sourceText);
    const missing = [];
    if (!entry) missing.push('exact class');
    if (!targetDay) missing.push('target day');
    if (!targetSlot) missing.push('target time');
    if (missing.length) {
      return response({
        intent: 'conflict_check',
        summary: 'Please provide the class and target day/time so I can check conflicts before submitting.',
        missing,
        rows: entries.map(formatEntry),
      });
    }
    const conflicts = await validateSlot({ entry, day: targetDay, slot: targetSlot, excludeId: entry.id });
    return response({
      intent: 'conflict_check',
      summary: conflicts.length ? 'Yes, this move would create conflicts.' : 'No conflicts were found for this move.',
      rows: [{ ...formatEntry(entry), day: targetDay, time: slotLabel(targetSlot, entry.is_lab), availabilityStatus: conflicts.length ? 'Unavailable' : 'Available', conflictStatus: conflicts.length ? 'Conflict detected' : 'None' }],
      conflicts,
      alternatives: conflicts.length ? await findAlternatives(entry, 5) : [],
    });
  }

  if (/\b(reschedule|move|shift|change)\b/.test(lower)) {
    const { sourceText, targetText } = getRescheduleParts(text);
    const newDay = getDayFromText(targetText);
    const newSlot = getSlotFromText(targetText);
    const entry = inferEntry(entries, sourceText) || await findEntryByCourse(entries, sourceText);
    const targetRoom = await findTargetRoom(text);
    const requestedRoom = requestedRoomName(targetText || text);
    const requestedCourse = requestedCourseName(sourceText);
    const missing = [];
    if (!entry && requestedCourse) {
      return response({
        intent: 'reschedule_request',
        summary: `${requestedCourse} was not found in your assigned timetable. Please check the exact course name before submitting a rescheduling request.`,
        conflicts: [{ type: 'course_not_found', message: `${requestedCourse} is not assigned to your timetable records.` }],
      });
    }
    if (!entry) missing.push('exact class (course/batch/day/time)');
    if (requestedRoom && !targetRoom) {
      return response({
        intent: 'reschedule_request',
        summary: `${requestedRoom} was not found in the university room database. Please check the room code and try again.`,
        conflicts: [{ type: 'room_not_found', message: `${requestedRoom} does not exist in the rooms table.` }],
      });
    }
    if (!newDay && !targetRoom) missing.push('new day');
    if (!newSlot && !targetRoom) missing.push('new time slot');
    if (missing.length) {
      return response({
        intent: 'reschedule_request',
        summary: lower.includes('submit') && entry
          ? 'I found the class. Please choose one of the conflict-free alternatives before I submit the request.'
          : 'I need a little more detail before I can submit a reschedule request.',
        missing,
        rows: entries.map(formatEntry),
        alternatives: entry ? await findAlternatives(entry, 5) : [],
      });
    }

    const finalDay = newDay || entry.day;
    const finalSlot = newSlot || entry.time_slot;
    const conflicts = await validateSlot({ entry, day: finalDay, slot: finalSlot, roomId: targetRoom?.id, excludeId: entry.id });
    const alternatives = conflicts.length ? await findAlternatives(entry) : [];
    if (conflicts.length) {
      return response({
        intent: 'reschedule_request',
        summary: 'I did not submit the request because the requested slot has conflicts.',
        rows: [formatEntry(entry)],
        conflicts,
        alternatives,
      });
    }
    const { request } = await submitTimetableUpdateRequest({
      userId: user.id,
      entry,
      day: finalDay,
      slot: finalSlot,
      room: targetRoom,
      reason: text,
    });
    return response({
      intent: 'reschedule_request',
      summary: 'Request verified and submitted for Admin approval. The timetable has not been changed directly.',
      rows: [{
        ...formatEntry(entry),
        classroom: targetRoom?.room_id || entry.room_code,
        availabilityStatus: 'Requested',
        day: finalDay,
        time: slotLabel(finalSlot, entry.is_lab),
      }],
      request,
    });
  }

  if (/\b(course|courses|subject|subjects|assigned)\b/.test(lower)) {
    const rows = [...new Map(entries.map(e => [e.subject_id, e])).values()];
    return response({
      intent: 'assigned_courses',
      summary: rows.length ? 'These are your assigned courses from scheduled timetable records.' : 'No assigned scheduled courses were found.',
      rows: rows.map(formatEntry),
    });
  }

  if (/\b(today|tomorrow|weekly|week|schedule|timetable|lecture|lectures|class|classes|timing|summary)\b/.test(lower)) {
    const course = await findCourse(text, teacher.id);
    const filtered = course
      ? entries.filter(e => Number(e.subject_id) === Number(course.id) && (!day || e.day === day))
      : (lower.includes('weekly') || lower.includes('week') ? entries : (day ? entries.filter(e => e.day === day) : entries));
    const summaryDay = day ? ` for ${day}` : '';
    return response({
      intent: 'view_timetable',
      summary: filtered.length ? `Here are your scheduled classes${summaryDay} from the latest timetable records.` : `No scheduled classes were found${summaryDay}.`,
      rows: filtered.map(formatEntry),
    });
  }

  if (/\b(batch|batches)\b/.test(lower) && !/\bavailable|free|availability\b/.test(lower)) {
    const rows = [...new Map(entries.map(e => [e.batch_id, e])).values()];
    return response({
      intent: 'assigned_batches',
      summary: rows.length ? 'These are your assigned batches from scheduled timetable records.' : 'No assigned batches were found.',
      rows: rows.map(formatEntry),
    });
  }

  if (/\b(classroom|classrooms|room|rooms)\b/.test(lower) && !/\bavailable|free|availability\b/.test(lower)) {
    const rows = [...new Map(entries.map(e => [e.room_id, e])).values()];
    return response({
      intent: 'assigned_classrooms',
      summary: rows.length ? 'These are your assigned classrooms from scheduled timetable records.' : 'No assigned classrooms were found.',
      rows: rows.map(formatEntry),
    });
  }

  if (/\b(available|availability|free|conflict|empty)\b/.test(lower)) {
    if (range && isOutsideWorkingHours(range)) {
      return response({
        intent: 'availability_check',
        summary: 'That time is outside the configured university working slots. The current system has slots from 9:00 AM to 2:00 PM.',
      });
    }

    if (/\bavailable slots|free slots|find slots|time slots\b/.test(lower)) {
      const batch = await findBatch(text);
      const requestedBatch = requestedBatchName(text);
      if (requestedBatch && !batch) {
        return response({
          intent: 'available_time_slots',
          summary: `${requestedBatch} was not found in the batch database. Please check the batch name and try again.`,
          conflicts: [{ type: 'batch_not_found', message: `${requestedBatch} does not exist in the batches table.` }],
        });
      }
      if (batch) {
        const rows = [];
        for (const d of DAYS) {
          rows.push(...await getFreePeriods({ day: d, batchId: batch.id }));
        }
        return response({
          intent: 'available_time_slots',
          summary: rows.length ? `Here are free slots for ${batch.batch_name}.` : `No free slots were found for ${batch.batch_name}.`,
          rows: rows.map(r => ({ ...r, batch: batch.batch_name })),
        });
      }
      const targetEntry = await findCourse(text, teacher.id);
      const baseEntry = targetEntry ? entries.find(e => e.subject_id === targetEntry.id) : entries[0];
      if (!baseEntry) {
        return response({
          intent: 'available_time_slots',
          summary: 'No scheduled class was found to use as the basis for conflict-free slot suggestions.',
        });
      }
      const alternatives = await findAlternatives(baseEntry, 10);
      return response({ intent: 'available_time_slots', summary: 'Here are the nearest conflict-free slots I found.', alternatives });
    }

    if (/\bavailable classroom|available classrooms|free rooms|available rooms|find rooms|available room\b/.test(lower)) {
      const entry = await findEntryByCourse(entries, text);
      const lookupDay = day || entry?.day;
      const lookupSlot = slot || entry?.time_slot;
      if (/\bmy\b|\blecture\b|\bclass\b|\bcourse\b/.test(lower) && !entry) {
        return response({
          intent: 'available_classrooms',
          summary: 'I could not find that course in your assigned timetable. Please use the exact course name from your schedule.',
          missing: ['exact assigned course name'],
          rows: [],
        });
      }
      if (!lookupDay || !lookupSlot) {
        return response({
          intent: 'available_classrooms',
          summary: 'Please provide a day and time, or mention one of your course names so I can use its scheduled slot.',
          missing: ['day/time or course'],
        });
      }
      if (entry) {
        const rows = await findAvailableRoomsForEntry(entry, lookupDay, lookupSlot, 10);
        return response({
          intent: 'available_classrooms',
          summary: rows.length ? `Here are available classrooms for ${entry.subject_name}.` : 'No suitable free classrooms were found.',
          rows,
        });
      }
      const rooms = (await pool.query('SELECT id, room_id, capacity, room_type, is_available FROM rooms ORDER BY room_id')).rows;
      const rows = [];
      for (const r of rooms) {
        if (!r.is_available) continue;
        const c = await getSlotOccupants({ day: lookupDay, slot: lookupSlot, isLab: isLabText(text), roomId: r.id });
        if (!c.length) rows.push({ classroom: r.room_id, day: lookupDay, time: slotLabel(lookupSlot, isLabText(text)), availabilityStatus: 'Available', conflictStatus: 'None' });
      }
      return response({
        intent: 'available_classrooms',
        summary: rows.length ? 'Here are the available classrooms for the requested slot.' : 'No free classrooms were found for the requested slot.',
        rows,
      });
    }

    if (!day || (!slot && !range?.slots?.length)) {
      return response({
        intent: 'availability_check',
        summary: 'Please provide both day and time slot so I can check live availability.',
        missing: ['day', 'time slot'],
      });
    }

    const room = await findRoom(text);
    const batch = await findBatch(text);
    const teacherForCheck = /\bteacher\b/.test(lower) ? await findTeacher(text, teacher) : null;
    const rows = [];
    const conflicts = [];
    const slotsToCheck = range?.slots?.length ? range.slots : [slot];

    const requestedRoom = requestedRoomName(text);
    if (requestedRoom && !room) {
      return response({
        intent: 'availability_check',
        summary: `${requestedRoom} was not found in the university room database. Please check the room name/code and try again.`,
        rows: [],
        conflicts: [{ type: 'room_not_found', message: `${requestedRoom} does not exist in the rooms table.` }],
      });
    }

    if (room) {
      for (const s of slotsToCheck) {
        const roomConflicts = await getSlotOccupants({ day, slot: s, isLab: isLabText(text), roomId: room.id });
        conflicts.push(...roomConflicts.map(r => ({ type: 'room', message: conflictMessage('room', r) })));
        rows.push({
          course: '',
          batch: '',
          teacher: '',
          classroom: room.room_id,
          day,
          time: slotLabel(s, isLabText(text)),
          availabilityStatus: roomConflicts.length || !room.is_available ? 'Unavailable' : 'Available',
          conflictStatus: roomConflicts.length ? 'Conflict detected' : 'None',
        });
      }
    }

    if (batch) {
      for (const s of slotsToCheck) {
        const batchConflicts = await getSlotOccupants({ day, slot: s, isLab: isLabText(text), batchId: batch.id });
        conflicts.push(...batchConflicts.map(r => ({ type: 'batch', message: conflictMessage('batch', r) })));
        rows.push({
          course: '',
          batch: batch.batch_name,
          teacher: '',
          classroom: '',
          day,
          time: slotLabel(s, isLabText(text)),
          availabilityStatus: batchConflicts.length ? 'Unavailable' : 'Available',
          conflictStatus: batchConflicts.length ? 'Conflict detected' : 'None',
        });
      }
    }

    if (teacherForCheck) {
      for (const s of slotsToCheck) {
        const teacherConflicts = await getSlotOccupants({ day, slot: s, isLab: isLabText(text), teacherId: teacherForCheck.id });
        conflicts.push(...teacherConflicts.map(r => ({ type: 'teacher', message: conflictMessage('teacher', r) })));
        rows.push({
          course: '',
          batch: '',
          teacher: teacherForCheck.full_name,
          classroom: '',
          day,
          time: slotLabel(s, isLabText(text)),
          availabilityStatus: teacherConflicts.length ? 'Unavailable' : 'Available',
          conflictStatus: teacherConflicts.length ? 'Conflict detected' : 'None',
        });
      }
    }

    return response({
      intent: 'availability_check',
      summary: conflicts.length ? 'Availability checked. Conflicts were found.' : 'Availability checked. No conflicts were found.',
      rows,
      conflicts,
    });
  }

  return response({
    intent: 'help',
    summary: 'I can help with today, tomorrow, weekly timetable, assigned courses, batches, classrooms, availability checks, alternatives, reschedule requests, and request status.',
    rows: [],
  });
}

module.exports = {
  TEACHER_AGENT_SYSTEM_PROMPT,
  handleTeacherAgentMessage,
};
