// ============================================================
// maceration.ino — Maceration Controller ESP32 Firmware
// ============================================================
//
// Fitur:
//   - WiFiManager captive portal untuk konfigurasi WiFi + MQTT
//     (SSID, MQTT Broker, Device Code, Device Secret)
//   - Semua konfigurasi disimpan ke NVS (flash), persisten reboot
//   - Tahan tombol BOOT (GPIO 0) 3 detik → reset konfigurasi
//   - MQTT: publish telemetry tiap 1 detik, subscribe command,
//     LWT online/offline retained, publish command/ack
//   - 4-channel relay: kontrol via tombol fisik + command MQTT
//   - Speed sensor FC-03 (interrupt-based RPM)
//   - Temperature DS18B20
//   - Buzzer non-blocking (millis state machine)
//
// Library yang dibutuhkan (install via Arduino Library Manager):
//   - WiFiManager by tzapu  (https://github.com/tzapu/WiFiManager)
//   - PubSubClient by Nick O'Leary
//   - ArduinoJson by Benoit Blanchon (v6.x)
//   - OneWire by Paul Stoffregen
//   - DallasTemperature by Miles Burton
//   (WiFi.h, Preferences.h — built-in ESP32 Arduino Core)
//
// ============================================================

#include "config.h"
#include <WiFi.h>
#include <WiFiManager.h>
#include <Preferences.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ============================================================
// SENSOR INSTANCES
// ============================================================

OneWire           oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensor(&oneWire);

// ============================================================
// MQTT TOPIC BUILDER
// (topic dibangun runtime dari device_code yang disimpan di NVS)
// ============================================================

char topicTelemetry[80];
char topicStatus[80];
char topicCommand[80];
char topicCommandAck[80];

void buildTopics(const char* deviceCode) {
  snprintf(topicTelemetry,   sizeof(topicTelemetry),   "maceration/%s/telemetry",   deviceCode);
  snprintf(topicStatus,      sizeof(topicStatus),      "maceration/%s/status",      deviceCode);
  snprintf(topicCommand,     sizeof(topicCommand),     "maceration/%s/command",     deviceCode);
  snprintf(topicCommandAck,  sizeof(topicCommandAck),  "maceration/%s/command/ack", deviceCode);
}

// ============================================================
// KONFIGURASI (dibaca dari NVS setelah WiFiManager selesai)
// ============================================================

struct DeviceConfig {
  char mqttBroker[64];
  char mqttPort[6];       // disimpan sebagai string di NVS
  char deviceCode[24];
  char deviceSecret[64];
};

DeviceConfig cfg;
Preferences  prefs;

void loadConfig() {
  prefs.begin(NVS_NAMESPACE, /*readOnly=*/true);
  prefs.getString("mqttBroker",  cfg.mqttBroker,  sizeof(cfg.mqttBroker));
  prefs.getString("mqttPort",    cfg.mqttPort,    sizeof(cfg.mqttPort));
  prefs.getString("deviceCode",  cfg.deviceCode,  sizeof(cfg.deviceCode));
  prefs.getString("deviceSecret",cfg.deviceSecret,sizeof(cfg.deviceSecret));
  prefs.end();
}

void saveConfig(const char* broker, const char* port,
                const char* code,   const char* secret) {
  prefs.begin(NVS_NAMESPACE, /*readOnly=*/false);
  prefs.putString("mqttBroker",   broker);
  prefs.putString("mqttPort",     port);
  prefs.putString("deviceCode",   code);
  prefs.putString("deviceSecret", secret);
  prefs.end();
  Serial.println("[NVS] Configuration saved.");
}

void clearConfig() {
  prefs.begin(NVS_NAMESPACE, /*readOnly=*/false);
  prefs.clear();
  prefs.end();
  Serial.println("[NVS] Configuration cleared.");
}

bool isConfigured() {
  // Dianggap sudah dikonfigurasi kalau device_code tidak kosong
  return strlen(cfg.deviceCode) > 0 && strlen(cfg.mqttBroker) > 0;
}

// ============================================================
// BUZZER NOTE FREQUENCIES
// ============================================================

#define NOTE_G5  784
#define NOTE_FS5 740
#define NOTE_DS5 622
#define NOTE_A4  440
#define NOTE_GS4 415
#define NOTE_E5  659
#define NOTE_GS5 831
#define NOTE_C6  1047

// ============================================================
// BUZZER NON-BLOCKING STATE MACHINE
// ============================================================

