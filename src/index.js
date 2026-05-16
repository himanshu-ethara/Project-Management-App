require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const memberRoutes = require('./routes/members');
const taskRoutes = require('./routes/tasks');
const taskActionRoutes = require('./routes/taskActions');
const dashboardRoutes = require('./routes/dashboard');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/members', memberRoutes);
app.use('/api/projects/:projectId/tasks', taskRoutes);
app.use('/api/tasks', taskActionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Serve React/Static Frontend ────────────────────────────────────────────────
const clientPath = path.join(__dirname, '..', 'client');
app.use(express.static(clientPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// ── Error Handler ──────────────────────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
