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

// Whole-token containment: does `na` (a normalized alias) appear in `text` (also
// normalized) as a complete token, not as a fragment inside a bigger word? This
// stops a short 2-letter code like "DE" (Differential Equations) or "PS"
// (Pakistan Studies) from matching inside an unrelated word like "devops".
function tokenMatch(na, text) {
  if (!na) return false;
  const escaped = na.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Boundaries are "not adjacent to another alphanumeric char", so hyphenated
  // codes ("d-20") and multi-word names ("ms. surayya obaid") still match.
  return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`).test(text);
}

// Room/batch codes are written inconsistently — "D-20", "D20", "D 20", "d20".
// Expand a code into every common separator variant so any of them resolves to
// the same record. e.g. "D-20" -> ["D-20", "D20", "D 20"].
function codeVariants(code) {
  const c = String(code || '').trim();
  if (!c) return [];
  return [...new Set([
    c,
    c.replace(/[-\s]+/g, ''),   // D20
    c.replace(/[-\s]+/g, ' '),  // D 20
    c.replace(/[-\s]+/g, '-'),  // D-20
  ])].filter(Boolean);
}

// Honorifics / titles that must never become standalone aliases — otherwise
// "Ms. Surayya Obaid" would fuzzy/exact-match every teacher whose name starts
// with "Ms.", making the lookup hopelessly ambiguous.
const HONORIFICS = new Set([
  'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.', 'miss', 'sir', 'sir.',
  'dr', 'dr.', 'prof', 'prof.', 'madam', 'sr', 'sr.',
]);

// Builds sensible aliases for a teacher's full name: the full name itself,
// each individual name part (>=3 chars, so "Ali" counts but "Dr" doesn't),
// and the last name alone, since staff are often referred to informally
// ("Miss Tehreem", "Sir Ahmed", or just "Tehreem"). Honorifics are stripped so
// they can't collapse every teacher into one ambiguous bucket, and blank/
// whitespace-only names (bad data) yield no matchable aliases at all.
function teacherAliases(fullName, teacherId) {
  const full = String(fullName || '').trim();
  const aliases = new Set([full, teacherId].filter(Boolean));
  const nameParts = full
    .split(/\s+/)
    .filter(Boolean)
    .filter((p) => !HONORIFICS.has(p.toLowerCase()));
  // The full name minus any honorific ("Mehak Abbas" for "Ms. Mehak Abbas") is
  // the most specific alias — it lets a fuller query win over a shorter name
  // that is otherwise a subset ("Ms. Mehak").
  if (nameParts.length > 1) aliases.add(nameParts.join(' '));
  nameParts.forEach((p) => { if (p.length >= 3) aliases.add(p); });
  if (nameParts.length) aliases.add(nameParts[nameParts.length - 1]);
  return [...aliases].filter((a) => a && a.trim());
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
    aliases: [...new Set([...codeVariants(r.room_id), r.room_name].filter(Boolean))],
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

  // For each entry, find the length of the longest alias present in the text as
  // a whole token. Blank aliases (from bad data like a "   " teacher name) score
  // 0 and are ignored. bestLen 0 means no alias matched.
  const scored = entries
    .map((e) => {
      let bestLen = 0;
      for (const a of e.aliases) {
        const na = normalize(a);
        if (na && na.length > bestLen && tokenMatch(na, lower)) bestLen = na.length;
      }
      return { entry: e, bestLen };
    })
    .filter((s) => s.bestLen > 0);

  if (scored.length) {
    // Prefer the most specific match: the entry whose longest matched alias is
    // longest wins ("Hira Sultan" beats a bare "Hira" hit on "Hira Tariq").
    // Only a genuine tie at the top specificity is treated as ambiguous.
    const maxLen = Math.max(...scored.map((s) => s.bestLen));
    const top = scored.filter((s) => s.bestLen === maxLen);
    if (top.length === 1) {
      const m = top[0].entry;
      return { matched: true, ambiguous: false, id: m.id, canonical: m.canonical, row: m.row };
    }
    return {
      matched: false,
      ambiguous: true,
      candidates: top.map((s) => s.entry.canonical),
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