const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const DiseaseResult = require('../models/DiseaseResult');
const { protect } = require('../middleware/auth');

// Multer in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// ─── POST /api/disease-detection ────────────────────────
router.post('/disease-detection', protect, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Image file is required' });
  }

  try {
    // Forward image to Python AI microservice
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    let aiResult;
    try {
      const aiResponse = await axios.post(
        `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/predict`,
        form,
        {
          headers: { ...form.getHeaders() },
          timeout: 30000,
        }
      );
      aiResult = aiResponse.data;
    } catch (aiErr) {
      console.error('[AI SERVICE ERROR]', aiErr.message);
      return res.status(503).json({
        error: 'AI service unavailable. Please ensure the AI microservice is running.',
      });
    }

    // Save result to database
    const result = await DiseaseResult.create({
      user: req.user._id,
      original_filename: req.file.originalname,
      disease_name:       aiResult.disease,
      confidence:         aiResult.confidence,
      severity:           aiResult.severity || 'moderate',
      treatment:          aiResult.treatment,
      affected_area_percent: aiResult.affected_area_percent,
      crop_type:          req.body.crop_type || 'unknown',
      ai_model_version:   aiResult.model_version || '1.0.0',
    });

    // Broadcast alert if disease detected
    if (aiResult.disease !== 'Healthy') {
      req.app.locals.broadcast('disease_alert', {
        disease: aiResult.disease,
        confidence: aiResult.confidence,
        severity: aiResult.severity,
      });
    }

    res.json({
      id:           result._id,
      disease:      aiResult.disease,
      confidence:   aiResult.confidence,
      severity:     aiResult.severity,
      treatment:    aiResult.treatment,
      affected_area_percent: aiResult.affected_area_percent,
      timestamp:    result.timestamp,
    });
  } catch (err) {
    console.error('[DISEASE DETECTION ERROR]', err);
    res.status(500).json({ error: 'Disease detection failed' });
  }
});

// ─── GET /api/disease-history ────────────────────────────
router.get('/disease-history', protect, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [results, total] = await Promise.all([
      DiseaseResult
        .find({ user: req.user._id })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      DiseaseResult.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      results,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch disease history' });
  }
});

module.exports = router;
