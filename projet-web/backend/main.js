const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDatabase } = require('./config/database');
const { logger, requestLogger, setupGlobalErrorLogging, cleanupOldLogs } = require('./models/logger');
const { securityMiddleware, corsMiddleware, rateLimitMiddleware, securityLoggerMiddleware } = require('./middleware/security');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

const PORT = process.env.PORT || 3000;
const app = express();

// Initialiser le système de logging
setupGlobalErrorLogging(logger);

// Nettoyer les anciens logs au démarrage
cleanupOldLogs();

// Middlewares de sécurité et logging
app.use(securityMiddleware);
app.use(corsMiddleware);
app.use(rateLimitMiddleware);
app.use(securityLoggerMiddleware);

// Middlewares de base
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging des requêtes
app.use(requestLogger(logger));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Routes de logging (protégées)
app.get('/api/logs/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const allowedTypes = ['error', 'requests', 'security', 'combined', 'debug'];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type de log invalide. Types autorisés: error, requests, security, combined, debug'
      });
    }

    // Vérifier la clé admin pour accéder aux logs
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
      logger.security('UNAUTHORIZED_LOG_ACCESS', { req, type });
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé aux logs'
      });
    }

    const fs = require('fs').promises;
    const path = require('path');
    const logFile = path.join(__dirname, 'logs', `${type}.log`);

    try {
      const logContent = await fs.readFile(logFile, 'utf8');
      const lines = logContent.trim().split('\n').slice(-100); // Dernières 100 lignes

      res.status(200).json({
        success: true,
        data: {
          type,
          lines: lines.length,
          logs: lines.map(line => {
            try {
              return JSON.parse(line);
            } catch {
              return { raw: line };
            }
          })
        }
      });
    } catch (fileError) {
      res.status(404).json({
        success: false,
        message: `Fichier de log ${type}.log non trouvé`
      });
    }
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
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Logging system initialized`);
    console.log(`📊 Logs available at: /logs/{error|requests|security|combined|debug}`);
  });
}).catch(error => {
  logger.error('Failed to connect database', { error: error.message });
  console.error('Failed to connect database:', error);
  process.exit(1);
});