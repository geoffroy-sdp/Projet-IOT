const { recordRequest, extractRequestInfo } = require('./logHelpers');

/**
 * Middleware pour enregistrer les requêtes serveur
 * Doit être placé avant les autres routes
 */
const requestLogger = (req, res, next) => {
  // Capture le temps de début
  const startTime = Date.now();
  
  // Capture la fonction send d'origine
  const originalSend = res.send;

  // Remplace la fonction send pour capturer la réponse
  res.send = function (data) {
    const responseTime = Date.now() - startTime;
    const responseSize = data ? Buffer.byteLength(data) : 0;

    // Extrait les informations de la requête
    const requestInfo = extractRequestInfo(req);

    // Enregistre la requête
    recordRequest({
      ...requestInfo,
      statusCode: res.statusCode,
      responseTime,
      responseSize,
      userId: req.user ? req.user._id : null,
      username: req.user ? req.user.username : null,
      requestHeaders: req.headers,
      // Limiter la taille du body enregistré pour les requêtes POST/PUT
      requestBody: ['POST', 'PUT', 'PATCH'].includes(req.method) 
        ? typeof req.body === 'object' 
          ? JSON.stringify(req.body).substring(0, 5000) 
          : req.body 
        : null,
    }).catch(error => {
      console.error('Error logging request:', error.message);
    });

    // Appelle la fonction send d'origine
    return originalSend.call(this, data);
  };

  next();
};

module.exports = requestLogger;