struct BuzzerNote {
  int freq;
  int duration;   // ms tone aktif
  int gap;        // ms silence setelah tone
};

const BuzzerNote MELODY_STARTUP[] = {
  {NOTE_G5,  100, 20},
  {NOTE_FS5, 100, 20},
  {NOTE_DS5, 100, 20},
  {NOTE_A4,  100, 20},
  {NOTE_GS4, 100, 20},
  {NOTE_E5,  100, 20},
  {NOTE_GS5, 100, 20},
  {NOTE_C6,  600,  0}
};
const int MELODY_STARTUP_LEN = sizeof(MELODY_STARTUP) / sizeof(MELODY_STARTUP[0]);

const BuzzerNote MELODY_RELAY_BEEP[] = {{1000, 80, 0}};
const int MELODY_RELAY_BEEP_LEN = 1;

const BuzzerNote MELODY_WIFI_OK[] = {{880, 100, 50}, {1046, 150, 0}};
const int MELODY_WIFI_OK_LEN = 2;

const BuzzerNote MELODY_MQTT_OK[] = {{523, 80, 30}, {659, 80, 30}, {784, 120, 0}};
const int MELODY_MQTT_OK_LEN = 3;

const BuzzerNote MELODY_ERROR[] = {{300, 200, 80}, {300, 200, 0}};
const int MELODY_ERROR_LEN = 2;

// State machine
const BuzzerNote* bQueue     = nullptr;
int  bQueueLen   = 0;
int  bNoteIdx    = 0;
unsigned long bNoteStartMs = 0;
bool bPlayingTone = false;

void buzzerEnqueue(const BuzzerNote* melody, int len) {
  bQueue       = melody;
  bQueueLen    = len;
  bNoteIdx     = 0;
  bPlayingTone = false;
}

void handleBuzzer() {
  if (bQueue == nullptr) return;

  unsigned long now = millis();

  if (!bPlayingTone) {
    // Mulai note
    tone(BUZZER_PIN, bQueue[bNoteIdx].freq);
    bNoteStartMs = now;
    bPlayingTone = true;
  } else {
    unsigned long elapsed = now - bNoteStartMs;
    int dur = bQueue[bNoteIdx].duration;
    int gap = bQueue[bNoteIdx].gap;

    if (elapsed < (unsigned long)dur) {
      // Tone masih berlangsung
    } else if (elapsed < (unsigned long)(dur + gap)) {
      noTone(BUZZER_PIN);
    } else {
      // Selesai, lanjut note berikutnya
      noTone(BUZZER_PIN);
      bNoteIdx++;
      if (bNoteIdx >= bQueueLen) {
        bQueue = nullptr;  // idle
      }
      bPlayingTone = false;
    }
  }
}

// ============================================================
// RELAY & BUTTON STATE
// ============================================================

bool relayState[4]           = {false, false, false, false};
int  curBtnState[4]          = {HIGH, HIGH, HIGH, HIGH};
int  lastBtnState[4]         = {HIGH, HIGH, HIGH, HIGH};
unsigned long lastDebounce[4]= {0, 0, 0, 0};
const unsigned long DEBOUNCE_MS = 50;

// setRelay: set relay ke nilai eksplisit (dari MQTT command atau tombol)
void setRelay(int idx, bool value) {
  relayState[idx] = value;
  digitalWrite(RELAY_PINS[idx], value ? LOW : HIGH);  // active-LOW
  buzzerEnqueue(MELODY_RELAY_BEEP, MELODY_RELAY_BEEP_LEN);

  Serial.printf("[Relay] R%d → %s\n", idx + 1, value ? "ON" : "OFF");
}

void toggleRelay(int idx) {
  setRelay(idx, !relayState[idx]);
}

void handleButtons() {
  for (int i = 0; i < 4; i++) {
    int reading = digitalRead(BUTTON_PINS[i]);

    if (reading != lastBtnState[i]) lastDebounce[i] = millis();

    if (millis() - lastDebounce[i] > DEBOUNCE_MS) {
      if (reading != curBtnState[i]) {
        curBtnState[i] = reading;
        if (curBtnState[i] == LOW) {
          Serial.printf("[Button] %d PRESSED\n", i + 1);
          toggleRelay(i);
        }
      }
    }
    lastBtnState[i] = reading;
  }
}

// ============================================================
// SPEED SENSOR
// ============================================================

volatile unsigned int pulseCount = 0;
unsigned int rpm = 0;
unsigned long prevRpmMs = 0;

