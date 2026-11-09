// backend/routes/settingsRoutes.js
const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { SEMESTER_OPTIONS, getActiveSemester, setActiveSemester } = require('../services/settingsService');

// Everyone (office, teachers, students) can read the active semester
router.get('/active-semester', authenticate, async (req, res) => {
  try {
    res.json({ semester: await getActiveSemester(), options: SEMESTER_OPTIONS });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Only office staff can switch it
router.put('/active-semester', authenticate, authorize('office_assistant', 'department_admin'), async (req, res) => {
  const n = parseInt(req.body.semester);
  if (!SEMESTER_OPTIONS.includes(n))
    return res.status(400).json({ message: `semester must be one of: ${SEMESTER_OPTIONS.join(', ')}` });
  try {
    await setActiveSemester(n, req.user && req.user.id);
    res.json({ semester: n, options: SEMESTER_OPTIONS });
  } catch (err) {
    console.error('setActiveSemester:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
