const mongoose = require('mongoose');

const diseaseResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  image_url: {
    type: String,
  },
  image_data: {
    type: String, // base64 fallback for small images
  },
  original_filename: {
    type: String,
  },
  disease_name: {
    type: String,
    required: true,
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  severity: {
    type: String,
    enum: ['none', 'low', 'moderate', 'high', 'critical'],
    default: 'low',
  },
  treatment: {
    type: String,
    required: true,
  },
  affected_area_percent: {
    type: Number,
    min: 0,
    max: 100,
  },
  crop_type: {
    type: String,
  },
  ai_model_version: {
    type: String,
    default: '1.0.0',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('DiseaseResult', diseaseResultSchema);
