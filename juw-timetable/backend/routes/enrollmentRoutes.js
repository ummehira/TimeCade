// backend/routes/enrollmentRoutes.js
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const { getStudents, enrollStudent, updateStudent, bulkEnroll } = require('../controllers/enrollmentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const canEnroll = authorize('office_assistant');
const upload    = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get  ('/',     authenticate, canEnroll, getStudents);
router.post ('/',     authenticate, canEnroll, enrollStudent);
router.post ('/bulk', authenticate, canEnroll, upload.single('file'), bulkEnroll);
router.put  ('/:id',  authenticate, canEnroll, updateStudent);

module.exports = router;