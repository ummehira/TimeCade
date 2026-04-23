// backend/resetAllPasswords.js
// Sets every user's password to their own JUW ID (lowercase)
// Run: node resetAllPasswords.js

const bcrypt = require('bcryptjs');
const pool   = require('./config/db');

async function resetAll() {
  try {
    console.log('Fetching all users...');
    const result = await pool.query('SELECT id, juw_id, role FROM users ORDER BY role, juw_id');
    const users  = result.rows;
    console.log(`Found ${users.length} users. Resetting passwords...\n`);

    for (const user of users) {
      // Password = JUW ID in lowercase
      const newPassword = user.juw_id.toLowerCase();
      const hash = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user.id]);
      console.log(`✓ ${user.juw_id.padEnd(20)} → password: ${newPassword}  (role: ${user.role})`);
    }

    console.log('\nAll passwords reset successfully!');
    console.log('Each user now logs in with their JUW ID as password (lowercase).');
    console.log('Examples:');
    console.log('  ASSIST001  →  assist001');
    console.log('  T001       →  t001');
    console.log('  STU001     →  stu001');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

resetAll();