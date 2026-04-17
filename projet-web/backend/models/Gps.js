const mongoose = require('mongoose');

const gpsSchema = new mongoose.Schema(
  {
    // Référence utilisateur
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Référence session
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },

    // Coordonnées GPS
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },

    // Altitude
    altitude: {
      type: Number,
      default: null,
    },

    // Précision du signal
    accuracy: {
      type: Number, // en mètres
      default: null,
    },

    // Vitesse
    speed: {
      type: Number, // en km/h
      default: null,
    },

    // Orientation/cap
    heading: {
      type: Number, // en degrés (0-360)
      default: null,
    },

    // Données brutes du GPS
    rawData: {
      type: String, // String pour stocker les données brutes complètes
      default: null,
    },

    // Timestamp
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Source du positionnement
    source: {
      type: String,
      enum: ['gps', 'network', 'fused', 'manual'],
      default: 'gps',
    },

    // Informations supplémentaires
    provider: {
      type: String, // GPS, WiFi, cellular, etc.
      default: 'GPS',
    },

    // Qualité du signal
    signalQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good',
    },

    // Nombre de satellites utilisés
    satelliteCount: {
      type: Number,
      default: null,
    },

    // Créé à / Mis à jour à
  },
  { timestamps: true }
);

// Index pour optimiser les requêtes
gpsSchema.index({ userId: 1, timestamp: -1 });
gpsSchema.index({ sessionId: 1 });
gpsSchema.index({ timestamp: -1 });
gpsSchema.index({ latitude: 1, longitude: 1 });

module.exports = mongoose.model('Gps', gpsSchema);
