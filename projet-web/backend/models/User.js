const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // Informations de base
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },

    // Authentification
    password: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Informations CarPlay
    carPlayDeviceId: {
      type: String,
      default: null,
    },

    // Tokens
    refreshToken: {
      type: String,
      default: null,
    },

    // Timestamps
    lastLogin: {
      type: Date,
      default: null,
    },
    lastConnectionTime: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);