const { logError, logSecurityEvent, logRequest } = require('../config/database');
const Log = require('./Log');

/**
 * Logger principal - Utilise MongoDB pour persister les logs
 */
class Logger {
  constructor() {
    this.init();
  }

  async init() {
    console.log('Système de logging MongoDB initialisé');
  }

  /**
   * Log des erreurs - Sauvegardé dans ErrorLog collection
   */
  async error(message, data = {}) {
    try {
      await logError({
        level: 'error',
        message,
        stack: data.error?.stack || data.stack,
        context: data.context,
        userId: data.userId,
        endpoint: data.endpoint,
        method: data.method,
        statusCode: data.statusCode,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        additionalData: data,
      });
    } catch (error) {
      console.error(`Erreur lors de l'enregistrement du log d'erreur:`, error.message);
    }
    console.error(`ERROR: ${message}`, data);
  }

  /**
   * Log des requêtes HTTP - Sauvegardé dans RequestLog collection
   */
  async request(req, res, responseTime) {
    try {
      await logRequest({
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: res.statusCode,
        userId: req.user?.userId || req.user?._id,
        username: req.user?.username,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        requestHeaders: req.headers,
        responseTime,
        additionalData: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la requête:', error.message);
    }
  }

  /**
   * Log des événements de sécurité - Sauvegardé dans SecurityLog collection
   */
  async security(event, data = {}) {
    try {
      // Extraire les informations de req si présent
      const req = data.req;
      const ipAddress = data.ipAddress || req?.ip || req?.connection?.remoteAddress;
      const userAgent = data.userAgent || req?.get?.('User-Agent');
      const userId = data.userId || req?.user?._id || req?.user?.userId;
      const username = data.username || req?.user?.username;
      const endpoint = data.endpoint || req?.originalUrl || req?.path;
      const method = data.method || req?.method;

      // Créer un objet additionalData sans la clé 'req' pour éviter les problèmes de circular references
      const { req: _req, ...additionalData } = data;

      await logSecurityEvent({
        eventType: data.eventType || event,
        severity: data.severity || 'medium',
        userId,
        username,
        ipAddress,
        endpoint,
        method,
        description: event,
        userAgent,
        additionalData,
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du log de sécurité:', error.message);
    }
    console.warn(`SECURITY: ${event}`, data);
  }

  /**
   * Log général (info) - Sauvegardé dans Log collection
   */
  async info(message, data = {}) {
    try {
      const log = new Log({
        level: 'info',
        message,
        data,
      });
      await log.save();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du log info:', error.message);
    }
  }

  /**
   * Log de debug - Sauvegardé uniquement en développement dans Log collection
   */
  async debug(message, data = {}) {
    if (process.env.NODE_ENV === 'development') {
      try {
        const log = new Log({
          level: 'debug',
          message,
          data,
        });
        await log.save();
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement du log debug:', error.message);
      }
      console.log(`DEBUG: ${message}`, data);
    }
  }

  /**
   * Log des warnings - Sauvegardé dans Log collection
   */
  async warn(message, data = {}) {
    try {
      const log = new Log({
        level: 'warn',
        message,
        data,
      });
      await log.save();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du log warn:', error.message);
    }
    console.warn(`WARN: ${message}`, data);
  }
}

/**
 * Middleware Express pour logger les requêtes
 */
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

/**
 * Fonction pour logger les erreurs non capturées au niveau du processus
 */
const setupGlobalErrorLogging = (logger) => {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { 
      error: error.message, 
      stack: error.stack,
      context: 'Global Error Handler'
    });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString(),
      context: 'Global Rejection Handler'
    });
  });
};

/**
 * Fonction pour nettoyer les anciens logs de MongoDB (garde les 30 derniers jours)
 */
const cleanupOldLogs = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    
    // Nettoyer les logs généraux
    const result1 = await Log.deleteMany({ timestamp: { $lt: thirtyDaysAgo } });
    console.log(`${result1.deletedCount} anciens logs généraux supprimés`);
  } catch (error) {
    console.error('Erreur lors du nettoyage des logs:', error.message);
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