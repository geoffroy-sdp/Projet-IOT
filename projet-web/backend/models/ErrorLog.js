const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ['error', 'warn', 'critical'],
      default: 'error',
    },
    message: {
      type: String,
      required: true,
    },
    stack: {
      type: String,
    },
    context: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    endpoint: {
      type: String,
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
    statusCode: {
      type: Number,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    additionalData: {
      type: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    collection: 'error_logs',
    timestamps: false,
  }
);

// Index pour les requêtes fréquentes
errorLogSchema.index({ timestamp: -1 });
errorLogSchema.index({ userId: 1, timestamp: -1 });
errorLogSchema.index({ level: 1, timestamp: -1 });

module.exports = mongoose.model('ErrorLog', errorLogSchema);
