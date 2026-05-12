const { connectDatabase, disconnectDatabase, ErrorLog, SecurityLog, RequestLog } = require('./config/database');

async function runTest() {
  try {
    console.log('\n Connexion à MongoDB...\n');
    await connectDatabase();

    // Créer les données de test
    console.log(' Création des données de test...\n');
    
    await ErrorLog.create({
      level: 'error',
      message: 'Test error',
      endpoint: '/api/test',
      statusCode: 500,
      ipAddress: '127.0.0.1'
    });

    await SecurityLog.create({
      eventType: 'login',
      severity: 'low',
      username: 'testuser',
      ipAddress: '127.0.0.1',
      description: 'Test security event'
    });

    await RequestLog.create({
      method: 'GET',
      endpoint: '/api/test',
      statusCode: 200,
      ipAddress: '127.0.0.1',
      responseTime: 150
    });

    // Afficher les données créées
    console.log(' Données créées!\n');
    console.log(' ErrorLogs:', await ErrorLog.countDocuments());
    console.log(' SecurityLogs:', await SecurityLog.countDocuments());
    console.log(' RequestLogs:', await RequestLog.countDocuments());

    console.log('\n  Suppression des données...\n');
    
    // Supprimer les données
    await ErrorLog.deleteMany({});
    await SecurityLog.deleteMany({});
    await RequestLog.deleteMany({});

    console.log(' Données supprimées!\n');
    console.log(' ErrorLogs restants:', await ErrorLog.countDocuments());
    console.log(' SecurityLogs restants:', await SecurityLog.countDocuments());
    console.log(' RequestLogs restants:', await RequestLog.countDocuments());

    await disconnectDatabase();
    console.log('\nTest terminé!\n');
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

runTest();
