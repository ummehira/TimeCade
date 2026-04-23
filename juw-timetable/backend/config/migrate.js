// ============================================
// backend/config/migrate.js
// Run: node config/migrate.js
// ============================================
const fs   = require('fs');
const path = require('path');
const pool = require('./db');

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('\n🔄 Running database migration...');

    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('Schema created successfully');

    const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await client.query(seed);
    console.log(' Seed data inserted successfully');

    console.log('\nMigration complete! You can now start the server.\n');
  } catch (err) {
    console.error('\n Migration error:', err.message);
    console.error(err.detail || '');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
