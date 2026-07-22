import mqtt from "mqtt";
import dotenv from "dotenv";

dotenv.config();

let rawBrokerUrl = (process.env.MQTT_BROKER_URL || "").trim();
if (!rawBrokerUrl) {
  rawBrokerUrl = "mqtt://localhost:1883";
} else if (!rawBrokerUrl.includes("://")) {
  rawBrokerUrl = `mqtt://${rawBrokerUrl}`;
}

const BROKER_URL = rawBrokerUrl;
const ADMIN_USER = (process.env.MQTT_ADMIN_USER || "").trim();
const ADMIN_PASS = (process.env.MQTT_ADMIN_PASS || "").trim();

/**
 * Singleton MQTT client for the backend.
 * The client is created once and exported so all services share the same
 * connection — this avoids opening multiple TCP connections to the broker.
 */
const mqttClient = mqtt.connect(BROKER_URL, {
  clientId: `backend-${Math.random().toString(16).slice(2, 10)}`,
  username: ADMIN_USER || undefined,
  password: ADMIN_PASS || undefined,
  clean: true,
  reconnectPeriod: 5000,   // auto-reconnect every 5 s if connection drops
  connectTimeout: 10000,
});

mqttClient.on("error", (err) => {
  console.error("[MQTT] Client error:", err.message);
});

export default mqttClient;
