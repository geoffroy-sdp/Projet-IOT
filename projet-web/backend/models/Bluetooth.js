const mongoose = require('mongoose');

const bluetoothSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deviceName: { type: String, required: true },
  macAddress: { type: String, required: true },
  deviceType: { type: String, default: 'phone' },
  connectedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Bluetooth', bluetoothSchema);