// backend/services/lookupTableService.js
//
// Builds an in-memory "lookup table" of subjects, batches, teachers, and rooms
// from the database, and exposes fuzzy-matching lookups so the assistant
// agent stops relying on brittle `.includes()` substring checks.
//
// Call `init()` once at server startup (see server.js). The table auto-refreshes
// on an interval, and you can also call `refresh()` manually right after any
// admin action that adds/edits/removes a subject, batch, teacher, or room.

const Fuse = require('fuse.js');
const pool = require('../config/db');

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Tune per entity type if needed — teacher names have more spelling variation
// than room codes, so they get a slightly looser threshold.
const THRESHOLDS = {
  subjects: 0.35,
  batches: 0.3,
  teachers: 0.4,
  rooms: 0.25,
};

let cache = { subjects: [], batches: [], teachers: [], rooms: [] };
let fuseIndex = { subjects: null, batches: null, teachers: null, rooms: null };
let initialized = false;

function normalize(value = '') {
  return String(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

// Builds sensible aliases for a teacher's full name: the full name itself,
// each individual name part (>=3 chars, so "Ali" counts but "Dr" doesn't),
// and the last name alone, since staff are often referred to informally
// ("Miss Tehreem", "Sir Ahmed", or just "Tehreem").
function teacherAliases(fullName, teacherId) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const aliases = new Set([fullName, teacherId].filter(Boolean));
  parts.forEach((p) => { if (p.length >= 3) aliases.add(p); });
  if (parts.length) aliases.add(parts[parts.length - 1]);
  return [...aliases];
}

async function loadSubjects() {
  const { rows } = await pool.query(
    'SELECT id, code, name, short_name, has_lab FROM subjects ORDER BY name'
  );
  return rows.map((r) => ({
    id: r.id,
    canonical: r.name,
    row: r,
    aliases: [r.name, r.short_name, r.code].filter(Boolean),
  }));
}

async function loadBatches() {
  const { rows } = await pool.query(
    'SELECT id, batch_name, major, major_code, year, student_count FROM batches WHERE is_active = TRUE ORDER BY batch_name'
  );
  return rows.map((r) => ({
    id: r.id,
    canonical: r.batch_name,
    row: r,
    aliases: [r.batch_name],
  }));
}

async function loadTeachers() {
  const { rows } = await pool.query(
    'SELECT id, teacher_id, full_name FROM teachers WHERE is_active = TRUE ORDER BY full_name'
  );
  return rows.map((r) => ({
    id: r.id,
    canonical: r.full_name,
    row: r,
    aliases: teacherAliases(r.full_name, r.teacher_id),
  }));
}

async function loadRooms() {
  const { rows } = await pool.query(
    'SELECT id, room_id, room_name, capacity, room_type, is_available FROM rooms ORDER BY room_id'
  );
  return rows.map((r) => ({
    id: r.id,
    canonical: r.room_id,
    row: r,
    aliases: [r.room_id, r.room_name].filter(Boolean),
  }));
}

function buildFuse(entries, threshold) {
  // Fuse searches over a flattened alias string per entry, not the raw text —
  // so "Room A-204" matches an entry whose alias is "A-204" even with the
  // extra word "Room" in front.
  const withSearchText = entries.map((e) => ({
    ...e,
    searchText: e.aliases.join(' | '),
  }));
  return new Fuse(withSearchText, {
    keys: ['searchText'],
    includeScore: true,
    ignoreLocation: true,
    threshold,
  });
}

async function refresh() {
  const [subjects, batches, teachers, rooms] = await Promise.all([
    loadSubjects(),
    loadBatches(),
    loadTeachers(),
    loadRooms(),
  ]);
  cache = { subjects, batches, teachers, rooms };
  fuseIndex = {
    subjects: buildFuse(subjects, THRESHOLDS.subjects),
    batches: buildFuse(batches, THRESHOLDS.batches),
    teachers: buildFuse(teachers, THRESHOLDS.teachers),
    rooms: buildFuse(rooms, THRESHOLDS.rooms),
  };
  initialized = true;
  return cache;
}

async function init() {
  await refresh();
  setInterval(() => {
    refresh().catch((err) => console.log('Lookup table refresh failed:', err.message));
  }, REFRESH_INTERVAL_MS);
}

// Matches free text against one entity type.
// 1. Fast path: exact alias substring match (e.g. the raw code/name/id appears
//    verbatim in the text). This is precise and avoids fuzzy false positives
//    on short codes like room numbers.
// 2. Fallback: fuzzy search across all aliases, so typos, partial names, and
//    minor phrasing differences still resolve.
// Returns { matched, ambiguous, id, canonical, row, candidates }.
function matchEntity(type, text) {
  if (!initialized) {
    throw new Error('Lookup table not initialized — call lookupTableService.init() at server startup.');
  }
  const lower = normalize(text);
  if (!lower) return { matched: false, ambiguous: false, candidates: [] };

  const entries = cache[type];

  const exactMatches = entries.filter((e) =>
    e.aliases.some((a) => a && lower.includes(normalize(a)))
  );
  if (exactMatches.length === 1) {
    const m = exactMatches[0];
    return { matched: true, ambiguous: false, id: m.id, canonical: m.canonical, row: m.row };
  }
  if (exactMatches.length > 1) {
    // More than one canonical alias appears in the text — ambiguous rather
    // than guessing which one the user meant.
    return {
      matched: false,
      ambiguous: true,
      candidates: exactMatches.map((m) => m.canonical),
    };
  }

  const results = fuseIndex[type].search(text);
  if (!results.length) return { matched: false, ambiguous: false, candidates: [] };

  const [top, second] = results;
  const tooClose = second && Math.abs(second.score - top.score) < 0.05;
  const threshold = THRESHOLDS[type];

  if (top.score > threshold || tooClose) {
    return {
      matched: false,
      ambiguous: true,
      candidates: results.slice(0, 3).map((r) => r.item.canonical),
    };
  }

  return { matched: true, ambiguous: false, id: top.item.id, canonical: top.item.canonical, row: top.item.row };
}

module.exports = {
  init,
  refresh,
  matchSubject: (text) => matchEntity('subjects', text),
  matchBatch: (text) => matchEntity('batches', text),
  matchTeacher: (text) => matchEntity('teachers', text),
  matchRoom: (text) => matchEntity('rooms', text),
};