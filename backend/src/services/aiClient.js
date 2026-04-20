/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PrithviCore — External AI Client (OpenAI GPT-4o Vision)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * SETUP INSTRUCTIONS:
 * 1. Get an API key from https://platform.openai.com/api-keys
 * 2. Add to your .env file:
 *      OPENAI_API_KEY=sk-...your_key_here...
 * 3. That's it — no Python service, no PyTorch, no GPU needed.
 *
 * This module replaces the old ai-service/ Python microservice (FastAPI +
 * PyTorch ResNet50). All disease classes, treatment mappings, severity levels,
 * and confidence threshold logic are preserved VERBATIM from the original
 * ai-service/main.py.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const axios = require('axios');
const logger = require('../utils/logger');

// ── Disease classes (PlantVillage dataset labels) — copied from ai-service/main.py ──
const DISEASE_CLASSES = [
  'Apple___Apple_scab',
  'Apple___Black_rot',
  'Apple___Cedar_apple_rust',
  'Apple___healthy',
  'Blueberry___healthy',
  'Cherry___Powdery_mildew',
  'Cherry___healthy',
  'Corn___Cercospora_leaf_spot',
  'Corn___Common_rust',
  'Corn___Northern_Leaf_Blight',
  'Corn___healthy',
  'Grape___Black_rot',
  'Grape___Esca_(Black_Measles)',
  'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
  'Grape___healthy',
  'Orange___Haunglongbing_(Citrus_greening)',
  'Peach___Bacterial_spot',
  'Peach___healthy',
  'Pepper___Bacterial_spot',
  'Pepper___healthy',
  'Potato___Early_blight',
  'Potato___Late_blight',
  'Potato___healthy',
  'Raspberry___healthy',
  'Soybean___healthy',
  'Squash___Powdery_mildew',
  'Strawberry___Leaf_scorch',
  'Strawberry___healthy',
  'Tomato___Bacterial_spot',
  'Tomato___Early_blight',
  'Tomato___Late_blight',
  'Tomato___Leaf_Mold',
  'Tomato___Septoria_leaf_spot',
  'Tomato___Spider_mites',
  'Tomato___Target_Spot',
  'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
  'Tomato___Tomato_mosaic_virus',
  'Tomato___healthy',
];

