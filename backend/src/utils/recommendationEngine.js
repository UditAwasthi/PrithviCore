/**
 * Rule-based Farm Recommendation Engine
 * Generates actionable suggestions based on sensor data
 */

const RECOMMENDATION_RULES = [
  // ── Moisture ─────────────────────────────────────────
  {
    id: 'irr_critical',
    check: (d) => d.moisture < 20,
    priority: 'critical',
    category: 'Irrigation',
    icon: '💧',
    title: 'Critical: Immediate Irrigation Required',
    message: `Soil moisture is critically low at ${'{moisture}'}%. Plants may be experiencing severe water stress. Irrigate immediately.`,
    action: 'Start drip/sprinkler irrigation now',
  },
  {
    id: 'irr_low',
    check: (d) => d.moisture >= 20 && d.moisture < 35,
    priority: 'high',
    category: 'Irrigation',
    icon: '🚿',
    title: 'Irrigation Needed Soon',
    message: `Soil moisture is ${'{moisture}'}%. Schedule irrigation within the next 12–24 hours.`,
    action: 'Plan irrigation for tomorrow morning',
  },
  {
    id: 'irr_optimal',
    check: (d) => d.moisture >= 35 && d.moisture <= 70,
    priority: 'info',
    category: 'Irrigation',
    icon: '✅',
    title: 'Soil Moisture is Optimal',
    message: `Soil moisture at ${'{moisture}'}% — ideal range for most crops. No irrigation needed.`,
    action: 'Monitor moisture levels daily',
  },
  {
    id: 'irr_high',
    check: (d) => d.moisture > 70,
    priority: 'medium',
    category: 'Irrigation',
    icon: '⚠️',
    title: 'Soil Waterlogging Risk',
    message: `Soil moisture is ${'{moisture}'}%, which is too high. Risk of root rot and anaerobic conditions.`,
    action: 'Improve drainage, pause irrigation',
  },

  // ── Temperature ───────────────────────────────────────
  {
    id: 'temp_heat',
    check: (d) => d.temperature > 35,
    priority: 'high',
    category: 'Temperature',
    icon: '🌡️',
    title: 'Heat Stress Alert',
    message: `Temperature is ${'{temperature}'}°C — above the safe threshold for most crops. Heat stress can reduce yield.`,
    action: 'Apply shade nets, increase watering frequency',
  },
  {
    id: 'temp_cold',
    check: (d) => d.temperature < 10,
    priority: 'high',
    category: 'Temperature',
    icon: '❄️',
    title: 'Frost Risk Alert',
    message: `Temperature is ${'{temperature}'}°C. Risk of frost damage to crops.`,
    action: 'Cover sensitive crops, use frost protection mulch',
  },
  {
    id: 'temp_optimal',
    check: (d) => d.temperature >= 20 && d.temperature <= 30,
    priority: 'info',
    category: 'Temperature',
    icon: '🌿',
    title: 'Ideal Growing Temperature',
    message: `Temperature at ${'{temperature}'}°C is optimal for crop growth.`,
    action: 'Maintain current conditions',
  },

  // ── Nitrogen ──────────────────────────────────────────
  {
    id: 'n_low',
    check: (d) => d.nitrogen < 50,
    priority: 'high',
    category: 'Fertilizer',
    icon: '🌱',
    title: 'Low Nitrogen — Apply Fertilizer',
    message: `Nitrogen level is ${'{nitrogen}'} mg/kg — below optimal. Crops may show yellowing (chlorosis) and stunted growth.`,
    action: 'Apply urea or ammonium nitrate at 30 kg/acre',
  },
  {
    id: 'n_high',
    check: (d) => d.nitrogen > 150,
    priority: 'medium',
    category: 'Fertilizer',
    icon: '⚠️',
    title: 'High Nitrogen Levels',
    message: `Nitrogen at ${'{nitrogen}'} mg/kg is excessive. Risk of leaf burn and groundwater contamination.`,
    action: 'Pause nitrogen fertilization for 2 weeks',
  },

  // ── Phosphorus ────────────────────────────────────────
  {
    id: 'p_low',
    check: (d) => d.phosphorus < 25,
    priority: 'medium',
    category: 'Fertilizer',
    icon: '🌾',
    title: 'Low Phosphorus Detected',
    message: `Phosphorus is ${'{phosphorus}'} mg/kg. This affects root development and flowering.`,
    action: 'Apply DAP (Di-ammonium Phosphate) or superphosphate',
  },

  // ── Potassium ─────────────────────────────────────────
  {
    id: 'k_low',
    check: (d) => d.potassium < 30,
    priority: 'medium',
    category: 'Fertilizer',
    icon: '🍂',
    title: 'Low Potassium Levels',
    message: `Potassium at ${'{potassium}'} mg/kg is low. Crops may show brown leaf margins and poor fruit quality.`,
    action: 'Apply muriate of potash (MOP) or SOP fertilizer',
  },

  // ── pH ────────────────────────────────────────────────
  {
    id: 'ph_acidic',
    check: (d) => d.ph < 5.5,
    priority: 'high',
    category: 'Soil pH',
    icon: '🧪',
    title: 'Soil is Too Acidic',
    message: `Soil pH is ${'{ph}'} — too acidic. Nutrient availability is severely reduced below pH 5.5.`,
    action: 'Apply agricultural lime (calcium carbonate) to raise pH',
  },
  {
    id: 'ph_alkaline',
    check: (d) => d.ph > 8.0,
    priority: 'high',
    category: 'Soil pH',
    icon: '🧪',
    title: 'Soil is Too Alkaline',
    message: `Soil pH is ${'{ph}'} — too alkaline. Iron, manganese, and zinc become unavailable.`,
    action: 'Apply elemental sulfur or acidifying fertilizers',
  },
  {
    id: 'ph_optimal',
    check: (d) => d.ph >= 6.0 && d.ph <= 7.0,
    priority: 'info',
    category: 'Soil pH',
    icon: '✅',
    title: 'Optimal Soil pH',
    message: `Soil pH of ${'{ph}'} is ideal for most crops. Nutrients are readily available.`,
    action: 'Maintain current soil management practices',
  },

  // ── Humidity ──────────────────────────────────────────
  {
    id: 'hum_high',
    check: (d) => d.humidity > 85,
    priority: 'medium',
    category: 'Disease Risk',
    icon: '🍄',
    title: 'High Humidity — Fungal Disease Risk',
    message: `Humidity at ${'{humidity}'}% creates conditions favorable for fungal diseases like blight and mildew.`,
    action: 'Apply preventive fungicide, improve air circulation',
  },
];

