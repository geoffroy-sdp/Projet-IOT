const { logger } = require('./models/logger');
const { logSecurityEvent } = require('./middleware/security');

async function testLoggingSystem() {
  console.log('🧪 Test du système de logging...\n');

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
  logSecurityEvent('CUSTOM_TEST_EVENT', {
    test: true,
    customData: 'Additional security test data'
  });

  console.log('✅ Tests de logging terminés !');
  console.log('📁 Vérifiez les fichiers dans le dossier logs/');
}

// Exécuter le test si appelé directement
if (require.main === module) {
  testLoggingSystem().catch(console.error);
}

module.exports = { testLoggingSystem };