#!/usr/bin/env node
/**
 * device-simulator.mjs — Fake ESP32 Device Simulator
 *
 * Mensimulasikan satu unit ESP32 maceration controller:
 *   - Publish telemetry acak (suhu, RPM, relay state) tiap 1 detik
 *   - Publish status online saat start, offline saat stop (LWT)
 *   - Subscribe ke topik command, eksekusi set_relay, publish ack
 *   - Otentikasi ke MQTT pakai device_code + device_secret (seperti alat asli)
 *
 * Penggunaan:
 *   node tools/device-simulator.mjs
 *
 *   Atau dengan variabel lingkungan kustom:
 *   MQTT_BROKER=192.168.1.10 DEVICE_CODE=MC-0002 DEVICE_SECRET=xxx node tools/device-simulator.mjs
 *
 * Konfigurasi default diambil dari backend/.env
 */

import { fileURLToPath } from "url";
import path    from "path";
import fs      from "fs";
import { createRequire } from "module";

// Resolve mqtt dari backend/node_modules (script ini ada di tools/, bukan backend/)
const __dir  = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dir, "../backend/package.json"));
const mqtt   = require("mqtt");

// ── Load .env dari backend/ ───────────────────────────────────────────────────
const envPath  = path.join(__dir, "../backend/.env");