// ── Treatment lookup — copied VERBATIM from ai-service/main.py ──────────────
const TREATMENTS = {
  'Apple___Apple_scab':                              { name: 'Apple Scab',                    treatment: 'Apply fungicide (captan or mancozeb). Remove infected leaves. Improve air circulation.',                                              severity: 'moderate' },
  'Apple___Black_rot':                               { name: 'Apple Black Rot',               treatment: 'Prune infected branches. Apply copper-based fungicide. Remove mummified fruits.',                                                     severity: 'high' },
  'Apple___Cedar_apple_rust':                        { name: 'Cedar Apple Rust',              treatment: 'Apply myclobutanil fungicide. Remove nearby cedar trees if possible.',                                                                 severity: 'moderate' },
  'Apple___healthy':                                 { name: 'Healthy',                       treatment: 'No treatment needed. Continue regular monitoring.',                                                                                    severity: 'none' },
  'Blueberry___healthy':                             { name: 'Healthy',                       treatment: 'No treatment needed. Continue regular monitoring.',                                                                                    severity: 'none' },
  'Cherry___Powdery_mildew':                         { name: 'Powdery Mildew',                treatment: 'Apply sulfur-based fungicide. Improve ventilation. Avoid overhead irrigation.',                                                        severity: 'moderate' },
  'Cherry___healthy':                                { name: 'Healthy',                       treatment: 'No treatment needed. Maintain good orchard hygiene.',                                                                                  severity: 'none' },
  'Corn___Cercospora_leaf_spot':                     { name: 'Cercospora Leaf Spot',          treatment: 'Apply strobilurin fungicide. Use resistant hybrids. Rotate crops.',                                                                     severity: 'moderate' },
  'Corn___Common_rust':                              { name: 'Common Rust',                   treatment: 'Apply triazole fungicide at early stages. Use rust-resistant varieties.',                                                               severity: 'moderate' },
  'Corn___Northern_Leaf_Blight':                     { name: 'Northern Leaf Blight',          treatment: 'Apply fungicide (azoxystrobin). Plant resistant varieties. Practice crop rotation.',                                                    severity: 'high' },
  'Corn___healthy':                                  { name: 'Healthy',                       treatment: 'No treatment needed. Keep monitoring.',                                                                                                severity: 'none' },
  'Grape___Black_rot':                               { name: 'Grape Black Rot',               treatment: 'Apply mancozeb or myclobutanil. Remove mummified berries. Prune for airflow.',                                                        severity: 'high' },
  'Grape___Esca_(Black_Measles)':                    { name: 'Esca (Black Measles)',          treatment: 'No chemical cure. Remove and destroy infected wood. Apply wound sealants.',                                                             severity: 'critical' },
  'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)':      { name: 'Grape Leaf Blight',             treatment: 'Apply copper fungicide. Remove infected leaves. Avoid leaf wetness.',                                                                   severity: 'moderate' },
  'Grape___healthy':                                 { name: 'Healthy',                       treatment: 'No treatment needed.',                                                                                                                 severity: 'none' },
  'Orange___Haunglongbing_(Citrus_greening)':        { name: 'Citrus Greening (HLB)',         treatment: 'No cure available. Remove infected trees. Control Asian citrus psyllid vector with insecticide.',                                       severity: 'critical' },
  'Peach___Bacterial_spot':                          { name: 'Peach Bacterial Spot',          treatment: 'Apply copper bactericide. Avoid wetting foliage. Use resistant varieties.',                                                              severity: 'moderate' },
  'Peach___healthy':                                 { name: 'Healthy',                       treatment: 'No treatment needed.',                                                                                                                 severity: 'none' },
  'Pepper___Bacterial_spot':                         { name: 'Pepper Bacterial Spot',         treatment: 'Apply copper hydroxide. Remove infected plants. Avoid overhead irrigation.',                                                            severity: 'moderate' },
  'Pepper___healthy':                                { name: 'Healthy',                       treatment: 'No treatment needed.',                                                                                                                 severity: 'none' },
  'Potato___Early_blight':                           { name: 'Potato Early Blight',           treatment: 'Apply chlorothalonil or mancozeb fungicide. Remove lower infected leaves. Improve drainage.',                                          severity: 'moderate' },
  'Potato___Late_blight':                            { name: 'Potato Late Blight',            treatment: 'Apply metalaxyl fungicide immediately. Destroy infected tissue. Do NOT compost.',                                                      severity: 'critical' },
  'Potato___healthy':                                { name: 'Healthy',                       treatment: 'No treatment needed.',                                                                                                                 severity: 'none' },
  'Raspberry___healthy':                             { name: 'Healthy',                       treatment: 'No treatment needed.',                                                                                                                 severity: 'none' },
  'Soybean___healthy':                               { name: 'Healthy',                       treatment: 'No treatment needed.',                                                                                                                 severity: 'none' },
  'Squash___Powdery_mildew':                         { name: 'Powdery Mildew',                treatment: 'Apply potassium bicarbonate or neem oil. Improve airflow. Avoid overhead watering.',                                                   severity: 'low' },
  'Strawberry___Leaf_scorch':                        { name: 'Strawberry Leaf Scorch',        treatment: 'Apply captan fungicide. Remove infected leaves. Avoid water stress.',                                                                   severity: 'moderate' },
  'Strawberry___healthy':                            { name: 'Healthy',                       treatment: 'No treatment needed.',                                                                                                                 severity: 'none' },
  'Tomato___Bacterial_spot':                         { name: 'Tomato Bacterial Spot',         treatment: 'Apply copper bactericide. Avoid working in wet fields. Use disease-free seeds.',                                                        severity: 'moderate' },
  'Tomato___Early_blight':                           { name: 'Tomato Early Blight',           treatment: 'Apply chlorothalonil or copper fungicide. Remove lower leaves. Mulch around base.',                                                    severity: 'moderate' },
  'Tomato___Late_blight':                            { name: 'Tomato Late Blight',            treatment: 'Apply metalaxyl or cymoxanil immediately. Remove all infected material. Avoid overhead irrigation.',                                   severity: 'critical' },
  'Tomato___Leaf_Mold':                              { name: 'Tomato Leaf Mold',              treatment: 'Apply mancozeb fungicide. Reduce humidity below 85%. Improve ventilation.',                                                             severity: 'moderate' },
  'Tomato___Septoria_leaf_spot':                     { name: 'Septoria Leaf Spot',            treatment: 'Apply chlorothalonil. Remove infected lower leaves. Avoid wetting foliage.',                                                            severity: 'moderate' },
  'Tomato___Spider_mites':                           { name: 'Spider Mites',                  treatment: 'Apply neem oil or abamectin miticide. Spray water on undersides of leaves. Introduce predatory mites.',                                severity: 'moderate' },
  'Tomato___Target_Spot':                            { name: 'Target Spot',                   treatment: 'Apply azoxystrobin fungicide. Remove infected leaves. Improve airflow.',                                                                severity: 'moderate' },
  'Tomato___Tomato_Yellow_Leaf_Curl_Virus':          { name: 'Tomato Yellow Leaf Curl Virus', treatment: 'No cure. Remove infected plants. Control whitefly vector with insecticide. Use resistant varieties.',                                  severity: 'critical' },
  'Tomato___Tomato_mosaic_virus':                    { name: 'Tomato Mosaic Virus',           treatment: 'No cure. Remove infected plants. Disinfect tools. Control aphid vectors.',                                                              severity: 'high' },
  'Tomato___healthy':                                { name: 'Healthy',                       treatment: 'No treatment needed. Continue regular monitoring.',                                                                                    severity: 'none' },
};

