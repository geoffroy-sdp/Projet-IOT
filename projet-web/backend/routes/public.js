const express = require('express');
const router = express.Router();
const Gps = require('../models/Gps');

// Public endpoint to fetch recent GPS points (no auth)
// Query params: limit (default 500)
router.get('/gps', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '500', 10);
    const points = await Gps.find().sort({ timestamp: -1 }).limit(limit).select('-rawData -__v');
    // Return chronological order (oldest first)
    res.json({ success: true, data: points.reverse(), total: points.length });
  } catch (err) {
    console.error('public/gps error', err.message || err);
    res.status(500).json({ success: false, message: 'Erreur lecture points GPS' });
  }
});

module.exports = router;
