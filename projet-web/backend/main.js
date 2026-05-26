const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDatabase, ErrorLog, SecurityLog, RequestLog, Log } = require('./config/database');
const { logger, requestLogger, setupGlobalErrorLogging, cleanupOldLogs } = require('./models/Logger');
const { securityMiddleware, corsMiddleware, rateLimitMiddleware, securityLoggerMiddleware } = require('./middleware/security');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const bluetoothRoutes = require('./routes/bluetooth'); // ← AJOUT

const PORT = process.env.PORT || 3000;
const app = express();

setupGlobalErrorLogging(logger);
cleanupOldLogs();

app.use(securityMiddleware);
app.use(corsMiddleware);
app.use(rateLimitMiddleware);
app.use(securityLoggerMiddleware);

// Configure express CORS properly
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || 'http://localhost:5000,https://projet-iot-tau.vercel.app';
    
    // If ALLOWED_ORIGINS is '*', allow all origins
    if (allowedOriginsEnv === '*') {
      callback(null, true);
    } else {
      const allowedOrigins = allowedOriginsEnv.split(',').map(o => o.trim());
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow anyway for safety
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger(logger));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bluetooth', bluetoothRoutes); // ← AJOUT

// Routes de logging (protégées)
app.get('/api/logs/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 100 } = req.query;
    const allowedTypes = ['error', 'requests', 'security', 'info', 'debug'];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type de log invalide. Types autorisés: error, requests, security, info, debug'
      });
    }

    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
      logger.security('UNAUTHORIZED_LOG_ACCESS', {
        req,
        type,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé aux logs'
      });
    }

    let logs = [];
    switch(type) {
      case 'error':
        logs = await ErrorLog.find().sort({ timestamp: -1 }).limit(parseInt(limit));
        break;
      case 'requests':
        logs = await RequestLog.find().sort({ timestamp: -1 }).limit(parseInt(limit));
        break;
      case 'security':
        logs = await SecurityLog.find().sort({ timestamp: -1 }).limit(parseInt(limit));
        break;
      case 'info':
      case 'debug':
        logs = await Log.find({ level: type }).sort({ timestamp: -1 }).limit(parseInt(limit));
        break;
    }

    res.status(200).json({
      success: true,
      data: { type, count: logs.length, logs }
    });
  } catch (error) {
    logger.error('Erreur lors de la lecture des logs', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la lecture des logs'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Gestionnaire d'erreurs global
app.use((error, req, res, next) => {
  logger.error('Erreur non gérée', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
});

connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Logging system initialized with MongoDB`);
  });
}).catch(error => {
  logger.error('Failed to connect database', { error: error.message });
  console.error('Failed to connect database:', error);
  process.exit(1);
});