// ============================================================
// config.h — Maceration Controller Compile-Time Constants
// ============================================================
//
// File ini HANYA berisi konstanta yang sama untuk semua unit
// (pin, interval, nama AP portal, dll).
//
// WiFi SSID/Password, MQTT Broker, Device Code & Secret
// TIDAK dikonfigurasi di sini — semuanya diinput lewat
// WiFiManager captive portal saat pertama kali boot.
//
// Cara reset ke factory default:
//   Tahan tombol BOOT (GPIO 0) selama >3 detik saat menyala
//   → semua konfigurasi terhapus, portal WiFiManager muncul lagi.
//
// ============================================================

#ifndef CONFIG_H
#define CONFIG_H

// ── WiFiManager Portal ───────────────────────────────────────
#define PORTAL_AP_NAME    "Maceration-Setup"
#define PORTAL_AP_PASS    "setup1234"        // password AP portal (min 8 char)
#define PORTAL_TIMEOUT_S  180                // timeout portal (detik), 0 = never

// ── MQTT ─────────────────────────────────────────────────────
#define MQTT_PORT_DEFAULT 1883               // nilai default di form portal
#define MQTT_KEEPALIVE    60
#define MQTT_SOCKET_TIMEOUT 10

// ── Telemetry ────────────────────────────────────────────────
#define TELEMETRY_INTERVAL_MS  1000          // interval publish (ms)

// ── Reset Button ─────────────────────────────────────────────
#define RESET_BUTTON_PIN  0                  // GPIO 0 (BOOT button ESP32)
#define RESET_HOLD_MS     3000               // tahan 3 detik untuk reset

// ── Relay Pins (active-LOW) ──────────────────────────────────
const int RELAY_PINS[4]  = {13, 12, 27, 26};

// ── Button Pins (INPUT_PULLUP, active-LOW) ───────────────────
const int BUTTON_PINS[4] = {2, 4, 16, 17};

// ── Buzzer Pin ───────────────────────────────────────────────
#define BUZZER_PIN        23

// ── Speed Sensor (FC-03) ─────────────────────────────────────
#define SENSOR_PIN        14
#define SLOTS_ON_DISK     20
#define RPM_INTERVAL_MS   1000

// ── Temperature Sensor (DS18B20) ─────────────────────────────
#define ONE_WIRE_BUS      22
#define TEMP_INTERVAL_MS  2000

// ── NVS Namespace ────────────────────────────────────────────
#define NVS_NAMESPACE     "maceration"

#endif // CONFIG_H
