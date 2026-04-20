const express = require('express');
const router = express.Router();
const SensorData = require('../models/SensorData');
const { protect } = require('../middleware/auth');
const { generateRecommendations } = require('../utils/recommendationEngine');
const { analyzeSensorData } = require('../services/aiClient');

// ─── GET /api/recommendations ────────────────────────────
// Returns rule-based recommendations (always) + AI analysis (when available)
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

    // Rule-based recommendations (always available, zero latency, zero cost)
    const recommendations = generateRecommendations(latest);

    // AI-powered analysis (optional enhancement — non-blocking)
    let ai_analysis = null;
    try {
      const aiResult = await analyzeSensorData(latest);
      if (aiResult.success && aiResult.data) {
        ai_analysis = aiResult.data;
      }
    } catch {
      // AI analysis is optional — if it fails, rule-based recommendations still work
    }

    res.json({
      recommendations,
      ai_analysis,
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

// ─── POST /api/ai-analysis ───────────────────────────────
// Standalone AI sensor analysis endpoint (uses the agricultural decision engine)
router.post('/ai-analysis', protect, async (req, res) => {
  try {
    // Accept sensor data from request body or fetch latest from DB
    let sensorData = req.body;

    if (!sensorData || Object.keys(sensorData).length === 0) {
      const latest = await SensorData.findOne().sort({ timestamp: -1 }).lean();
      if (!latest) {
        return res.json({
          success: true,
          data: { status: 'insufficient_data' },
          message: 'No sensor data available.',
        });
      }
      sensorData = latest;
    }

    const result = await analyzeSensorData(sensorData);

    if (!result.success) {
      return res.status(503).json({
        success: false,
        data: null,
        error: result.error || 'AI analysis temporarily unavailable. Please try again in a moment.',
      });
    }

    res.json({
      success: true,
      data: result.data,
      error: null,
    });
  } catch (err) {
    console.error('[AI ANALYSIS ERROR]', err);
    res.status(500).json({
      success: false,
      data: null,
      error: 'AI analysis failed. Please try again.',
    });
  }
});

module.exports = router;

