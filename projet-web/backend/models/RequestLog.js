const mongoose = require('mongoose');

const requestLogSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      index: true,
    },
    statusCode: {
      type: Number,
      required: true,
      index: true,
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
    userAgent: {
      type: String,
    },
    requestHeaders: {
      type: mongoose.Schema.Types.Mixed,
    },
    requestBody: {
      type: mongoose.Schema.Types.Mixed,
    },
    responseTime: {
      type: Number, // en millisecondes
      default: 0,
    },
    responseSize: {
      type: Number, // en bytes
      default: 0,
    },
    errorMessage: {
      type: String,
    },
    queryParams: {
      type: mongoose.Schema.Types.Mixed,
    },
    pathParams: {
      type: mongoose.Schema.Types.Mixed,
    },
    device: {
      type: String, // mobile, desktop, tablet, etc.
    },
    referer: {
      type: String,
    },
    protocol: {
      type: String, // http, https
    },
    hostname: {
      type: String,
    },
    port: {
      type: Number,
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
    collection: 'request_logs',
    timestamps: false,
  }
);

// Index pour les requêtes fréquentes
requestLogSchema.index({ timestamp: -1 });
requestLogSchema.index({ userId: 1, timestamp: -1 });
requestLogSchema.index({ endpoint: 1, timestamp: -1 });
requestLogSchema.index({ ipAddress: 1, timestamp: -1 });
requestLogSchema.index({ statusCode: 1, timestamp: -1 });
requestLogSchema.index({ method: 1, endpoint: 1, timestamp: -1 });

// Index pour les performances
requestLogSchema.index({ responseTime: -1 });

module.exports = mongoose.model('RequestLog', requestLogSchema);
