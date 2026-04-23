// backend/middleware/authMiddleware.js
const jwt  = require('jsonwebtoken');
const pool = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token   = header.split(' ')[1];
    // Use same secret + fallback as authController
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'juw_secret_2025');

    // authController signs with { id, role, juw_id } — use decoded.id not decoded.userId
    const result = await pool.query(
      'SELECT id, juw_id, role, full_name, department_id FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!result.rows.length) {
      return res.status(401).json({ message: 'User not found.' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role(s): ${roles.join(', ')}`
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };