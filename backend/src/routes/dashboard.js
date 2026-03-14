const express = require('express');
const router = express.Router();
const SensorData = require('../models/SensorData');
const DiseaseResult = require('../models/DiseaseResult');
const { protect } = require('../middleware/auth');
const { generateRecommendations } = require('../utils/recommendationEngine');

// ─── GET /api/dashboard ─────────────────────────────────
router.get('/dashboard', protect, async (req, res) => {
  try {
    // Latest sensor reading
    const latestSensor = await SensorData
      .findOne()
      .sort({ timestamp: -1 })
      .lean();

    // 24h stats
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [stats24h, hourlyTrend, latestDisease, totalReadings] = await Promise.all([
      SensorData.aggregate([
        { $match: { timestamp: { $gte: since24h } } },
        {
          $group: {
            _id: null,
            avg_moisture: { $avg: '$moisture' },
            avg_temperature: { $avg: '$temperature' },
            avg_humidity: { $avg: '$humidity' },
            avg_ph: { $avg: '$ph' },
            avg_nitrogen: { $avg: '$nitrogen' },
            avg_phosphorus: { $avg: '$phosphorus' },
            avg_potassium: { $avg: '$potassium' },
            readings: { $sum: 1 },
          },
        },
      ]),

      // Hourly trend for sparklines (last 24 readings)
      SensorData
        .find({ timestamp: { $gte: since24h } })
        .sort({ timestamp: 1 })
        .select('moisture temperature ph humidity timestamp')
        .limit(24)
        .lean(),

      // Latest disease result
      DiseaseResult
        .findOne({ user: req.user._id })
        .sort({ timestamp: -1 })
        .lean(),

      SensorData.countDocuments(),
    ]);

    // 7-day daily aggregation for charts
    const weeklyTrend = await SensorData.aggregate([
      { $match: { timestamp: { $gte: since7d } } },
      {
        $group: {
          _id: {
            year:  { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day:   { $dayOfMonth: '$timestamp' },
          },
          moisture:    { $avg: '$moisture' },
          temperature: { $avg: '$temperature' },
          humidity:    { $avg: '$humidity' },
          ph:          { $avg: '$ph' },
          nitrogen:    { $avg: '$nitrogen' },
          phosphorus:  { $avg: '$phosphorus' },
          potassium:   { $avg: '$potassium' },
          date:        { $first: '$timestamp' },
        },
      },
      { $sort: { date: 1 } },
    ]);

    const recommendations = latestSensor
      ? generateRecommendations(latestSensor)
      : [];

    res.json({
      latest_reading: latestSensor,
      stats_24h:      stats24h[0] || null,
      hourly_trend:   hourlyTrend,
      weekly_trend:   weeklyTrend,
      latest_disease: latestDisease,
      recommendations,
      total_readings: totalReadings,
    });
  } catch (err) {
    console.error('[DASHBOARD ERROR]', err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

module.exports = router;
