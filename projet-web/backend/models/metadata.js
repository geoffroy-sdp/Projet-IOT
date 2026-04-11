const mongoose = require('mongoose');

const metadataSchema = new mongoose.Schema(
  {
    // Référence utilisateur
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // Dernière musique
    lastMusic: {
      trackName: String,
      artistName: String,
      albumName: String,
      playedAt: Date,
      duration: Number,
    },

    // Historique musique (dernières 50 tracks)
    musicHistory: [
      {
        trackName: String,
        artistName: String,
        albumName: String,
        playedAt: Date,
        duration: Number,
      },
    ],

    // Dernière position GPS
    lastLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
      timestamp: Date,
    },

    // Dernière connexion
    lastConnectionTime: {
      type: Date,
      default: null,
    },

    // Durée totale de la dernière session
    lastSessionDuration: {
      type: Number, // en secondes
      default: 0,
    },

    // Statistiques d'utilisation
    stats: {
      totalSessionsCount: {
        type: Number,
        default: 0,
      },
      totalDrivingTime: {
        type: Number, // en secondes
        default: 0,
      },
      totalTracksListened: {
        type: Number,
        default: 0,
      },
      averageSessionDuration: {
        type: Number, // en secondes
        default: 0,
      },    
    },

    // Informations CarPlay
    carPlayInfo: {
      connectedDevices: [
        {
          deviceName: String,
          deviceType: String,
          lastConnectedAt: Date,
        },
      ],
    },

    // Dernière activité
    lastActivityType: {
      type: String,
      enum: ['music', 'navigation', 'call', 'app', 'idle'],
      default: 'idle',
    },
    lastActivityTime: Date,

    // Synchronisation
    lastSyncTime: {
      type: Date,
      default: null,
    },
    syncStatus: {
      type: String,
      enum: ['synced', 'pending', 'failed'],
      default: 'synced',
    },
  },
  { timestamps: true }
);

// Index pour optimiser les requêtes
metadataSchema.index({ userId: 1 });
metadataSchema.index({ lastConnectionTime: -1 });
metadataSchema.index({ 'musicHistory.playedAt': -1 });

module.exports = mongoose.model('Metadata', metadataSchema);
