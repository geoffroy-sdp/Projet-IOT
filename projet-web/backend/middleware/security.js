const { logger } = require('../models/Logger');

const securityMiddleware = (req, res, next) => {
  // Amélioration des en-têtes de sécurité
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");

  // Masquer la version de Express
  res.removeHeader('X-Powered-By');

  next();
};

const corsMiddleware = (req, res, next) => {
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || 'http://localhost:5000,https://projet-iot-tau.vercel.app';
  const allowedOrigins = allowedOriginsEnv
    .split(',')
    .map(origin => origin.trim());
  const origin = req.headers.origin;

  // Vérifier si l'origine est autorisée
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Si pas d'origin (requête non-CORS), permettre quand même
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
};

const rateLimitMiddleware = (req, res, next) => {
  const maxRequests = 100;
  const windowMs = 15 * 60 * 1000; // 15 minutes

  const clientIp = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!global.requestLog) {
    global.requestLog = {};
  }

  if (!global.requestLog[clientIp]) {
    global.requestLog[clientIp] = [];
  }

  global.requestLog[clientIp] = global.requestLog[clientIp].filter(
    (timestamp) => now - timestamp < windowMs
  );

  if (global.requestLog[clientIp].length >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
    });
  }

  global.requestLog[clientIp].push(now);
  next();
};

const requestLoggingMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

// Middleware de sécurité avancé pour logger les événements suspects
const securityLoggerMiddleware = (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;

  // Intercepter les réponses pour logger les erreurs d'authentification
  res.send = function(data) {
    // Logger les tentatives de connexion échouées
    if (req.path.includes('/login') && res.statusCode === 401) {
      logger.security('FAILED_LOGIN_ATTEMPT', {
        req,
        email: req.body?.email,
        reason: 'Invalid credentials'
      });
    }

    // Logger les accès non autorisés
    if (res.statusCode === 401 || res.statusCode === 403) {
      logger.security('UNAUTHORIZED_ACCESS', {
        req,
        path: req.path,
        method: req.method,
        statusCode: res.statusCode
      });
    }

    // Logger les erreurs de validation
    if (res.statusCode === 400 && req.body) {
      logger.security('VALIDATION_ERROR', {
        req,
        body: req.body,
        errors: data?.errors || data
      });
    }

    return originalSend.call(this, data);
  };

  res.json = function(data) {
    // Logger les erreurs d'authentification JSON
    if (req.path.includes('/login') && res.statusCode === 401) {
      logger.security('FAILED_LOGIN_ATTEMPT', {
        req,
        email: req.body?.email,
        reason: data?.message || 'Invalid credentials'
      });
    }

    return originalJson.call(this, data);
  };

  // Logger les tentatives d'accès à des routes admin sans clé
  if (req.path.startsWith('/admin') && !req.headers['x-admin-key']) {
    logger.security('MISSING_ADMIN_KEY', {
      req,
      path: req.path
    });
  }

  // Logger les requêtes avec des tokens invalides
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const token = req.headers.authorization.substring(7);
    if (token.length < 10) { // Token suspect (trop court)
      logger.security('SUSPICIOUS_TOKEN', {
        req,
        tokenLength: token.length
      });
    }
  }

  // Logger les requêtes avec des payloads trop grands (possible attaque)
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > 1000000) { // 1MB
    logger.security('LARGE_PAYLOAD', {
      req,
      contentLength: req.headers['content-length']
    });
  }

  // Logger les requêtes répétées depuis la même IP (possible brute force)
  const clientIP = req.ip || req.connection.remoteAddress;
  if (clientIP) {
    const suspiciousIPs = process.env.SUSPICIOUS_IPS?.split(',') || [];
    if (suspiciousIPs.includes(clientIP)) {
      logger.security('SUSPICIOUS_IP_ACCESS', {
        req,
        ipAddress: clientIP
      });
    }
  }

  next();
};

// Fonctions utilitaires pour logger les événements de sécurité
const logSecurityEvent = (event, data) => {
  logger.security(event, data);
};

const logAuthSuccess = (req, user) => {
  logger.security('login', {
    userId: user._id,
    email: user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    endpoint: req.path
  });
};

const logLogout = (req, userId) => {
  logger.security('logout', {
    userId,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });
};

const logPasswordChange = (req, userId) => {
  logger.security('password_change', {
    userId,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });
};

module.exports = {
  securityMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
  requestLoggingMiddleware,
  securityLoggerMiddleware,
  logSecurityEvent,
  logAuthSuccess,
  logLogout,
  logPasswordChange,
};
