require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

// Route imports
const authRoutes = require('./routes/auth');
const sensorRoutes = require('./routes/sensor');
const dashboardRoutes = require('./routes/dashboard');
const diseaseRoutes = require('./routes/disease');
const recommendationRoutes = require('./routes/recommendations');
const reportRoutes = require('./routes/reports');
const weatherRoutes = require('./routes/weather');

const app = express();
const server = http.createServer(app);

// ─── WebSocket Server ───────────────────────────────────
const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WS] Client connected. Total: ${clients.size}`);
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected. Total: ${clients.size}`);
  });
});

// Export broadcast so routes can use it
app.locals.broadcast = (event, data) => {
  const payload = JSON.stringify({ event, data, timestamp: new Date() });
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  });
};

// ─── Middleware ─────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [];
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.includes('vercel.app')) {
      callback(null, origin);
    } else {
      callback(null, true); // Fallback to allow during dev/deployment, restrict in strict prod
    }
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Sensor endpoint gets higher rate limit for IoT devices
const sensorLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
});
app.use('/api/sensor-data', sensorLimiter);

// ─── Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api', sensorRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', diseaseRoutes);
app.use('/api', recommendationRoutes);
app.use('/api', reportRoutes);
app.use('/api', weatherRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── Start ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🌱 PrithviCore Backend running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`🔗 http://localhost:${PORT}\n`);
  });
});
