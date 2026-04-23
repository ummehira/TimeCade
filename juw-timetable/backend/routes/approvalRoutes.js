// backend/routes/approvalRoutes.js
const express = require('express');
const router  = express.Router();
const {
  getAllRequests, getPendingRequests,
  approveRequest, rejectRequest
} = require('../controllers/approvalController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const assistOnly = authorize('office_assistant');

router.get('/pending',         authenticate, assistOnly, getPendingRequests);
router.get('/',                authenticate, assistOnly, getAllRequests);
router.post('/:id/approve',    authenticate, assistOnly, approveRequest);
router.post('/:id/reject',     authenticate, assistOnly, rejectRequest);

module.exports = router;
