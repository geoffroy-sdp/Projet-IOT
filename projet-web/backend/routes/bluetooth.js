const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Bluetooth = require('../models/Bluetooth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const devices = await Bluetooth.find({ userId: req.user.userId }).sort({ connectedAt: -1 });
    res.status(200).json({ success: true, data: devices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { deviceName, macAddress, deviceType } = req.body;
    const device = new Bluetooth({
      userId: req.user.userId,
      deviceName,
      macAddress,
      deviceType: deviceType || 'phone',
      connectedAt: new Date()
    });
    await device.save();
    res.status(201).json({ success: true, data: device });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Bluetooth.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    res.status(200).json({ success: true, message: 'Appareil supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;