const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleAssistantAgentMessage } = require('../services/assistantAgentService');

router.post('/message', authenticate, authorize('office_assistant'), async (req, res) => {
  try {
    const result = await handleAssistantAgentMessage({
      user: req.user,
      message: req.body.message,
    });

    res.json(result);
  } catch (err) {
    console.error('Assistant Agent Error:', err);
    res.status(500).json({
      message: 'Assistant AI Agent could not process this request.',
    });
  }
});

module.exports = router;