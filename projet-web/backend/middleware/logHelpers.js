const { logError, logSecurityEvent, logRequest } = require('../config/database');

/**
 * Enregistre une erreur dans la base de données
 * @param {Object} options - Options d'enregistrement
 */
exports.recordError = async (options = {}) => {
  const {
    message = 'Unknown error',
    level = 'error',
    stack = null,
    context = null,
    userId = null,
    endpoint = null,
    method = null,
    statusCode = 500,
    ipAddress = null,
    userAgent = null,
    additionalData = null,
  } = options;

  try {
    await logError({
      level,
      message,
      stack,
      context,
      userId,
      endpoint,
      method,
      statusCode,
      ipAddress,
      userAgent,
      additionalData,
    });
  } catch (error) {
    console.error('Failed to record error:', error.message);
  }
};

/**
 * Enregistre un événement de sécurité
 * @param {Object} options - Options d'enregistrement
 */
exports.recordSecurityEvent = async (options = {}) => {
  const {
    eventType = 'suspicious_activity',
    severity = 'medium',
    userId = null,
    username = null,
    ipAddress = null,
    endpoint = null,
    method = null,
    description = 'Security event',
    userAgent = null,
    location = { type: 'Point', coordinates: [0, 0] },
    additionalData = null,
    status = 'pending',
    notes = null,
  } = options;

  try {
    await logSecurityEvent({
      eventType,
      severity,
      userId,
      username,
      ipAddress,
      endpoint,
      method,
      description,
      userAgent,
      location,
      additionalData,
      status,
      notes,
    });
  } catch (error) {
    console.error('Failed to record security event:', error.message);
  }
};

/**
 * Enregistre une requête serveur
 * @param {Object} options - Options d'enregistrement
 */
exports.recordRequest = async (options = {}) => {
  const {
    method = 'GET',
    endpoint = '/',
    statusCode = 200,
    userId = null,
    username = null,
    ipAddress = null,
    userAgent = null,
    requestHeaders = null,
    requestBody = null,
    responseTime = 0,
    responseSize = 0,
    errorMessage = null,
    queryParams = null,
    pathParams = null,
    device = null,
    referer = null,
    protocol = 'https',
    hostname = 'localhost',
    port = 3000,
    additionalData = null,
  } = options;

  try {
    await logRequest({
      method,
      endpoint,
      statusCode,
      userId,
      username,
      ipAddress,
      userAgent,
      requestHeaders,
      requestBody,
      responseTime,
      responseSize,
      errorMessage,
      queryParams,
      pathParams,
      device,
      referer,
      protocol,
      hostname,
      port,
      additionalData,
    });
  } catch (error) {
    console.error('Failed to record request:', error.message);
  }
};

/**
 * Extrait les informations de la requête
 * @param {Object} req - Objet requête Express
 */
exports.extractRequestInfo = (req) => {
  return {
    method: req.method,
    endpoint: req.path,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    referer: req.get('referer'),
    protocol: req.protocol,
    hostname: req.hostname,
    port: req.socket.localPort,
    queryParams: req.query,
    pathParams: req.params,
  };
};
