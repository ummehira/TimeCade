// ============================================
// JUW Timetable System - Main Server Entry
// ============================================
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

const lookupTableService = require('./services/lookupTableService');

// ── Middleware ──────────────────────────────
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3000',
    /\.onrender\.com$/,
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ── Routes ──────────────────────────────────
app.use('/api/auth',        require('./routes/authRoutes'));
app.use('/api/timetable',   require('./routes/timetableRoutes'));
app.use('/api/office',      require('./routes/officeRoutes'));
app.use('/api/approvals',   require('./routes/approvalRoutes'));
app.use('/api/enrollment',  require('./routes/enrollmentRoutes'));
app.use('/api/notifications',require('./routes/notificationRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/teacher-agent', require('./routes/teacherAgentRoutes'));
app.use('/api/assistant-agent', require('./routes/assistantAgentRoutes'));

// ── Health Check ────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'JUW Timetable API is running',
    timestamp: new Date()
  });
});

// ── Global Error Handler ────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// ── Start Server ────────────────────────────
// Wait for the lookup table to load before accepting traffic, so the
// assistant agent never hits a request while lookupTableService is
// still uninitialized (which would throw on the first message).
const PORT = process.env.PORT || 5000;

async function startServer() {
  await lookupTableService.init();
  console.log('Lookup table ready');

  app.listen(PORT, () => {
    console.log(`\n✅ JUW Timetable Backend running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});