const DEFAULT_TREATMENT = { name: 'Unknown Disease', treatment: 'Consult local agricultural extension officer for diagnosis and treatment.', severity: 'moderate' };

// ── Confidence threshold — same as original ai-service/main.py ──────────────
const CONFIDENCE_THRESHOLD = 0.60;

// ── System prompt for OpenAI Vision — preserves all original logic ───────────
const SYSTEM_PROMPT = `You are a plant disease detection AI for the PrithviCore smart farming platform.

You analyze leaf images to identify plant diseases. You MUST respond ONLY with a valid JSON object — no markdown, no explanation, no extra text.

RULES:
1. Identify the disease from ONLY the following 38 PlantVillage classes:
${DISEASE_CLASSES.map((c, i) => `   ${i + 1}. ${c}`).join('\n')}

2. Return your response as a JSON object with EXACTLY these fields:
   - "disease_class": one of the 38 class names above (e.g. "Tomato___Early_blight")
   - "confidence": a float between 0.0 and 1.0 representing your confidence
   - "affected_area_percent": estimated percentage of visible leaf area affected (0.0 to 100.0)

3. If the image is not a plant leaf, is too blurry, or you cannot identify any disease pattern:
   - Set disease_class to the most likely healthy class for the visible plant
   - Set confidence to a LOW value (below 0.5)
   - Set affected_area_percent to 0.0

4. If the plant appears healthy:
   - Set disease_class to the appropriate "___healthy" class
   - Set confidence to your actual confidence level
   - Set affected_area_percent to 0.0

5. Be precise with confidence scores. Only use confidence > 0.85 when you are very certain.

RESPOND WITH ONLY THE JSON OBJECT. NO OTHER TEXT.`;


