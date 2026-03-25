# 🌱 PrithviCore — AI-Powered Smart Farming Platform

A production-ready, full-stack IoT farm monitoring platform featuring **real-time soil analytics**, **AI-powered plant disease detection**, **weather integration**, and **automated agronomic recommendations** — built for Indian farmers.

---

## 📐 Architecture

```
                         https://prithvicore.com
                                  │
                           ┌──────▼──────┐
                           │   Vercel    │
                           │  (Next.js)  │
                           └──┬──────┬───┘
                     /api/*   │      │  /ai/*
               ┌──────────────▼┐   ┌─▼───────────────┐
               │  Express API  │   │  FastAPI AI Svc  │
               │   (Render)    │──►│    (Render)      │
               └───────┬───────┘   └─────────────────┘
                       │  Mongoose        ▲ JWT forwarded
                ┌──────▼──────┐           │
                │  MongoDB    │     ┌─────┴──────┐
                │   Atlas     │     │  ESP32 IoT │
                └─────────────┘     │  Sensors   │
                                    └────────────┘
```

All backend and AI service URLs are **hidden** from end-users via Vercel rewrite proxying. Users only interact with `prithvicore.com`.

---

## 📁 Project Structure

```
PrithviCore/
├── frontend/                 ← Next.js 15 · React 18 · TailwindCSS · TypeScript
│   ├── src/app/              ← 9 pages (dashboard, soil, disease, reports…)
│   ├── src/components/       ← Reusable UI (Cards, Buttons, Charts, Layout)
│   ├── src/lib/              ← API client, AuthContext, utilities
│   ├── src/hooks/            ← WebSocket hook
│   ├── vercel.json           ← Proxy rewrite rules (/api/*, /ai/*)
│   └── next.config.js        ← Security headers, env config
│
├── backend/                  ← Node.js · Express · Mongoose
│   ├── src/routes/           ← 7 route modules (auth, sensor, dashboard…)
│   ├── src/models/           ← 4 Mongoose schemas (User, SensorData, Disease, OTP)
│   ├── src/middleware/       ← JWT auth, device API key auth
│   ├── src/utils/            ← Recommendation engine, helpers
│   └── src/server.js         ← Express app with full middleware stack
│
├── ai-service/               ← Python · FastAPI · PyTorch
│   ├── main.py               ← ResNet50 disease classifier + JWT auth + rate limiter
│   ├── requirements.txt
│   └── Dockerfile
│
├── hardware/
│   └── esp32_firmware.ino    ← ESP32 Arduino firmware (7 sensors)
│
└── docker-compose.yml        ← Local development with all 4 services
```

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15.1 | SSR, file routing, image optimization, security headers |
| React | 18.2 | Component-based UI with hooks |
| TypeScript | 5.7 | Type safety across the codebase |
| TailwindCSS | 3.4 | Utility-first styling with dark mode |
| Recharts | 2.13 | Interactive soil analytics charts |
| Framer Motion | 12.x | Premium micro-animations |
| Axios | 1.7 | HTTP client with JWT interceptors |
| React Query | 3.39 | Data fetching, caching, background refetch |
| react-dropzone | 14.3 | Drag-and-drop leaf image upload |
| next-themes | 0.4 | Persistent light/dark mode toggle |
| country-state-city | 3.2 | Cascading India state → city dropdowns |
| @react-oauth/google | 0.13 | Google One-Tap sign-in |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Express | 4.18 | REST API framework |
| Mongoose | 8.0 | MongoDB ODM with schema validation |
| jsonwebtoken | 9.0 | Stateless JWT authentication |
| bcryptjs | 2.4 | Password hashing (12 salt rounds) |
| helmet | 7.1 | HTTP security headers |
| express-rate-limit | 7.1 | Brute-force protection (100 req/15min) |
| express-mongo-sanitize | 2.2 | NoSQL injection prevention |
| xss-clean | 0.1 | XSS protection middleware |
| express-validator | 7.0 | Declarative input validation |
| multer | 1.4 | Multipart file upload parsing |
| ws | 8.16 | WebSocket server for real-time alerts |
| pdfkit | 0.14 | Server-side PDF report generation |
| google-auth-library | 10.6 | Google ID token verification |
| cors | 2.8 | Cross-origin whitelisting |
| morgan | 1.10 | HTTP request logging |

