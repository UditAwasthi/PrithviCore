# 🌱 AgriDrishti – Smart Farming System

A complete full-stack IoT farm monitoring platform with real-time sensor data, AI disease detection, weather integration, and automated recommendations.

---

## 🏗 Architecture Overview

```
┌─────────────┐     HTTP/WS      ┌──────────────────┐
│  Next.js    │◄────────────────►│  Node.js/Express  │
│  Frontend   │                  │  Backend API       │
│  (Vercel)   │                  │  (Render/AWS)      │
└─────────────┘                  └─────────┬──────────┘
                                           │
              ┌──────────────────┐         │ Mongoose
              │  Python FastAPI  │         ▼
              │  AI Microservice │◄──► MongoDB Atlas
              │  (Disease Det.)  │
              └──────────────────┘
                                           ▲
              ┌──────────────────┐         │ POST /api/sensor-data
              │  ESP32 + Sensors │─────────┘
              │  (IoT Hardware)  │
              └──────────────────┘
```

## 📁 Project Structure

```
agridrishti/
├── frontend/              ← Next.js 14 + TailwindCSS + Recharts
│   └── src/
│       ├── app/           ← Pages (dashboard, soil, disease, etc.)
│       ├── components/    ← Reusable React components
│       ├── lib/           ← API client, Auth context
│       └── hooks/         ← WebSocket hook
│
├── backend/               ← Node.js + Express REST API
│   └── src/
│       ├── routes/        ← API route handlers
│       ├── models/        ← Mongoose schemas
│       ├── middleware/     ← JWT auth, device auth
│       └── utils/         ← Recommendation engine
│
├── ai-service/            ← Python FastAPI disease detection
│   ├── main.py
│   └── requirements.txt
│
└── hardware/
    └── esp32_firmware.ino ← Arduino sketch for ESP32
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas account (free tier works)
- OpenWeatherMap API key (free)

---

### 1. Clone & Setup

```bash
git clone <your-repo>
cd agridrishti
```

---

### 2. Backend Setup

```bash
cd backend
npm install

# Copy and fill in environment variables
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, OpenWeather key
```

**`.env` values to fill:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/agridrishti
JWT_SECRET=your-32-character-secret-key-here
OPENWEATHER_API_KEY=your_openweathermap_key
AI_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

```bash
npm run dev
# Backend running at http://localhost:5000
```

---

### 3. AI Service Setup

```bash
cd ai-service
pip install -r requirements.txt

# Optional: Download PlantVillage-trained weights
# Place fine-tuned model as: ai-service/model_weights.pth
# Without weights, it uses pretrained ImageNet (less accurate for plants)

python main.py
# AI service running at http://localhost:8000
```

**To train/download proper weights:**
- Dataset: [PlantVillage on Kaggle](https://www.kaggle.com/datasets/emmarex/plantdisease)
- Train a ResNet50 on 38 disease classes, save as `model_weights.pth`

---

### 4. Frontend Setup

```bash
cd frontend
npm install

cp .env.local.example .env.local
# Edit if your backend runs on a different port
```

```bash
npm run dev
# Frontend at http://localhost:3000
```

---

### 5. Hardware (ESP32) Setup

1. Open `hardware/esp32_firmware.ino` in Arduino IDE
2. Install required libraries:
   - DHT sensor library by Adafruit
   - ArduinoJson by Benoit Blanchon
3. Edit the config section:
```cpp
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* API_URL  = "http://YOUR_SERVER_IP:5000/api/sensor-data";
const char* API_KEY  = "AGD-YOUR_DEVICE_KEY";
```
4. Connect sensors:
   - Soil Moisture → GPIO34
   - DHT22 → GPIO4
   - pH Sensor → GPIO35
   - NPK Sensor → GPIO16 (RX), GPIO17 (TX)
5. Flash to ESP32

> **Get your device API key:** Log in to the dashboard → Settings → IoT Device Configuration

---

## 🔌 API Reference

### Sensor Data (IoT Device)
```http
POST /api/sensor-data
Headers: x-api-key: AGD-YOUR_KEY
Content-Type: application/json

