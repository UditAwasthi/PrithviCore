const express = require('express');
const router = express.Router();
const SensorData = require('../models/SensorData');
const { protect, deviceAuth } = require('../middleware/auth');

// ─── POST /api/sensor-data ───────────────────────────────
// Called by ESP32/Arduino IoT devices
router.post('/sensor-data', deviceAuth, async (req, res) => {
  try {
    const {
      moisture, temperature, humidity, ph,
      nitrogen, phosphorus, potassium,
      battery_level, signal_strength, location,
    } = req.body;

    // Basic validation
    if ([moisture, temperature, humidity, ph, nitrogen, phosphorus, potassium]
        .some(v => v === undefined || v === null || isNaN(v))) {
      return res.status(400).json({ error: 'Missing or invalid sensor fields' });
    }

    const data = await SensorData.create({
      device_id: req.device_id,
      moisture: parseFloat(moisture),
      temperature: parseFloat(temperature),
      humidity: parseFloat(humidity),
      ph: parseFloat(ph),
      nitrogen: parseFloat(nitrogen),
      phosphorus: parseFloat(phosphorus),
      potassium: parseFloat(potassium),
      battery_level: battery_level ? parseFloat(battery_level) : undefined,
      signal_strength: signal_strength ? parseFloat(signal_strength) : undefined,
      location,
      timestamp: new Date(),
    });

    // Broadcast to connected WebSocket clients
    req.app.locals.broadcast('sensor_update', data);

    res.status(201).json({ message: 'Data received', id: data._id });
  } catch (err) {
    console.error('[SENSOR POST ERROR]', err);
    res.status(500).json({ error: 'Failed to save sensor data' });
  }
});

// ─── GET /api/soil/history ───────────────────────────────
router.get('/soil/history', protect, async (req, res) => {
  try {
    const { from, to, limit = 100, device_id } = req.query;

    const filter = {};
    if (device_id) filter.device_id = device_id;

    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    } else {
      // Default: last 7 days
      filter.timestamp = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    }

    const history = await SensorData
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(Math.min(parseInt(limit), 500))
      .lean();

    // Aggregate daily averages
    const dailyAverages = await SensorData.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
          },
          avg_moisture: { $avg: '$moisture' },
          avg_temperature: { $avg: '$temperature' },
          avg_humidity: { $avg: '$humidity' },
          avg_ph: { $avg: '$ph' },
          avg_nitrogen: { $avg: '$nitrogen' },
          avg_phosphorus: { $avg: '$phosphorus' },
          avg_potassium: { $avg: '$potassium' },
          count: { $sum: 1 },
          date: { $first: '$timestamp' },
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.json({
      readings: history,
      daily_averages: dailyAverages,
      count: history.length,
    });
  } catch (err) {
    console.error('[SOIL HISTORY ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch soil history' });
  }
});

// ─── GET /api/soil/latest ────────────────────────────────
router.get('/soil/latest', protect, async (req, res) => {
  try {
    const { device_id } = req.query;
    const filter = device_id ? { device_id } : {};

    const latest = await SensorData
      .findOne(filter)
      .sort({ timestamp: -1 })
      .lean();

    if (!latest) {
      return res.status(404).json({ error: 'No sensor data found' });
    }

    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch latest data' });
  }
});

// ─── GET /api/sensor/stats ───────────────────────────────
router.get('/sensor/stats', protect, async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h
    const stats = await SensorData.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: null,
          avg_moisture: { $avg: '$moisture' },
          min_moisture: { $min: '$moisture' },
          max_moisture: { $max: '$moisture' },
          avg_temperature: { $avg: '$temperature' },
          min_temperature: { $min: '$temperature' },
          max_temperature: { $max: '$temperature' },
          avg_ph: { $avg: '$ph' },
          avg_nitrogen: { $avg: '$nitrogen' },
          avg_phosphorus: { $avg: '$phosphorus' },
          avg_potassium: { $avg: '$potassium' },
          readings_count: { $sum: 1 },
        },
      },
    ]);

    res.json(stats[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute stats' });
  }
});

module.exports = router;
