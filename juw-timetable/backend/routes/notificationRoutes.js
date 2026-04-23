// backend/routes/notificationRoutes.js
const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { authenticate } = require('../middleware/authMiddleware');

// GET /api/notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT n.*, u.full_name AS actor_name
       FROM notifications n
       LEFT JOIN users u ON n.actor_id = u.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(r.rows);
  } catch (err) {
    console.error('getNotifications:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=false',
      [req.user.id]
    );
    res.json({ count: parseInt(r.rows[0].count) });
  } catch (err) {
    res.status(500).json({ count: 0 });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/notifications/read-all/mark
router.put('/read-all/mark', authenticate, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read=true WHERE user_id=$1',
      [req.user.id]
    );
    res.json({ message: 'All marked as read.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;