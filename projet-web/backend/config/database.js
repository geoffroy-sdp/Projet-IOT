const mongoose = require('mongoose');
require('dotenv').config();

// Import des modèles de logs
const ErrorLog = require('../models/ErrorLog');
const SecurityLog = require('../models/SecurityLog');
const RequestLog = require('../models/RequestLog');
const Log = require('../models/Log');

const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('MongoDB connected successfully');
    
    // Créer les collections si elles n'existent pas
    try {
      await ErrorLog.collection.createIndex({ timestamp: -1 });
      await SecurityLog.collection.createIndex({ timestamp: -1 });
      await RequestLog.collection.createIndex({ timestamp: -1 });
      await Log.collection.createIndex({ timestamp: -1 });
      console.log('Log collections indices created successfully');
    } catch (indexError) {
      console.warn('Warning creating indices:', indexError.message);
    }

    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected successfully');
  } catch (error) {
    console.error('MongoDB disconnection error:', error.message);
    process.exit(1);
  }
};

// Fonction utilitaire pour enregistrer les erreurs
const logError = async (errorData) => {
  try {
    const errorLog = new ErrorLog(errorData);
    await errorLog.save();
    return errorLog;
  } catch (error) {
    console.error('Error saving error log:', error.message);
  }
};

// Fonction utilitaire pour enregistrer les événements de sécurité
const logSecurityEvent = async (securityData) => {
  try {
    const securityLog = new SecurityLog(securityData);
    await securityLog.save();
    return securityLog;
  } catch (error) {
    console.error('Error saving security log:', error.message);
  }
};

// Fonction utilitaire pour enregistrer les requêtes
const logRequest = async (requestData) => {
  try {
    const requestLog = new RequestLog(requestData);
    await requestLog.save();
    return requestLog;
  } catch (error) {
    console.error('Error saving request log:', error.message);
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
  // Modèles
  ErrorLog,
  SecurityLog,
  RequestLog,
  Log,
  // Fonctions utilitaires
  logError,
  logSecurityEvent,
  logRequest,
};
