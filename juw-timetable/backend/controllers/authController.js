// backend/controllers/authController.js
const pool   = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

// Sanitize input — strip SQL injection attempts
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/['";\-\-\/\*\\]/g, '').trim();
}

// Validate JUW ID — 8 to 9 characters, alphanumeric only
function validateId(id) {
  if (!id || typeof id !== 'string') return 'ID is required.';
  const clean = id.trim();
  if (clean.length < 3 || clean.length > 20) return 'ID must be between 3 and 20 characters.';
  if (!/^[a-zA-Z0-9\-_]+$/.test(clean)) return 'ID can only contain letters, numbers, hyphens and underscores.';
  return null;
}

// POST /api/auth/login
const login = async (req, res) => {
  try {
    let { juw_id, password } = req.body;

    // Sanitize
    juw_id   = sanitize(String(juw_id   || ''));
    password = String(password || '').slice(0, 100); // limit length

    if (!juw_id || !password) {
      return res.status(400).json({ message: 'ID and password are required.' });
    }

    // Use parameterized query — no SQL injection possible
    const result = await pool.query(
      'SELECT * FROM users WHERE juw_id = $1',
      [juw_id]
    );

    if (!result.rows.length) {
      return res.status(401).json({ message: 'Invalid ID or password.' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid ID or password.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, juw_id: user.juw_id },
      process.env.JWT_SECRET || 'juw_secret_2025',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id:         user.id,
        juw_id:     user.juw_id,
        full_name:  user.full_name,
        role:       user.role,
        department_id: user.department_id,
      }
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    let { current_password, new_password } = req.body;

    current_password = String(current_password || '');
    new_password     = String(new_password     || '');

    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Current and new passwords are required.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }
    if (new_password.length > 100) {
      return res.status(400).json({ message: 'Password is too long.' });
    }

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'User not found.' });

    const user  = result.rows[0];
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect.' });

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.juw_id, u.full_name, u.role, u.department_id,
              d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'User not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { login, changePassword, getMe };