void IRAM_ATTR countPulse() { pulseCount++; }

void handleSpeedSensor() {
  unsigned long now = millis();
  if (now - prevRpmMs >= RPM_INTERVAL_MS) {
    detachInterrupt(digitalPinToInterrupt(SENSOR_PIN));
    rpm = (pulseCount * 60) / SLOTS_ON_DISK;
    Serial.printf("[Speed] %u pulses/s | %u RPM\n", pulseCount, rpm);
    pulseCount = 0;
    prevRpmMs  = now;
    attachInterrupt(digitalPinToInterrupt(SENSOR_PIN), countPulse, FALLING);
  }
}

// ============================================================
// TEMPERATURE SENSOR
// ============================================================

float temperature = 0.0;
unsigned long prevTempMs = 0;

void handleTemperature() {
  unsigned long now = millis();
  if (now - prevTempMs >= TEMP_INTERVAL_MS) {
    tempSensor.requestTemperatures();
    temperature = tempSensor.getTempCByIndex(0);
    Serial.printf("[Temp] %.2f °C\n", temperature);
    prevTempMs = now;
  }
}

// ============================================================
// RESET BUTTON (tahan GPIO 0 selama RESET_HOLD_MS)
// ============================================================

unsigned long resetBtnPressedAt = 0;
bool resetBtnHeld = false;

void handleResetButton() {
  if (digitalRead(RESET_BUTTON_PIN) == LOW) {
    if (!resetBtnHeld) {
      resetBtnPressedAt = millis();
      resetBtnHeld = true;
    } else if (millis() - resetBtnPressedAt >= RESET_HOLD_MS) {
      Serial.println("[RESET] Factory reset triggered!");
      buzzerEnqueue(MELODY_ERROR, MELODY_ERROR_LEN);
      delay(500);
      clearConfig();
      WiFiManager wm;
      wm.resetSettings();   // hapus WiFi credentials dari WiFiManager
      Serial.println("[RESET] Restarting...");
      delay(1000);
      ESP.restart();
    }
  } else {
    resetBtnHeld = false;
  }
}

// ============================================================
// MQTT
// ============================================================

WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

unsigned long lastMqttReconnectMs = 0;
const unsigned long MQTT_RECONNECT_INTERVAL = 5000;

// Forward declaration
void publishCommandAck(const char* requestId);

// ── mqttCallback ─────────────────────────────────────────────

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  char msg[256];
  unsigned int copyLen = min(length, (unsigned int)(sizeof(msg) - 1));
  memcpy(msg, payload, copyLen);
  msg[copyLen] = '\0';

  Serial.printf("[MQTT] ← %s : %s\n", topic, msg);

  // Parse JSON
  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, msg) != DeserializationError::Ok) {
    Serial.println("[MQTT] JSON parse error");
    return;
  }

  const char* action    = doc["action"] | "";
  const char* relayKey  = doc["relay"]  | "";
  bool        newValue  = doc["value"]  | false;
  const char* requestId = doc["request_id"] | "";

  if (strcmp(action, "set_relay") != 0) {
    Serial.printf("[MQTT] Unknown action '%s', ignored\n", action);
    return;
  }

  // Map "r1"–"r4" → index 0–3
  int idx = -1;
  if      (strcmp(relayKey, "r1") == 0) idx = 0;
  else if (strcmp(relayKey, "r2") == 0) idx = 1;
  else if (strcmp(relayKey, "r3") == 0) idx = 2;
  else if (strcmp(relayKey, "r4") == 0) idx = 3;

  if (idx < 0) {
    Serial.printf("[MQTT] Invalid relay key '%s'\n", relayKey);
    return;
  }

  setRelay(idx, newValue);
  publishCommandAck(requestId);
}

// ── Telemetry publish ────────────────────────────────────────

void publishTelemetry() {
  StaticJsonDocument<192> doc;
  doc["temperature"] = temperature;
  doc["rpm"]         = rpm;

  JsonObject relay = doc.createNestedObject("relay");
  relay["r1"] = relayState[0];
  relay["r2"] = relayState[1];
  relay["r3"] = relayState[2];
  relay["r4"] = relayState[3];

  doc["ts"] = millis() / 1000;

  char buf[256];
  size_t len = serializeJson(doc, buf);

  if (!mqttClient.publish(topicTelemetry, (uint8_t*)buf, len, /*retain=*/false)) {
    Serial.println("[MQTT] Telemetry publish failed");
  }
}

