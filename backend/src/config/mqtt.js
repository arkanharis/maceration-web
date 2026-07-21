import mqtt from "mqtt";
import dotenv from "dotenv";

dotenv.config();

const BROKER_URL  = process.env.MQTT_BROKER_URL  || "mqtt://localhost:1883";
const ADMIN_USER  = process.env.MQTT_ADMIN_USER  || "";
const ADMIN_PASS  = process.env.MQTT_ADMIN_PASS  || "";

/**
 * Singleton MQTT client for the backend.
 * The client is created once and exported so all services share the same
 * connection — this avoids opening multiple TCP connections to the broker.
 *
 * clientId prefix "backend-" makes the connection easy to spot in Mosquitto
 * logs; the random suffix prevents collisions on hot-reload (nodemon).
 */
const mqttClient = mqtt.connect(BROKER_URL, {
  clientId: `backend-${Math.random().toString(16).slice(2, 10)}`,
  username: ADMIN_USER || undefined,
  password: ADMIN_PASS || undefined,
  clean: true,
  reconnectPeriod: 3000,   // auto-reconnect every 3 s if connection drops
  connectTimeout: 10000,
});

export default mqttClient;