/**
 * Generate recommendations from sensor data
 * @param {Object} sensorData - Latest sensor reading
 * @returns {Array} Array of recommendation objects
 */
const generateRecommendations = (sensorData) => {
  const results = [];

  for (const rule of RECOMMENDATION_RULES) {
    if (rule.check(sensorData)) {
      // Fill in dynamic values
      const message = rule.message
        .replace('{moisture}',    sensorData.moisture?.toFixed(1))
        .replace('{temperature}', sensorData.temperature?.toFixed(1))
        .replace('{humidity}',    sensorData.humidity?.toFixed(1))
        .replace('{ph}',          sensorData.ph?.toFixed(2))
        .replace('{nitrogen}',    sensorData.nitrogen?.toFixed(0))
        .replace('{phosphorus}',  sensorData.phosphorus?.toFixed(0))
        .replace('{potassium}',   sensorData.potassium?.toFixed(0));

      results.push({
        id:       rule.id,
        priority: rule.priority,
        category: rule.category,
        icon:     rule.icon,
        title:    rule.title,
        message,
        action:   rule.action,
        timestamp: new Date(),
      });
    }
  }

  // Sort by priority: critical > high > medium > low > info
  const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  results.sort((a, b) => (order[a.priority] ?? 5) - (order[b.priority] ?? 5));

  return results;
};

module.exports = { generateRecommendations };