// ── Command ACK publish ──────────────────────────────────────

void publishCommandAck(const char* requestId) {
  StaticJsonDocument<192> doc;
  doc["request_id"] = requestId;
  doc["success"]    = true;

  JsonObject relay = doc.createNestedObject("relay");
  relay["r1"] = relayState[0];
  relay["r2"] = relayState[1];
  relay["r3"] = relayState[2];
  relay["r4"] = relayState[3];

  char buf[256];
  size_t len = serializeJson(doc, buf);

  mqttClient.publish(topicCommandAck, (uint8_t*)buf, len, false);
  Serial.printf("[MQTT] → ACK request_id=%s\n", requestId);
}

// ── MQTT reconnect (non-blocking) ────────────────────────────

bool mqttReconnect() {
  if (WiFi.status() != WL_CONNECTED) return false;

  int port = atoi(cfg.mqttPort);
  if (port <= 0) port = MQTT_PORT_DEFAULT;

  mqttClient.setServer(cfg.mqttBroker, port);

  // LWT payload offline
  char lwtOffline[64];
  snprintf(lwtOffline, sizeof(lwtOffline), "{\"state\":\"offline\",\"device\":\"%s\"}", cfg.deviceCode);

  Serial.printf("[MQTT] Connecting to %s:%d as %s...\n", cfg.mqttBroker, port, cfg.deviceCode);

  bool ok = mqttClient.connect(
    cfg.deviceCode,    // clientId
    cfg.deviceCode,    // username
    cfg.deviceSecret,  // password
    topicStatus,       // LWT topic
    1,                 // LWT QoS
    true,              // LWT retain
    lwtOffline         // LWT payload
  );

  if (ok) {
    Serial.println("[MQTT] Connected!");

    // Publish status online (retained)
    char lwtOnline[64];
    snprintf(lwtOnline, sizeof(lwtOnline), "{\"state\":\"online\",\"device\":\"%s\"}", cfg.deviceCode);
    mqttClient.publish(topicStatus, (uint8_t*)lwtOnline, strlen(lwtOnline), /*retain=*/true);

    // Subscribe ke topik command
    mqttClient.subscribe(topicCommand, 1);
    Serial.printf("[MQTT] Subscribed: %s\n", topicCommand);

    buzzerEnqueue(MELODY_MQTT_OK, MELODY_MQTT_OK_LEN);
  } else {
    Serial.printf("[MQTT] Failed, rc=%d — retry in %lus\n",
                  mqttClient.state(), MQTT_RECONNECT_INTERVAL / 1000);
  }

  return ok;
}

// ============================================================
// WIFI MANAGER SETUP
// ============================================================

void startWiFiManager() {
  // Load konfigurasi MQTT yang tersimpan (sebagai nilai default di form)
  loadConfig();

  // Custom parameters yang muncul di halaman portal WiFiManager
  WiFiManagerParameter paramBroker(
    "broker", "MQTT Broker (IP/domain)",
    cfg.mqttBroker, 63
  );
  WiFiManagerParameter paramPort(
    "port", "MQTT Port",
    strlen(cfg.mqttPort) > 0 ? cfg.mqttPort : "1883", 5
  );
  WiFiManagerParameter paramCode(
    "code", "Device Code (mis. MC-0001)",
    cfg.deviceCode, 23
  );
  WiFiManagerParameter paramSecret(
    "secret", "Device Secret",
    cfg.deviceSecret, 63
  );

  WiFiManager wm;

  // Tambahkan parameter custom ke portal
  wm.addParameter(&paramBroker);
  wm.addParameter(&paramPort);
  wm.addParameter(&paramCode);
  wm.addParameter(&paramSecret);

  // Konfigurasi portal
  wm.setConfigPortalTimeout(PORTAL_TIMEOUT_S);   // 0 = tidak timeout
  wm.setTitle("Maceration Controller");
  wm.setConnectTimeout(20);                       // timeout koneksi WiFi (detik)

  // Callback: simpan parameter custom ke NVS saat user submit portal
  wm.setSaveParamsCallback([&]() {
    saveConfig(
      paramBroker.getValue(),
      paramPort.getValue(),
      paramCode.getValue(),
      paramSecret.getValue()
    );
  });

  Serial.println("[WiFiMgr] Starting portal: " PORTAL_AP_NAME);
  Serial.println("[WiFiMgr] Buka browser → 192.168.4.1 setelah connect ke AP");

  // autoConnect: coba connect ke WiFi tersimpan dulu.
  // Kalau gagal (atau belum ada), buka portal AP.
  bool connected = wm.autoConnect(PORTAL_AP_NAME, PORTAL_AP_PASS);

  if (connected) {
    Serial.print("[WiFi] Connected! IP: ");
    Serial.println(WiFi.localIP());
    buzzerEnqueue(MELODY_WIFI_OK, MELODY_WIFI_OK_LEN);

    // Reload config (mungkin baru disimpan dari portal)
    loadConfig();
  } else {
    Serial.println("[WiFi] Portal timeout / connection failed — restarting");
    delay(3000);
    ESP.restart();
  }
}