### AI Service
| Technology | Version | Purpose |
|-----------|---------|---------|
| FastAPI | 0.109 | Async Python API with auto-docs |
| PyTorch | ≥2.1 | Deep learning inference engine |
| torchvision | ≥0.16 | ResNet50 model + image transforms |
| Pillow | ≥10.2 | Image preprocessing |
| NumPy | ≥1.26 | Array computation for affected area |
| PyJWT | 2.x | JWT token verification |
| slowapi | — | IP-based rate limiting (10/min) |
| uvicorn | 0.27 | Production ASGI server |

### Hardware
| Component | Purpose |
|-----------|---------|
| ESP32 | WiFi-enabled microcontroller |
| DHT22 | Temperature + humidity sensor |
| Soil Moisture Sensor | Capacitive moisture % |
| pH Probe + ADC | Soil acidity measurement |
| NPK Sensor (RS-485) | Nitrogen, Phosphorus, Potassium via Modbus RTU |

### Infrastructure
| Service | Platform | Why |
|---------|----------|-----|
| Frontend | Vercel | Native Next.js CDN, auto-SSL, Git deploys |
| Backend API | Render | Free tier, managed HTTPS, auto-deploy |
| AI Service | Render | Isolated heavy PyTorch workload |
| Database | MongoDB Atlas | Free 512MB, managed backups, global |
| Domain | prithvicore.com | Unified via Vercel rewrites |

---


##### Vercel setup (Google Login)
If you deploy to Vercel and want “Sign in with Google” to work, set the following in your Vercel project:
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = `your-google-client-id.apps.googleusercontent.com`

Without this variable, the UI will render the Google sign-in option as disabled.

#### 4. Hardware (Optional)
1. Open `hardware/esp32_firmware.ino` in **Arduino IDE**
2. Install libraries: `DHT sensor library` (Adafruit), `ArduinoJson` (Blanchon)
3. Configure WiFi credentials and backend URL
4. Wire sensors: Moisture→GPIO34, DHT22→GPIO4, pH→GPIO35, NPK→GPIO16/17
5. Flash to ESP32

---
## 🧠 AI Disease Detection

### Model
- **Architecture:** ResNet50 (50-layer residual network, pre-trained on ImageNet)
- **Fine-tuning Dataset:** [PlantVillage](https://www.kaggle.com/datasets/emmarex/plantdisease) — 54,000+ images
- **Classes:** 38 diseases across 14 crop types
- **Input:** 224×224 RGB image, normalized (mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])

### Supported Crops & Diseases (38 classes)
| Crop | Diseases Detected |
|------|-------------------|
| Apple | Apple Scab, Black Rot, Cedar Apple Rust, Healthy |
| Cherry | Powdery Mildew, Healthy |
| Corn | Cercospora Leaf Spot, Common Rust, Northern Leaf Blight, Healthy |
| Grape | Black Rot, Esca, Leaf Blight, Healthy |
| Orange | Citrus Greening (HLB) |
| Peach | Bacterial Spot, Healthy |
| Pepper | Bacterial Spot, Healthy |
| Potato | Early Blight, Late Blight, Healthy |
| Strawberry | Leaf Scorch, Healthy |
| Tomato | Bacterial Spot, Early Blight, Late Blight, Leaf Mold, Septoria, Spider Mites, Target Spot, YLCV, Mosaic Virus, Healthy |

---

## 📡 Recommendation Engine

Automated farming recommendations are generated by analyzing real-time sensor data against agronomic thresholds:

| Condition | Severity | Recommendation |
|-----------|----------|---------------|
| Moisture < 20% | 🔴 Critical | Irrigate immediately |
| Moisture < 35% | 🟠 High | Schedule irrigation within 24h |
| Moisture > 70% | 🟡 Medium | Improve drainage |
| Temperature > 35°C | 🟠 High | Deploy shade nets |
| Temperature < 10°C | 🟠 High | Apply frost protection |
| pH < 5.5 | 🟠 High | Apply agricultural lime |
| pH > 8.0 | 🟠 High | Apply sulfur compounds |
| Nitrogen < 50 mg/kg | 🟠 High | Apply urea/ammonium nitrate |
| Phosphorus < 25 mg/kg | 🟡 Medium | Apply DAP/superphosphate |
| Potassium < 30 mg/kg | 🟡 Medium | Apply MOP fertilizer |
| Humidity > 85% | 🟡 Medium | Apply preventive fungicide |

