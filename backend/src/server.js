require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const logger = require('./utils/logger');
const connectDB = require('./config/database');

// Route imports
const authRoutes = require('./routes/auth');
const sensorRoutes = require('./routes/sensor');
const dashboardRoutes = require('./routes/dashboard');
const diseaseRoutes = require('./routes/disease');
const recommendationRoutes = require('./routes/recommendations');
const reportRoutes = require('./routes/reports');
const weatherRoutes = require('./routes/weather');
const feedbackRoutes = require('./routes/feedback');

const app = express();
const server = http.createServer(app);

// ─── WebSocket Server ───────────────────────────────────
const wss = new WebSocket.Server({ server });
const clients = new Set();

// Ping interval to keep connections alive (prevents Render timeout)
const PING_INTERVAL = 25000; // 25 seconds
let pingInterval;

// Heartbeat function to ping all clients
function heartbeat() {
  clients.forEach(client => {
    if (client.isAlive === false) {
      clients.delete(client);
      return client.terminate();
    }
    client.isAlive = false;
    client.ping();
  });
}

// Start heartbeat when server starts
function startHeartbeat() {
  pingInterval = setInterval(heartbeat, PING_INTERVAL);
}

// Stop heartbeat on server shutdown
function stopHeartbeat() {
  if (pingInterval) clearInterval(pingInterval);
}

wss.on('connection', (ws, req) => {
  clients.add(ws);
  ws.isAlive = true;
  
  // Log connection details
  const clientIp = req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'unknown';
  logger.info(`[WS] Client connected. IP: ${clientIp}, UA: ${userAgent.substring(0, 50)}... Total: ${clients.size}`);

  // Handle pong response from client
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      logger.info(`[WS] Received: ${data.event || 'unknown event'}`);
      
      // Handle ping from client
      if (data.event === 'ping') {
        ws.send(JSON.stringify({ event: 'pong', timestamp: new Date() }));
      }
    } catch (err) {
      logger.warn(`[WS] Failed to parse message: ${err.message}`);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    logger.info(`[WS] Client disconnected. Total: ${clients.size}`);
  });

  ws.on('error', (err) => {
    logger.error(`[WS] Error: ${err.message}`);
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
    const allowedOrigins = [
      'https://prithvicore.com',
      'https://www.prithvicore.com',
      ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [])
    ];
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Always allow localhost in development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return callback(null, true);
    // Allow Vercel preview deployments
    if (origin.includes('.vercel.app')) return callback(null, true);
    // Allow explicit allowlist
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In production: reject unknown origins. In dev: allow (for tools like Postman).
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(morgan('dev', {
  stream: { write: (message) => logger.info(message.trim()) }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

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
app.use('/api', feedbackRoutes);

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
  logger.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── Start ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📡 WebSocket server initialized (ping interval: ${PING_INTERVAL}ms)`);
    logger.info(`✨ Mode: ${process.env.NODE_ENV || 'development'}`);
    startHeartbeat();
  });
}).catch((err) => {
  logger.error('❌ Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  stopHeartbeat();
  clients.forEach(client => client.terminate());
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  stopHeartbeat();
  clients.forEach(client => client.terminate());
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
