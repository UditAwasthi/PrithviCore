/*
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  PrithviCore IoT Firmware  –  ESP32 + Sensors               ║
 * ║                                                              ║
 * ║  Sensors:                                                    ║
 * ║    • Soil Moisture  → Analog pin GPIO34                      ║
 * ║    • DHT22 (Temp/Hum) → GPIO4                               ║
 * ║    • pH Sensor      → Analog pin GPIO35                      ║
 * ║    • NPK Sensor     → UART2 (RX=GPIO16, TX=GPIO17)          ║
 * ║                                                              ║
 * ║  Libraries required (install via Arduino Library Manager):   ║
 * ║    • DHT sensor library by Adafruit                         ║
 * ║    • ArduinoJson by Benoit Blanchon                         ║
 * ║    • WiFi (built-in ESP32)                                   ║
 * ║    • HTTPClient (built-in ESP32)                             ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const char* WIFI_SSID     = "OL-ESP32-AP";
const char* WIFI_PASSWORD = "12345678";

const char* API_URL  = "https://prithvicore-project.onrender.com/api/sensor-data";
const char* API_KEY  = "AGD-69b61f0f9fd223124ea8173c";   // Must start with "AGD-"

// Send interval (milliseconds) – 5 minutes default
const unsigned long SEND_INTERVAL = 5 * 60 * 1000UL;

// ─── PIN DEFINITIONS ────────────────────────────────────────────────────────
#define MOISTURE_PIN   34   // ADC1 – Soil moisture sensor analog out
#define PH_PIN         35   // ADC1 – pH sensor analog out
#define DHT_PIN         4   // DHT22 data pin
#define DHT_TYPE     DHT22
#define NPK_RX_PIN     16   // UART2 RX (from NPK sensor TX)
#define NPK_TX_PIN     17   // UART2 TX (to NPK sensor RX)
#define LED_PIN         2   // Built-in LED

// ─── CALIBRATION ────────────────────────────────────────────────────────────
// Soil moisture: calibrate in dry air and fully submerged water
const int MOISTURE_AIR_VAL   = 3200;  // ADC reading in dry air
const int MOISTURE_WATER_VAL =  900;  // ADC reading in water

// pH calibration: use pH 4.0 and pH 7.0 buffer solutions to find your values
const float PH_SLOPE      = 3.5f;   // mV per pH unit (adjust after calibration)
const float PH_INTERCEPT  = 21.34f; // (adjust after calibration)

// ─── OBJECTS ────────────────────────────────────────────────────────────────
DHT dht(DHT_PIN, DHT_TYPE);
HardwareSerial npkSerial(2);  // UART2

unsigned long lastSendTime = 0;
int  failCount = 0;

// ─── NPK MODBUS COMMAND ─────────────────────────────────────────────────────
// Standard RS-485 NPK sensor query (Modbus RTU)
const byte NPK_QUERY[] = {0x01, 0x03, 0x00, 0x1E, 0x00, 0x03, 0x65, 0xCD};

// ─── SETUP ──────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  npkSerial.begin(4800, SERIAL_8N1, NPK_RX_PIN, NPK_TX_PIN);
  dht.begin();
  pinMode(LED_PIN, OUTPUT);

  Serial.println("\n🌱 PrithviCore IoT Device Starting...");

  connectWiFi();
}

// ─── MAIN LOOP ───────────────────────────────────────────────────────────────
void loop() {
  // Reconnect WiFi if dropped
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi lost. Reconnecting...");
    connectWiFi();
  }

  unsigned long now = millis();
  if (now - lastSendTime >= SEND_INTERVAL || lastSendTime == 0) {
    lastSendTime = now;

    SensorReading reading = readAllSensors();
    printReading(reading);

    if (reading.valid) {
      bool success = sendToServer(reading);
      if (success) {
        failCount = 0;
        blinkLED(2, 200);   // 2 quick blinks = success
      } else {
        failCount++;
        blinkLED(5, 100);   // 5 fast blinks = error
        Serial.printf("❌ Send failed. Consecutive failures: %d\n", failCount);
      }
    } else {
      Serial.println("⚠️  Skipping send – invalid sensor data");
    }
  }
}

// ─── SENSOR READING STRUCT ───────────────────────────────────────────────────
struct SensorReading {
  float moisture;
  float temperature;
  float humidity;
  float ph;
  int   nitrogen;
  int   phosphorus;
  int   potassium;
  int   battery;
  bool  valid;
};

// ─── READ ALL SENSORS ────────────────────────────────────────────────────────
SensorReading readAllSensors() {
  SensorReading r;
  r.valid = true;

  // Soil Moisture (ADC → percentage)
  int rawMoisture = analogRead(MOISTURE_PIN);
  r.moisture = map(rawMoisture, MOISTURE_AIR_VAL, MOISTURE_WATER_VAL, 0, 100);
  r.moisture = constrain(r.moisture, 0.0f, 100.0f);

  // Temperature & Humidity (DHT22)
  float h = dht.readHumidity();
  float t = dht.readTemperature();  // Celsius
  if (isnan(h) || isnan(t)) {
    Serial.println("⚠️  DHT22 read failed");
    r.valid = false;
    r.temperature = 0;
    r.humidity    = 0;
  } else {
    r.temperature = t;
    r.humidity    = h;
  }

  // pH (ADC → pH value via calibration)
  int rawPH    = analogRead(PH_PIN);
  float voltage = rawPH * (3.3f / 4095.0f) * 1000.0f;  // mV
  r.ph = 7.0f + (PH_SLOPE - voltage / 1000.0f) * PH_INTERCEPT;
  r.ph = constrain(r.ph, 0.0f, 14.0f);

  // NPK (Modbus RS-485)
  int n = 0, p = 0, k = 0;
  bool npkOk = readNPK(n, p, k);
  if (npkOk) {
    r.nitrogen   = n;
    r.phosphorus = p;
    r.potassium  = k;
  } else {
    Serial.println("⚠️  NPK sensor read failed");
    // Still send other data, just mark NPK as 0 so backend knows
    r.nitrogen = r.phosphorus = r.potassium = 0;
  }

  // Battery level (read VCC via voltage divider on GPIO39 if wired)
  // r.battery = readBattery();
  r.battery = 85;  // Placeholder – wire up a voltage divider for real reading

  return r;
}

// ─── NPK SENSOR READ (Modbus RTU) ────────────────────────────────────────────
bool readNPK(int& n, int& p, int& k) {
  // Clear buffer
  while (npkSerial.available()) npkSerial.read();

  // Send query
  npkSerial.write(NPK_QUERY, sizeof(NPK_QUERY));
  delay(200);

  // Read response (11 bytes expected)
  byte response[11] = {0};
  int  bytesRead = 0;
  unsigned long timeout = millis() + 1000;

  while (bytesRead < 11 && millis() < timeout) {
    if (npkSerial.available()) {
      response[bytesRead++] = npkSerial.read();
    }
  }

  if (bytesRead < 11) return false;

  // Parse Modbus response: bytes 3-4=N, 5-6=P, 7-8=K
  n = (response[3] << 8) | response[4];
  p = (response[5] << 8) | response[6];
  k = (response[7] << 8) | response[8];

  return true;
}

// ─── SEND TO BACKEND ─────────────────────────────────────────────────────────
bool sendToServer(SensorReading& r) {
  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);
  http.setTimeout(15000);

  StaticJsonDocument<256> doc;
  doc["moisture"]    = round(r.moisture * 10) / 10.0;
  doc["temperature"] = round(r.temperature * 10) / 10.0;
  doc["humidity"]    = round(r.humidity * 10) / 10.0;
  doc["ph"]          = round(r.ph * 100) / 100.0;
  doc["nitrogen"]    = r.nitrogen;
  doc["phosphorus"]  = r.phosphorus;
  doc["potassium"]   = r.potassium;
  doc["battery_level"] = r.battery;

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  bool success = (httpCode == 200 || httpCode == 201);

  if (success) {
    Serial.printf("✅ Data sent  HTTP %d\n", httpCode);
  } else {
    Serial.printf("❌ HTTP error: %d  Body: %s\n", httpCode, http.getString().c_str());
  }

  http.end();
  return success;
}

// ─── WIFI CONNECT ────────────────────────────────────────────────────────────
void connectWiFi() {
  Serial.printf("📶 Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n✅ Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    digitalWrite(LED_PIN, HIGH);
  } else {
    Serial.println("\n❌ WiFi connection failed. Will retry in loop.");
    digitalWrite(LED_PIN, LOW);
  }
}

// ─── LED BLINK HELPER ────────────────────────────────────────────────────────
void blinkLED(int times, int ms) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(ms);
    digitalWrite(LED_PIN, LOW);
    delay(ms);
  }
}

// ─── PRINT TO SERIAL ─────────────────────────────────────────────────────────
void printReading(SensorReading& r) {
  Serial.println("\n─────── Sensor Reading ───────");
  Serial.printf("  Moisture   : %.1f%%\n", r.moisture);
  Serial.printf("  Temperature: %.1f°C\n", r.temperature);
  Serial.printf("  Humidity   : %.1f%%\n", r.humidity);
  Serial.printf("  pH         : %.2f\n", r.ph);
  Serial.printf("  Nitrogen   : %d mg/kg\n", r.nitrogen);
  Serial.printf("  Phosphorus : %d mg/kg\n", r.phosphorus);
  Serial.printf("  Potassium  : %d mg/kg\n", r.potassium);
  Serial.println("──────────────────────────────");
}