// ── Retry helper with exponential backoff ────────────────────────────────────
async function retryWithBackoff(fn, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err.response?.status;

      // Don't retry on client errors (except 429 rate limit)
      if (status && status >= 400 && status < 500 && status !== 429) {
        break;
      }

      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s → 2s → 4s
        logger.warn(`[AI CLIENT] Attempt ${attempt} failed (${err.message}). Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}


// ── Main diagnosis function ──────────────────────────────────────────────────
/**
 * Analyze a leaf image for plant diseases using OpenAI GPT-4o Vision.
 *
 * @param {Buffer} imageBuffer - Raw image bytes
 * @param {string} mimeType   - e.g. 'image/jpeg', 'image/png'
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 *
 * Response data shape (matches old ai-service PredictionResponse exactly):
 * {
 *   disease:               string,
 *   confidence:            number,
 *   severity:              string,
 *   treatment:             string,
 *   crop_type:             string,
 *   affected_area_percent: number|null,
 *   model_version:         string,
 *   processing_time_ms:    number,
 * }
 */
async function diagnoseDisease(imageBuffer, mimeType) {
  const startTime = Date.now();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    logger.error('[AI CLIENT] OPENAI_API_KEY is not set in environment variables');
    return {
      success: false,
      data: null,
      error: 'AI service is not configured. Please set OPENAI_API_KEY.',
    };
  }

  try {
    // Convert image to base64 for the OpenAI Vision API
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    logger.info(`[AI CLIENT] Sending image to OpenAI Vision (${(imageBuffer.length / 1024).toFixed(1)} KB, ${mimeType})`);

    const response = await retryWithBackoff(async () => {
      return axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Analyze this leaf image for plant diseases. Return ONLY the JSON object.' },
                { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
              ],
            },
          ],
          max_tokens: 300,
          temperature: 0.1, // Low temperature for deterministic classification
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30s timeout for vision models
        }
      );
    });

    // Parse the AI response
    const rawContent = response.data?.choices?.[0]?.message?.content?.trim();
    logger.info(`[AI CLIENT] Raw AI response: ${rawContent}`);

    if (!rawContent) {
      return {
        success: false,
        data: null,
        error: 'AI returned an empty response. Please try again.',
      };
    }

    // Extract JSON from the response (handle cases where AI wraps in markdown)
    let parsed;
    try {
      // Try direct parse first
      parsed = JSON.parse(rawContent);
    } catch {
      // Try extracting JSON from markdown code block
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try finding JSON object in the response
        const objectMatch = rawContent.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          parsed = JSON.parse(objectMatch[0]);
        } else {
          throw new Error('No valid JSON found in AI response');
        }
      }
    }

    const diseaseClass = parsed.disease_class || '';
    const confidence = Math.min(1.0, Math.max(0.0, parseFloat(parsed.confidence) || 0));
    const affectedAreaPercent = Math.min(100, Math.max(0, parseFloat(parsed.affected_area_percent) || 0));

    const processingTimeMs = Date.now() - startTime;

    // ── Confidence threshold: same as original ai-service/main.py ──────────
    if (confidence < CONFIDENCE_THRESHOLD) {
      const cropType = diseaseClass.split('___')[0] || 'Unknown';
      logger.info(`[AI CLIENT] Low confidence (${(confidence * 100).toFixed(1)}%) — returning no_disease_detected`);
      return {
        success: true,
        data: {
          disease: 'No Disease Detected',
          confidence,
          severity: 'none',
          treatment: 'Image quality may be too low or no recognizable disease pattern found. Ensure the leaf is clearly visible and try again with a closer photo.',
          crop_type: cropType,
          affected_area_percent: 0.0,
          model_version: 'openai-gpt4o-mini',
          processing_time_ms: processingTimeMs,
        },
      };
    }

    // ── Map to treatment — same lookup as original ai-service/main.py ──────
    const treatmentInfo = TREATMENTS[diseaseClass] || DEFAULT_TREATMENT;
    const cropType = diseaseClass.split('___')[0] || 'Unknown';

    logger.info(`[AI CLIENT] Prediction: ${treatmentInfo.name} | conf=${(confidence * 100).toFixed(1)}% | ${processingTimeMs}ms`);

    return {
      success: true,
      data: {
        disease: treatmentInfo.name,
        confidence,
        severity: treatmentInfo.severity,
        treatment: treatmentInfo.treatment,
        crop_type: cropType,
        affected_area_percent: affectedAreaPercent,
        model_version: 'openai-gpt4o-mini',
        processing_time_ms: processingTimeMs,
      },
    };
  } catch (err) {
    const processingTimeMs = Date.now() - startTime;
    const status = err.response?.status;
    const apiError = err.response?.data?.error?.message;

    // Log error without leaking API key
    logger.error('[AI CLIENT] Disease detection failed', {
      status,
      message: apiError || err.message,
      processingTimeMs,
    });

    // Map error to user-friendly message
    let userMessage;
    if (status === 401) {
      userMessage = 'AI service authentication failed. Please check the API key configuration.';
    } else if (status === 429) {
      userMessage = 'AI service rate limit exceeded. Please try again in a moment.';
    } else if (status === 413 || apiError?.includes('too large')) {
      userMessage = 'Image is too large for AI analysis. Please use a smaller image.';
    } else if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      userMessage = 'AI service timed out. Please try again.';
    } else {
      userMessage = 'AI service temporarily unavailable. Please try again in a moment.';
    }

    return {
      success: false,
      data: null,
      error: userMessage,
    };
  }
}


// ── Agricultural Decision Engine ─────────────────────────────────────────────
// AI-powered sensor analysis that provides structured farming decisions
// based on real-time IoT data.
// ─────────────────────────────────────────────────────────────────────────────

const SENSOR_ANALYSIS_PROMPT = `You are an agricultural decision engine embedded in an IoT system (PrithviCore).

STRICT RULES:
- Use ONLY the provided sensor data. Do not assume missing values.
- Output MUST be valid minified JSON (no markdown, no explanations).
- Keep responses extremely concise (total output <120 tokens).
- If inputs are within optimal range, return "status":"normal" and minimal advice.
- If any parameter is abnormal, include it in "alerts" with short reason.
- Prefer rule-based conclusions (thresholds) over long explanations.
- If data is insufficient, return {"status":"insufficient_data"}.

OUTPUT SCHEMA (exact keys, no extras):
{
  "status": "normal|warning|critical|insufficient_data",
  "irrigation": "on|off|monitor",
  "soil": {"moisture":"low|optimal|high","ph":"acidic|optimal|alkaline","npk":"low|optimal|high"},
  "actions": [],
  "alerts": [],
  "confidence": "low|medium|high"
}

DECISION GUIDELINES:
- Moisture: <30 low → irrigation:on; 30–70 optimal; >70 high → irrigation:off
- pH: <6 acidic; 6–7.5 optimal; >7.5 alkaline
- Temperature: >35 → stress risk
- Humidity: <30 → high evaporation risk
- NPK: nitrogen<50 OR phosphorus<25 OR potassium<30 → npk:low
- If 2+ issues → status:"critical"; 1 issue → "warning"; none → "normal"

RESPOND WITH ONLY THE JSON OBJECT. NO OTHER TEXT.`;


/**
 * Analyze sensor data using OpenAI to produce structured farming decisions.
 *
 * @param {Object} sensorData - Latest sensor reading
 * @param {number} sensorData.moisture     - Soil moisture (%)
 * @param {number} sensorData.temperature  - Temperature (°C)
 * @param {number} sensorData.humidity     - Air humidity (%)
 * @param {number} sensorData.ph           - Soil pH
 * @param {number} sensorData.nitrogen     - Nitrogen (mg/kg)
 * @param {number} sensorData.phosphorus   - Phosphorus (mg/kg)
 * @param {number} sensorData.potassium    - Potassium (mg/kg)
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
async function analyzeSensorData(sensorData) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    logger.error('[AI CLIENT] OPENAI_API_KEY is not set for sensor analysis');
    return { success: false, data: null, error: 'AI service is not configured.' };
  }

  // Validate we have at least some sensor data
  const fields = ['moisture', 'temperature', 'humidity', 'ph', 'nitrogen', 'phosphorus', 'potassium'];
  const available = fields.filter((f) => sensorData[f] != null);
  if (available.length === 0) {
    return {
      success: true,
      data: { status: 'insufficient_data' },
    };
  }

  // Build compact sensor payload — only include non-null values
  const sensorPayload = {};
  for (const f of fields) {
    if (sensorData[f] != null) sensorPayload[f] = sensorData[f];
  }

  try {
    logger.info(`[AI CLIENT] Sending sensor data to OpenAI for analysis: ${JSON.stringify(sensorPayload)}`);

    const response = await retryWithBackoff(async () => {
      return axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SENSOR_ANALYSIS_PROMPT },
            { role: 'user', content: JSON.stringify(sensorPayload) },
          ],
          max_tokens: 200,
          temperature: 0.0, // Fully deterministic for threshold-based decisions
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10s timeout — text-only, should be fast
        }
      );
    });

    const rawContent = response.data?.choices?.[0]?.message?.content?.trim();
    logger.info(`[AI CLIENT] Sensor analysis response: ${rawContent}`);

    if (!rawContent) {
      return { success: false, data: null, error: 'AI returned an empty response.' };
    }

    // Parse JSON (handle markdown wrapping)
    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        const objectMatch = rawContent.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          parsed = JSON.parse(objectMatch[0]);
        } else {
          throw new Error('No valid JSON in sensor analysis response');
        }
      }
    }

    return { success: true, data: parsed };
  } catch (err) {
    const status = err.response?.status;
    const apiError = err.response?.data?.error?.message;

    logger.error('[AI CLIENT] Sensor analysis failed', {
      status,
      message: apiError || err.message,
    });

    let userMessage;
    if (status === 401) {
      userMessage = 'AI service authentication failed.';
    } else if (status === 429) {
      userMessage = 'AI rate limit exceeded. Try again shortly.';
    } else if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      userMessage = 'AI analysis timed out.';
    } else {
      userMessage = 'AI analysis temporarily unavailable.';
    }

    return { success: false, data: null, error: userMessage };
  }
}

module.exports = { diagnoseDisease, analyzeSensorData, DISEASE_CLASSES, TREATMENTS };

