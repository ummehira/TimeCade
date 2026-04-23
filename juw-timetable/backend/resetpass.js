const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function fix() {
  const hash = await bcrypt.hash('juw@2025', 10);
  const r = await pool.query(
    "UPDATE users SET password_hash=$1 WHERE juw_id='ASSIST001' RETURNING juw_id",
    [hash]
  );
  console.log('Reset done:', r.rows);
  process.exit();
}

fix();