if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8")
    .split("\n")
    .forEach(line => {
      const [key, ...rest] = line.split("=");
      if (key && !key.startsWith("#") && rest.length) {
        process.env[key.trim()] ??= rest.join("=").trim().replace(/^["']|["']$/g, "");
      }
    });
  console.log("[Config] Loaded backend/.env");
}

// ── Konfigurasi ───────────────────────────────────────────────────────────────
const MQTT_BROKER    = process.env.SIMULATOR_BROKER   || process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const DEVICE_CODE    = process.env.DEVICE_CODE        || "MC-0001";
const DEVICE_SECRET  = process.env.DEVICE_SECRET      || "";
const TELEMETRY_MS   = parseInt(process.env.TELEMETRY_MS || "1000");

// Normalisasi URL broker (pastikan ada protokol)
const brokerUrl = MQTT_BROKER.startsWith("mqtt") ? MQTT_BROKER : `mqtt://${MQTT_BROKER}`;

// ── MQTT Topics ───────────────────────────────────────────────────────────────
const T_TELEMETRY   = `maceration/${DEVICE_CODE}/telemetry`;
const T_STATUS      = `maceration/${DEVICE_CODE}/status`;
const T_COMMAND     = `maceration/${DEVICE_CODE}/command`;
const T_COMMAND_ACK = `maceration/${DEVICE_CODE}/command/ack`;

// ── State simulasi ────────────────────────────────────────────────────────────
const state = {
  relay:       { r1: false, r2: false, r3: false, r4: false },
  temperature: 28.0,   // °C, akan drifting acak
  rpm:         0,      // RPM, naik turun acak
};

// ── Helper: angka acak dalam range ───────────────────────────────────────────
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// Simulasikan sensor yang "realistis" — berubah pelan-pelan, bukan lompat
function updateSensorValues() {
  // Suhu: drift ±0.3°C per detik, tapi kalau relay R1 (heater) ON → naik lebih cepat
  const heaterOn = state.relay.r1;
  const stirrerOn = state.relay.r2;

  const tempDrift = heaterOn
    ? rand(0.05, 0.4)      // heater ON → suhu naik
    : rand(-0.2, 0.15);    // heater OFF → suhu turun/stabil

  state.temperature = Math.min(85, Math.max(18,
    state.temperature + tempDrift + rand(-0.05, 0.05)
  ));

  // RPM: kalau stirrer (R2) ON → naik ke 600-1200, kalau OFF → turun ke 0
  const targetRpm = stirrerOn ? randInt(600, 1200) : 0;
  state.rpm = Math.round(state.rpm + (targetRpm - state.rpm) * 0.3 + rand(-20, 20));
  state.rpm = Math.max(0, state.rpm);
}

// ── Format display ────────────────────────────────────────────────────────────
function relayDisplay() {
  return Object.entries(state.relay)
    .map(([k, v]) => `${k.toUpperCase()}:${v ? "ON " : "OFF"}`)
    .join("  ");
}

function clearLine() { process.stdout.write("\r\x1b[K"); }

// ── MQTT Client ───────────────────────────────────────────────────────────────
console.log("╔════════════════════════════════════════════════╗");
console.log("║       Maceration Device Simulator              ║");
console.log("╚════════════════════════════════════════════════╝");
console.log(`  Device   : ${DEVICE_CODE}`);
console.log(`  Broker   : ${brokerUrl}`);
console.log(`  Interval : ${TELEMETRY_MS}ms`);
if (!DEVICE_SECRET) {
  console.warn("  ⚠️  DEVICE_SECRET kosong — set env DEVICE_SECRET jika broker pakai auth");
}
console.log("─".repeat(50));

const client = mqtt.connect(brokerUrl, {
  clientId:     DEVICE_CODE,
  username:     DEVICE_CODE,
  password:     DEVICE_SECRET || undefined,
  clean:        true,
  reconnectPeriod: 3000,
  // LWT — broker publish "offline" otomatis jika koneksi putus
  will: {
    topic:   T_STATUS,
    payload: JSON.stringify({ state: "offline", device: DEVICE_CODE }),
    qos:     1,
    retain:  true,
  },
});

let telemetryInterval = null;
let tickCount = 0;

// ── Event: Connected ──────────────────────────────────────────────────────────
client.on("connect", () => {
  console.log("[MQTT] ✅ Connected to broker");

  // Publish status online (retained)
  client.publish(T_STATUS,
    JSON.stringify({ state: "online", device: DEVICE_CODE, ip: "simulator" }),
    { qos: 1, retain: true },
    () => console.log(`[MQTT] → Published ONLINE status (retained)`)
  );

  // Subscribe ke command
  client.subscribe(T_COMMAND, { qos: 1 }, (err) => {
    if (err) {
      console.error("[MQTT] Subscribe error:", err.message);
    } else {
      console.log(`[MQTT] Subscribed: ${T_COMMAND}`);
    }
  });

  console.log(`[MQTT] Publishing telemetry every ${TELEMETRY_MS}ms`);
  console.log("─".repeat(50));

  // Mulai publish telemetry
  telemetryInterval = setInterval(() => {
    updateSensorValues();

    const payload = {
      temperature: parseFloat(state.temperature.toFixed(2)),
      rpm:         state.rpm,
      relay:       { ...state.relay },
      ts:          Math.floor(Date.now() / 1000),
    };

    client.publish(T_TELEMETRY, JSON.stringify(payload), { qos: 0 });
    tickCount++;

    // Live display di terminal
    clearLine();
    process.stdout.write(
      `[${tickCount.toString().padStart(4, "0")}] ` +
      `🌡  ${state.temperature.toFixed(1).padStart(5)}°C  ` +
      `⚙  ${String(state.rpm).padStart(4)} RPM  ` +
      `│  ${relayDisplay()}`
    );
  }, TELEMETRY_MS);
});

// ── Event: Message (terima command) ──────────────────────────────────────────
client.on("message", (topic, message) => {
  if (topic !== T_COMMAND) return;

  let cmd;
  try { cmd = JSON.parse(message.toString()); }
  catch { console.error("\n[CMD] Invalid JSON:", message.toString()); return; }

  console.log(`\n[CMD] ← Received: ${JSON.stringify(cmd)}`);

  const { action, relay, value, request_id } = cmd;

  if (action !== "set_relay") {
    console.log(`[CMD] Unknown action '${action}', ignored`);
    return;
  }

  if (!["r1","r2","r3","r4"].includes(relay)) {
    console.log(`[CMD] Invalid relay '${relay}', ignored`);
    return;
  }

  // Terapkan ke state
  state.relay[relay] = Boolean(value);
  console.log(`[CMD] ✅ ${relay.toUpperCase()} → ${state.relay[relay] ? "ON" : "OFF"}`);

  // Publish ack
  const ack = {
    request_id: request_id || "",
    success:    true,
    relay:      { ...state.relay },
  };
  client.publish(T_COMMAND_ACK, JSON.stringify(ack), { qos: 1 }, () => {
    console.log(`[CMD] → ACK sent (request_id=${request_id})`);
  });
});

// ── Event: Reconnect / Error / Close ─────────────────────────────────────────
client.on("reconnect", () => {
  clearLine();
  console.log("\n[MQTT] ⟳ Reconnecting...");
});

client.on("error", (err) => {
  clearLine();
  console.error("\n[MQTT] ❌ Error:", err.message);
  if (err.message.includes("Not authorized") || err.message.includes("CONNACK")) {
    console.error("[MQTT] ⚠️  Periksa DEVICE_CODE dan DEVICE_SECRET");
  }
});

client.on("offline", () => {
  clearLine();
  console.log("\n[MQTT] Offline — broker tidak terjangkau");
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
function shutdown(signal) {
  console.log(`\n\n[SIM] ${signal} received — shutting down gracefully...`);

  if (telemetryInterval) clearInterval(telemetryInterval);

  // Publish offline sebelum disconnect
  client.publish(
    T_STATUS,
    JSON.stringify({ state: "offline", device: DEVICE_CODE }),
    { qos: 1, retain: true },
    () => {
      console.log("[MQTT] → Published OFFLINE status");
      client.end(false, {}, () => {
        console.log("[MQTT] Disconnected. Bye!");
        process.exit(0);
      });
    }
  );

  // Fallback kalau publish gagal
  setTimeout(() => process.exit(0), 3000);
}

process.on("SIGINT",  () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
