// backend/services/settingsService.js
// One global "active semester" that every screen follows, so the office only
// has to switch it once (instead of choosing 1st/2nd semester on every page).
const pool = require('../config/db');

const SEMESTER_OPTIONS = [1, 2];     // Session 1 / Session 2
const TTL_MS = 10000;                // tiny cache so we don't hit the DB on every request
let cache = { value: null, at: 0 };

async function ensureSettingsTable() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS app_settings (
       key        VARCHAR(50) PRIMARY KEY,
       value      TEXT NOT NULL,
       updated_by INTEGER,
       updated_at TIMESTAMP DEFAULT NOW()
     )`
  );
  await pool.query(
    `INSERT INTO app_settings (key, value) VALUES ('active_semester', '1')
     ON CONFLICT (key) DO NOTHING`
  );
}

async function getActiveSemester() {
  if (cache.value && Date.now() - cache.at < TTL_MS) return cache.value;
  let value = 1;
  try {
    let r = await pool.query(`SELECT value FROM app_settings WHERE key = 'active_semester'`);
    if (!r.rows.length) {
      await ensureSettingsTable();
      r = await pool.query(`SELECT value FROM app_settings WHERE key = 'active_semester'`);
    }
    const n = parseInt(r.rows[0] && r.rows[0].value);
    if (SEMESTER_OPTIONS.includes(n)) value = n;
  } catch (err) {
    console.error('[settings] could not read active semester, using 1:', err.message);
    try { await ensureSettingsTable(); } catch (_) {}
  }
  cache = { value, at: Date.now() };
  return value;
}

async function setActiveSemester(semester, userId = null) {
  const n = parseInt(semester);
  if (!SEMESTER_OPTIONS.includes(n)) throw new Error('Invalid semester');
  await ensureSettingsTable();
  await pool.query(
    `INSERT INTO app_settings (key, value, updated_by, updated_at)
     VALUES ('active_semester', $1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
    [String(n), userId]
  );
  cache = { value: n, at: Date.now() };
  return n;
}

module.exports = { SEMESTER_OPTIONS, ensureSettingsTable, getActiveSemester, setActiveSemester };