{
  "moisture": 45.2,
  "temperature": 28.5,
  "humidity": 65,
  "ph": 6.8,
  "nitrogen": 72,
  "phosphorus": 38,
  "potassium": 55
}
```

### Dashboard
```http
GET /api/dashboard
Authorization: Bearer <jwt_token>
```

### Soil History
```http
GET /api/soil/history?from=2024-01-01&to=2024-01-31&limit=100
Authorization: Bearer <jwt_token>
```

### Disease Detection
```http
POST /api/disease-detection
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
Body: image (file), crop_type (optional string)
```

### Recommendations
```http
GET /api/recommendations
Authorization: Bearer <jwt_token>
```

### Weather
```http
GET /api/weather?city=Delhi
Authorization: Bearer <jwt_token>
```

### Reports PDF
```http
GET /api/reports/download?type=weekly
Authorization: Bearer <jwt_token>
Response: PDF file
```

---

## 🤖 Recommendation Rules

| Condition               | Alert Level | Action                          |
|------------------------|-------------|----------------------------------|
| Moisture < 20%         | Critical    | Irrigate immediately             |
| Moisture < 35%         | High        | Schedule irrigation              |
| Moisture > 70%         | Medium      | Improve drainage                 |
| Temperature > 35°C     | High        | Apply shade nets                 |
| Temperature < 10°C     | High        | Frost protection                 |
| Nitrogen < 50 mg/kg    | High        | Apply urea/ammonium nitrate      |
| Phosphorus < 25 mg/kg  | Medium      | Apply DAP or superphosphate      |
| Potassium < 30 mg/kg   | Medium      | Apply MOP fertilizer             |
| pH < 5.5               | High        | Apply agricultural lime          |
| pH > 8.0               | High        | Apply sulfur/acidifying agents   |
| Humidity > 85%         | Medium      | Apply preventive fungicide       |

---

## ☁️ Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel --prod

# Set env vars in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://your-backend.render.com
# NEXT_PUBLIC_WS_URL=wss://your-backend.render.com
```

### Backend → Render
1. Create a new Web Service on Render
2. Connect your GitHub repo, set root directory to `backend/`
3. Build command: `npm install`
4. Start command: `node src/server.js`
5. Add all environment variables from `.env.example`

### AI Service → Render or Railway
1. New service, root: `ai-service/`
2. Build: `pip install -r requirements.txt`
3. Start: `uvicorn main:app --host 0.0.0.0 --port 8000`

### Database → MongoDB Atlas
1. Create free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create database user
3. Whitelist IP (0.0.0.0/0 for cloud deployments)
4. Copy connection string to `MONGODB_URI`

---

## 🔒 Security Notes

- JWT tokens expire in 7 days (configurable via `JWT_EXPIRES_IN`)
- IoT device keys must start with `AGD-` prefix
- Rate limiting: 300 req/15min general, 60 req/min for sensor endpoint
- CORS is configured to allow only `FRONTEND_URL`
- Helmet.js headers enabled on all routes
- Passwords are bcrypt hashed (12 rounds)

---

## 📊 Database Collections

### `users`
Stores farmer accounts with farm location and preferences.

### `sensordata`
Time-series collection with MongoDB native time-series support for efficient queries. Indexed on `device_id + timestamp`.

### `diseaseresults`
Stores AI disease detection results linked to user accounts.

---

## 🛠 Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | Next.js 14, TypeScript, TailwindCSS, Recharts, React Query |
| Backend     | Node.js, Express, Mongoose, WebSocket (ws) |
| Database    | MongoDB Atlas (Time-Series)       |
| AI Service  | Python, FastAPI, PyTorch, ResNet50 |
| Hardware    | ESP32, Arduino, DHT22, NPK sensor, pH sensor |
| Auth        | JWT (jsonwebtoken), bcryptjs      |
| Weather     | OpenWeatherMap API                |
| PDF         | pdfkit                            |
| Deploy      | Vercel + Render + MongoDB Atlas   |

---

## 📄 License

MIT — Free to use for personal and commercial projects.

---

*Built with ❤️ for Indian farmers — AgriDrishti Smart Farming System*
