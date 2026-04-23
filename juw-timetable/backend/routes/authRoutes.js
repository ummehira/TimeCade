// backend/routes/authRoutes.js
const express = require('express');
const router  = express.Router();
const { login, changePassword, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/login',           login);
router.post('/change-password', authenticate, changePassword);
router.get ('/me',              authenticate, getMe);

module.exports = router;