// ============================================================
// SETUP
// ============================================================

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println("============================================");
  Serial.println("  Maceration Controller — Booting");
  Serial.println("============================================");

  // ── Hardware Init ──────────────────────────────────────────

  // Relay (semua OFF saat boot)
  for (int i = 0; i < 4; i++) {
    pinMode(RELAY_PINS[i], OUTPUT);
    digitalWrite(RELAY_PINS[i], HIGH);
  }

  // Buttons
  for (int i = 0; i < 4; i++) {
    pinMode(BUTTON_PINS[i], INPUT_PULLUP);
  }

  // Reset button
  pinMode(RESET_BUTTON_PIN, INPUT_PULLUP);

  // Buzzer
  pinMode(BUZZER_PIN, OUTPUT);

  // Speed sensor
  pinMode(SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(SENSOR_PIN), countPulse, FALLING);

  // Temperature
  tempSensor.begin();

  // Startup melody (non-blocking: dimulai, selesai di loop)
  buzzerEnqueue(MELODY_STARTUP, MELODY_STARTUP_LEN);
  // Jalankan beberapa tick buzzer agar melody mulai sebelum WiFiManager blocking
  for (int i = 0; i < 300; i++) { handleBuzzer(); delay(1); }

  // ── WiFiManager ────────────────────────────────────────────
  // (blocking sampai WiFi connected atau portal timeout)
  startWiFiManager();

  // ── Validasi konfigurasi ───────────────────────────────────
  if (!isConfigured()) {
    Serial.println("[ERROR] Device belum dikonfigurasi (device_code/broker kosong)!");
    Serial.println("        Restart untuk buka portal konfigurasi.");
    buzzerEnqueue(MELODY_ERROR, MELODY_ERROR_LEN);
    // Tidak restart — biarkan loop berjalan, MQTT tidak akan connect
  } else {
    Serial.printf("[Config] Broker  : %s:%s\n", cfg.mqttBroker, cfg.mqttPort);
    Serial.printf("[Config] Device  : %s\n", cfg.deviceCode);
  }

  // ── Build MQTT topics ──────────────────────────────────────
  buildTopics(cfg.deviceCode);

  // ── MQTT client setup ──────────────────────────────────────
  mqttClient.setCallback(mqttCallback);
  mqttClient.setKeepAlive(MQTT_KEEPALIVE);
  mqttClient.setSocketTimeout(MQTT_SOCKET_TIMEOUT);

  Serial.println("============================================");
  Serial.println("  Boot complete — entering main loop");
  Serial.println("============================================");
}

// ============================================================
// MAIN LOOP
// ============================================================

unsigned long prevTelemetryMs = 0;

void loop() {
  // ── Reset button (factory reset) ──
  handleResetButton();

  // ── WiFi auto-reconnect ──
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Disconnected — reconnecting...");
    WiFi.reconnect();
    delay(500);
    return;   // skip loop iteration sampai WiFi kembali
  }

  // ── MQTT maintain connection ──
  if (!mqttClient.connected() && isConfigured()) {
    unsigned long now = millis();
    if (now - lastMqttReconnectMs >= MQTT_RECONNECT_INTERVAL) {
      lastMqttReconnectMs = now;
      mqttReconnect();
    }
  }

  if (mqttClient.connected()) {
    mqttClient.loop();   // WAJIB dipanggil sesering mungkin
  }

  // ── Sensor & Button handlers ──
  handleButtons();
  handleSpeedSensor();
  handleTemperature();

  // ── Telemetry publish ──
  if (mqttClient.connected()) {
    unsigned long now = millis();
    if (now - prevTelemetryMs >= TELEMETRY_INTERVAL_MS) {
      prevTelemetryMs = now;
      publishTelemetry();
    }
  }

  // ── Non-blocking buzzer ──
  handleBuzzer();
}
