const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleTeacherAgentMessage } = require('../services/teacherAgentService');

router.post('/message', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const result = await handleTeacherAgentMessage({
      user: req.user,
      message: req.body.message,
    });

    res.json(result);
  } catch (err) {
    console.error('Teacher Agent Error:', err);
    res.status(500).json({
      message: 'Teacher AI Agent could not process this request.',
    });
  }
});

module.exports = router;