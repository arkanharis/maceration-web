import { authenticateDeviceCredentials, isTopicAllowed } from "../repositories/mqttAuthRepository.js";

/**
 * MQTT Auth controller — called by Mosquitto via mosquitto-go-auth HTTP backend.
 *
 * These endpoints are INTERNAL — they should only be reachable from the Mosquitto
 * container (same Docker network). They do NOT require a user JWT.
 *
 * go-auth expects HTTP 200 = OK, HTTP 4xx = denied.
 * Request bodies are sent as application/x-www-form-urlencoded.
 */

/**
 * POST /api/v1/mqtt/auth
 * Called by Mosquitto to authenticate a connecting MQTT client.
 *
 * Body (form-encoded): username, password, clientid, [ip]
 *
 * Auth rules:
 *   - username == "backend"  → allow (the backend's own MQTT connection)
 *   - Otherwise              → verify device_code + device_secret via DB
 */
export async function mqttAuth(req, res) {
  const { username, password } = req.body;

  // Backend superuser — always allowed (uses a shared secret from env)
  if (username === "backend") {
    const backendSecret = process.env.MQTT_BACKEND_PASSWORD;
    if (backendSecret && password === backendSecret) {
      return res.sendStatus(200);
    }
    return res.sendStatus(403);
  }

  // Device client — verify device_code + device_secret
  try {
    const device = await authenticateDeviceCredentials(username, password);
    return device ? res.sendStatus(200) : res.sendStatus(403);
  } catch (err) {
    console.error("[mqttAuth]", err);
    return res.sendStatus(500);
  }
}

/**
 * POST /api/v1/mqtt/acl
 * Called by Mosquitto to check if a client can publish/subscribe to a topic.
 *
 * Body (form-encoded): username, clientid, topic, acc
 *   acc: 1 = subscribe, 2 = publish, 3 = both
 */
export async function mqttAcl(req, res) {
  const { username, topic, acc } = req.body;

  // Backend superuser — allow all topics
  if (username === "backend") {
    return res.sendStatus(200);
  }

  // Device client — enforce per-device ACL
  const allowed = isTopicAllowed(username, topic, Number(acc));
  return res.sendStatus(allowed ? 200 : 403);
}