<<<<<<< HEAD
---

## 🔒 Security

### Frontend (Next.js)
- `Strict-Transport-Security` (HSTS) — enforces HTTPS for 2 years
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME-sniffing
- `X-XSS-Protection: 1; mode=block` — browser XSS filter
- `Referrer-Policy: strict-origin-when-cross-origin`

### Backend (Express)
- **Helmet** — 11+ security headers in one middleware
- **CORS** — whitelists only `prithvicore.com`, `www.prithvicore.com`, and localhost
- **Rate Limiting** — 100 requests per 15 minutes per IP
- **express-mongo-sanitize** — strips MongoDB `$` and `.` operators from inputs
- **xss-clean** — removes malicious HTML/JS from request bodies
- **bcryptjs** — passwords hashed with 12 salt rounds
- **JWT** — tokens expire in 7 days, verified on every protected route
- **express-validator** — input validation on signup, login, OTP routes

### AI Service (FastAPI)
- **JWT Verification** — shared `JWT_SECRET` with backend, rejects unauthorized requests
- **Rate Limiting** — 10 predictions per minute per IP via slowapi
- **CORS** — restricted to same domain whitelist

### IoT Device
- **API Key Authentication** — devices must send `x-api-key: AGD-*` header
- **Input Validation** — all 7 sensor fields are validated server-side

---

## ☁️ Production Deployment

### 1. Deploy Backend to Render
1. Create **Web Service** → connect GitHub repo → root: `backend/`
2. Build: `npm install` | Start: `node src/server.js`
3. Set environment variables:
   - `MONGODB_URI`, `JWT_SECRET`, `AI_SERVICE_URL`, `FRONTEND_URL`, `GOOGLE_CLIENT_ID`

### 2. Deploy AI Service to Render
1. Create **Web Service** → root: `ai-service/`
2. Build: `pip install -r requirements.txt` | Start: `uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}`
3. Set: `JWT_SECRET` (same value as backend)

### 3. Deploy Frontend to Vercel
1. Import GitHub repo → framework: **Next.js**
2. Set environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend.onrender.com`
   - `NEXT_PUBLIC_AI_URL` = `https://your-ai-service.onrender.com`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_OWM_KEY`
3. `vercel.json` is auto-detected for proxy rewrites

### 4. Connect Custom Domain
1. In Vercel → Settings → Domains → add `prithvicore.com`
2. Add DNS records from Vercel to your domain registrar
3. SSL certificates are provisioned automatically

---

## 🧪 Testing

```bash
# Backend
cd backend && npm test

# Frontend type-check
cd frontend && npx tsc --noEmit

# AI Service health check
curl http://localhost:8000/health
```

---

## 📊 Database Schema

### `users` Collection
```json
{
  "name": "string",
  "email": "string (unique, lowercase)",
  "password": "string (bcrypt, select: false)",
  "googleId": "string (optional, sparse unique)",
  "phone": "string",
  "isPhoneVerified": "boolean",
  "farm_location": { "city": "string", "state": "string", "country": "string" },
  "farm_size_acres": "number",
  "crop_types": ["string"],
  "plan": "free | kisan_basic | kisan_pro",
  "is_active": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### `sensordata` Collection
```json
{
  "device_id": "string",
  "moisture": "number (%)",
  "temperature": "number (°C)",
  "humidity": "number (%)",
  "ph": "number (0-14)",
  "nitrogen": "number (mg/kg)",
  "phosphorus": "number (mg/kg)",
  "potassium": "number (mg/kg)",
  "battery_level": "number",
  "signal_strength": "number",
  "timestamp": "Date"
}
```

### `diseaseresults` Collection
```json
{
  "user": "ObjectId (ref: User)",
  "original_filename": "string",
  "disease_name": "string",
  "confidence": "number (0-1)",
  "severity": "none | low | moderate | high | critical",
  "treatment": "string",
  "affected_area_percent": "number",
  "crop_type": "string",
  "ai_model_version": "string",
  "timestamp": "Date"
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — free for personal and commercial use.

---

=======
>>>>>>> f7745a58b406d7a4538d8e74fcac71d1e5793590
## 👨‍💻 Author

**Sunil Maurya** — [GitHub](https://github.com/SunilMaurya-18)

---

<p align="center">
  Built with ❤️ for Indian farmers — <strong>PrithviCore Smart Farming System</strong>
</p>
