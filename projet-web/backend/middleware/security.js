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
  const allowedOrigins = (process.env.ALLOWED_ORIGINS).split(',');
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '3600');

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

module.exports = {
  securityMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
  requestLoggingMiddleware,
};
