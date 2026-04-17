const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: [
        'login',
        'logout',
        'failed_login',
        'permission_denied',
        'unauthorized_access',
        'token_created',
        'token_revoked',
        'suspicious_activity',
        'password_change',
        'account_locked',
        'ip_blocked',
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    username: {
      type: String,
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
    description: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    additionalData: {
      type: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending',
    },
    notes: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    collection: 'security_logs',
    timestamps: false,
  }
);

// Index géospatial pour les coordonnées
securityLogSchema.index({ 'location.coordinates': '2dsphere' });

// Index pour les requêtes fréquentes
securityLogSchema.index({ timestamp: -1 });
securityLogSchema.index({ userId: 1, timestamp: -1 });
securityLogSchema.index({ ipAddress: 1, timestamp: -1 });
securityLogSchema.index({ eventType: 1, timestamp: -1 });
securityLogSchema.index({ severity: 1, timestamp: -1 });

module.exports = mongoose.model('SecurityLog', securityLogSchema);
