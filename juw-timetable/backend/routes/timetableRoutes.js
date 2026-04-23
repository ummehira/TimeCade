// backend/routes/timetableRoutes.js
const express = require('express');
const router  = express.Router();
const {
  getTimetable, createEntry, updateEntry,
  deleteEntry, checkConflicts, teacherRescheduleRequest
} = require('../controllers/timetableController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const canEdit   = authorize('office_assistant', 'department_admin');
const allStaff  = authorize('office_assistant', 'department_admin', 'teacher');

router.get ('/',                  authenticate,           getTimetable);
router.post('/check-conflicts',   authenticate, allStaff, checkConflicts);
router.post('/reschedule-request',authenticate, authorize('teacher'), teacherRescheduleRequest);
router.post ('/',                 authenticate, canEdit,  createEntry);
router.put  ('/:id',              authenticate, canEdit,  updateEntry);
router.delete('/:id',             authenticate, canEdit,  deleteEntry);

module.exports = router;