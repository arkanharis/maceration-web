import mqttClient from "../config/mqtt.js";

/**
 * Topics the backend subscribes to as a wildcard admin listener.
 *
 * maceration/+/telemetry  — ESP32 publishes sensor data every ~1 s
 * maceration/+/status     — ESP32 publishes online/offline (retained + LWT)
 * maceration/+/command/ack — ESP32 confirms a relay command was executed
 *
 * The "+" single-level wildcard matches any device_code, so one subscription
 * covers all devices without knowing them in advance.
 */
const SUBSCRIBE_TOPICS = [
  "maceration/+/telemetry",
  "maceration/+/status",
  "maceration/+/command/ack",
];

// Registered handler callbacks — set by mqttService.init() after other
// services are ready (avoids circular-import issues).
let _onTelemetry = null;   // (deviceCode, payload) => void
let _onStatus    = null;   // (deviceCode, payload) => void
let _onCommandAck = null;  // (deviceCode, payload) => void

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a raw MQTT topic string into its components.
 * Returns null if the topic doesn't match the expected
 * "maceration/{device_code}/{type}" structure.
 *
 * @param {string} topic
 * @returns {{ deviceCode: string, type: string } | null}
 */
function parseTopic(topic) {
  // maceration/<device_code>/telemetry
  // maceration/<device_code>/status
  // maceration/<device_code>/command/ack
  const match = topic.match(/^maceration\/([^/]+)\/(.+)$/);
  if (!match) return null;
  return { deviceCode: match[1], type: match[2] };
}

/**
 * Safely parse a JSON Buffer/string. Returns null on failure.
 * @param {Buffer|string} raw
 * @returns {object|null}
 */
function parsePayload(raw) {
  try {
    return JSON.parse(raw.toString());
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MQTT event wiring
// ─────────────────────────────────────────────────────────────────────────────

mqttClient.on("connect", () => {
  console.log("[mqtt] connected to broker");

  mqttClient.subscribe(SUBSCRIBE_TOPICS, { qos: 1 }, (err, granted) => {
    if (err) {
      console.error("[mqtt] subscription error:", err.message);
      return;
    }
    granted.forEach((g) =>
      console.log(`[mqtt] subscribed to "${g.topic}" (qos ${g.qos})`)
    );
  });
});

mqttClient.on("reconnect", () => {
  console.log("[mqtt] reconnecting…");
});

mqttClient.on("error", (err) => {
  console.error("[mqtt] client error:", err.message);
});

mqttClient.on("offline", () => {
  console.warn("[mqtt] client is offline — will retry automatically");
});

mqttClient.on("message", (topic, message) => {
  const parsed = parseTopic(topic);
  if (!parsed) return;

  const { deviceCode, type } = parsed;
  const payload = parsePayload(message);

  if (!payload) {
    console.warn(`[mqtt] ignoring non-JSON message on topic "${topic}"`);
    return;
  }

  switch (type) {
    case "telemetry":
      _onTelemetry?.(deviceCode, payload);
      break;
    case "status":
      _onStatus?.(deviceCode, payload);
      break;
    case "command/ack":
      _onCommandAck?.(deviceCode, payload);
      break;
    default:
      // Ignore topics we don't handle (future-proofing)
      break;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register handlers that are called when MQTT messages arrive.
 * Called once from index.js after all services are wired up.
 *
 * @param {object} handlers
 * @param {Function} handlers.onTelemetry   - (deviceCode: string, payload: object) => void
 * @param {Function} handlers.onStatus      - (deviceCode: string, payload: object) => void
 * @param {Function} handlers.onCommandAck  - (deviceCode: string, payload: object) => void
 */
export function initMqttHandlers({ onTelemetry, onStatus, onCommandAck }) {
  _onTelemetry  = onTelemetry;
  _onStatus     = onStatus;
  _onCommandAck = onCommandAck;
}

/**
 * Publish a command to a specific device.
 * Used by the relay-control endpoint (Task 3.5).
 *
 * @param {string} deviceCode - e.g. "MC-0001"
 * @param {object} payload    - e.g. { action: "set_relay", relay: "r2", value: true, request_id: "..." }
 * @returns {Promise<void>}
 */
export function publishCommand(deviceCode, payload) {
  return new Promise((resolve, reject) => {
    const topic = `maceration/${deviceCode}/command`;
    const message = JSON.stringify(payload);
    mqttClient.publish(topic, message, { qos: 1 }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
