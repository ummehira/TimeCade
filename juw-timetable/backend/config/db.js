// backend/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,                        // fewer connections for Neon free tier
  idleTimeoutMillis: 30000,      // close idle connections after 30s
  connectionTimeoutMillis: 10000, // fail fast on connect, retry will handle it
  keepAlive: true,               // TCP keepalive
  keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
  console.log('Pool error (handled):', err.message);
});

// Robust query with up to 3 retries and fresh client fallback
const originalQuery = pool.query.bind(pool);

pool.query = async function(text, params) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await originalQuery(text, params);
    } catch (err) {
      lastErr = err;
      const isRetryable =
        err.message?.includes('terminated') ||
        err.message?.includes('timeout')    ||
        err.message?.includes('Connection') ||
        err.message?.includes('ECONNRESET') ||
        err.code === 'ECONNRESET'           ||
        err.code === '57P01';               // admin_shutdown (Neon idle timeout)

      if (isRetryable && attempt < 3) {
        const delay = attempt * 1000; // 1s, 2s
        console.log(`Query failed (attempt ${attempt}), retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
};

// Ping every 3 minutes to prevent Neon from closing the connection
setInterval(() => {
  originalQuery('SELECT 1').catch(() => {});
}, 3 * 60 * 1000);

// Startup ping
originalQuery('SELECT 1')
  .then(() => console.log('Connected to Neon PostgreSQL'))
  .catch(e => console.log('Startup ping failed (will retry on first request):', e.message));

module.exports = pool;