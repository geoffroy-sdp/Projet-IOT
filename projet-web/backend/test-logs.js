const { logger } = require('./models/Logger');
const { logSecurityEvent } = require('./config/database');

async function testLoggingSystem() {
  console.log('Test du système de logging MongoDB...\n');

  // Test des différents types de logs
  await logger.error('Test error logging', {
    error: 'This is a test error',
    code: 'TEST_ERROR'
  });

  await logger.security('TEST_SECURITY_EVENT', {
    test: true,
    message: 'Security logging test'
  });

  await logger.info('Test info logging', {
    test: true,
    data: { key: 'value' }
  });

  await logger.warn('Test warning logging', {
    test: true,
    warning: 'This is a test warning'
  });

  await logger.debug('Test debug logging', {
    test: true,
    debug: 'This is a test debug message'
  });

  // Test de l'événement de sécurité personnalisé
  await logSecurityEvent({
    eventType: 'suspicious_activity',
    severity: 'medium',
    description: 'Custom test security event',
    ipAddress: '127.0.0.1',
    additionalData: { test: true, customData: 'Additional security test data' }
  });

  console.log('Tests de logging terminés !');
  console.log(' Les logs sont maintenant sauvegardés dans MongoDB');
}

// Exécuter le test si appelé directement
if (require.main === module) {
  testLoggingSystem().catch(console.error);
}

module.exports = { testLoggingSystem };