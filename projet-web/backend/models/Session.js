const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    // Référence utilisateur
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Identifiants de session
    sessionId: {
      type: String,
      unique: true,
      required: true,
    },
    carPlaySessionId: {
      type: String,
      default: null,
    },

    // Dates de session
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number, // en secondes
      default: 0,
    },

    // Localisation lors de la session
    startLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    endLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    
    // Données CarPlay
    carPlayData: {
      isConnected: {
        type: Boolean,
        default: true,
      },
    },

    // Activités durant la session
    activities: [
      {
        type: {
          type: String,
          enum: ['music', 'navigation', 'call', 'app'],
        },
        timestamp: Date,
        details: mongoose.Schema.Types.Mixed, // flexible pour différents types d'activités
      },
    ],

    // Musique écoutée
    musicData: {
      tracks: [
        {
          trackName: String,
          artistName: String,
          albumName: String,
          duration: Number,
          playedAt: Date,
          playedDuration: Number, // temps écouté en secondes
        },
      ],
      totalTracksPlayed: Number,
    },

    // Données de navigation
    navigationData: {
      destination: String,
      distance: Number, // en km
      estimatedTime: Number, // en minutes
      routeType: String,
      waypointsCount: Number,
    },

    // État de la session
    status: {
      type: String,
      enum: ['active', 'paused', 'ended', 'interrupted'],
      default: 'active',
    },

    // Notes/commentaires
    notes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Middleware pour calculer la durée avant de sauvegarder
sessionSchema.pre('save', async function() {
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
});

module.exports = mongoose.model('Session', sessionSchema);
