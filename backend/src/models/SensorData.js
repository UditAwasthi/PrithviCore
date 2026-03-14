const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  device_id: {
    type: String,
    required: true,
    index: true,
  },
  moisture: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  temperature: {
    type: Number,
    required: true,
    min: -20,
    max: 60,
  },
  humidity: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  ph: {
    type: Number,
    required: true,
    min: 0,
    max: 14,
  },
  nitrogen: {
    type: Number,
    required: true,
    min: 0,
  },
  phosphorus: {
    type: Number,
    required: true,
    min: 0,
  },
  potassium: {
    type: Number,
    required: true,
    min: 0,
  },
  battery_level: {
    type: Number,
    min: 0,
    max: 100,
  },
  signal_strength: {
    type: Number,
  },
  location: {
    lat: Number,
    lon: Number,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timeseries: {
    timeField: 'timestamp',
    metaField: 'device_id',
    granularity: 'minutes',
  },
});

// Compound index for efficient queries
sensorDataSchema.index({ device_id: 1, timestamp: -1 });
sensorDataSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model('SensorData', sensorDataSchema);
