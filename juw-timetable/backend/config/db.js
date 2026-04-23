// backend/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 60000,
  idleTimeoutMillis: 0,
  query_timeout: 60000,
});

pool.on('error', (err) => {
  console.log('Pool error:', err.message);
});

// Auto-retry query once on timeout/disconnect
const originalQuery = pool.query.bind(pool);
pool.query = async function(text, params) {
  try {
    return await originalQuery(text, params);
  } catch (err) {
    const isRetryable = err.message?.includes('terminated') ||
                        err.message?.includes('timeout') ||
                        err.message?.includes('Connection');
    if (isRetryable) {
      console.log('Query failed, retrying in 2s...');
      await new Promise(r => setTimeout(r, 2000));
      return await originalQuery(text, params);
    }
    throw err;
  }
};

// Ping every 4 minutes to keep Neon awake
setInterval(() => {
  originalQuery('SELECT 1').catch(() => {});
}, 4 * 60 * 1000);

// Wake on startup
originalQuery('SELECT 1')
  .then(() => console.log('Connected to Neon PostgreSQL'))
  .catch(e => console.log('Startup ping failed (will retry):', e.message));

module.exports = pool;