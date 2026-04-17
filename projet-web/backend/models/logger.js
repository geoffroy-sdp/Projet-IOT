const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Créer le dossier logs s'il n'existe pas
const LOGS_DIR = path.join(__dirname, '..', 'logs');
const ensureLogsDir = async () => {
  try {
    await fs.mkdir(LOGS_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error('Erreur lors de la création du dossier logs:', error);
    }
  }
};

// Fonction utilitaire pour formater les logs
const formatLogEntry = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const hostname = os.hostname();
  const pid = process.pid;

  return JSON.stringify({
    timestamp,
    level: level.toUpperCase(),
    message,
    hostname,
    pid,
    ...data
  }) + '\n';
};

// Fonction utilitaire pour écrire dans un fichier
const writeToFile = async (filename, content) => {
  try {
    await ensureLogsDir();
    const filePath = path.join(LOGS_DIR, filename);
    await fs.appendFile(filePath, content, 'utf8');
  } catch (error) {
    console.error(`Erreur lors de l'écriture dans ${filename}:`, error);
  }
};

// Logger principal
class Logger {
  constructor() {
    this.init();
  }

  async init() {
    await ensureLogsDir();
    console.log(' Système de logging initialisé');
  }

  // Log des erreurs
  async error(message, data = {}) {
    const logEntry = formatLogEntry('error', message, {
      ...data,
      stack: data.error?.stack
    });
    await writeToFile('error.log', logEntry);
    console.error(` ERROR: ${message}`, data);
  }

  // Log des requêtes HTTP
  async request(req, res, responseTime) {
    const logEntry = formatLogEntry('info', 'HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user?.userId || 'anonymous',
      timestamp: new Date().toISOString()
    });
    await writeToFile('requests.log', logEntry);
  }

  // Log des événements de sécurité
  async security(event, data = {}) {
    const logEntry = formatLogEntry('warn', `SECURITY: ${event}`, {
      ...data,
      ip: data.req?.ip || data.req?.connection?.remoteAddress,
      userAgent: data.req?.get('User-Agent'),
      userId: data.req?.user?.userId || 'anonymous',
      timestamp: new Date().toISOString()
    });
    await writeToFile('security.log', logEntry);
    console.warn(` SECURITY: ${event}`, data);
  }

  // Log général
  async info(message, data = {}) {
    const logEntry = formatLogEntry('info', message, data);
    await writeToFile('combined.log', logEntry);
  }

  // Log de debug
  async debug(message, data = {}) {
    if (process.env.NODE_ENV === 'development') {
      const logEntry = formatLogEntry('debug', message, data);
      await writeToFile('debug.log', logEntry);
      console.log(` DEBUG: ${message}`, data);
    }
  }

  // Log des warnings
  async warn(message, data = {}) {
    const logEntry = formatLogEntry('warn', message, data);
    await writeToFile('combined.log', logEntry);
    console.warn(` WARN: ${message}`, data);
  }
}

// Middleware Express pour logger les requêtes
const requestLogger = (logger) => {
  return (req, res, next) => {
    const start = Date.now();

    // Logger la requête quand elle arrive
    logger.info(`Incoming ${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Intercepter la fin de la réponse
    res.on('finish', () => {
      const responseTime = Date.now() - start;
      logger.request(req, res, responseTime);
    });

    next();
  };
};

// Fonction pour logger les erreurs non capturées
const setupGlobalErrorLogging = (logger) => {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString()
    });
  });
};

// Fonction pour nettoyer les anciens logs (garde les 30 derniers jours)
const cleanupOldLogs = async () => {
  try {
    const files = await fs.readdir(LOGS_DIR);
    const logFiles = files.filter(file => file.endsWith('.log'));

    for (const file of logFiles) {
      const filePath = path.join(LOGS_DIR, file);
      const stats = await fs.stat(filePath);

      // Supprimer les fichiers de plus de 30 jours
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      if (stats.mtime.getTime() < thirtyDaysAgo) {
        await fs.unlink(filePath);
        console.log(` Ancien log supprimé: ${file}`);
      }
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage des logs:', error);
  }
};

// Exporter une instance unique du logger
const logger = new Logger();

module.exports = {
  Logger,
  logger,
  requestLogger,
  setupGlobalErrorLogging,
  cleanupOldLogs
};