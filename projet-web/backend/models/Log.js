const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ['debug', 'info', 'warn', 'error'],
      default: 'info',
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    context: {
      type: String,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    collection: 'logs',
    timestamps: false,
  }
);

// Index pour les requêtes fréquentes
logSchema.index({ timestamp: -1 });
logSchema.index({ level: 1, timestamp: -1 });

module.exports = mongoose.model('Log', logSchema);
