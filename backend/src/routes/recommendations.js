const express = require('express');
const router = express.Router();
const SensorData = require('../models/SensorData');
const { protect } = require('../middleware/auth');
const { generateRecommendations } = require('../utils/recommendationEngine');

// ─── GET /api/recommendations ────────────────────────────
router.get('/recommendations', protect, async (req, res) => {
  try {
    const latest = await SensorData.findOne().sort({ timestamp: -1 }).lean();

    if (!latest) {
      return res.json({
        recommendations: [],
        message: 'No sensor data available. Connect your IoT device to receive recommendations.',
        last_updated: null,
      });
    }

    const recommendations = generateRecommendations(latest);

    res.json({
      recommendations,
      sensor_snapshot: {
        moisture:    latest.moisture,
        temperature: latest.temperature,
        humidity:    latest.humidity,
        ph:          latest.ph,
        nitrogen:    latest.nitrogen,
        phosphorus:  latest.phosphorus,
        potassium:   latest.potassium,
      },
      last_updated: latest.timestamp,
      total: recommendations.length,
      critical_count: recommendations.filter(r => r.priority === 'critical').length,
      high_count:     recommendations.filter(r => r.priority === 'high').length,
    });
  } catch (err) {
    console.error('[RECOMMENDATIONS ERROR]', err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

module.exports = router;
