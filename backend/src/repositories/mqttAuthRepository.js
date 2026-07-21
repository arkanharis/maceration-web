import { pool } from "../config/db.js";
import bcrypt from "bcrypt";

/**
 * Repository for MQTT device authentication & ACL checks.
 * Called by mqttAuthController which is hit by mosquitto-go-auth HTTP backend.
 */

/**
 * Find a claimed device by device_code and verify its device_secret.
 * Returns the device row (without secret) if credentials are valid, null otherwise.
 *
 * @param {string} deviceCode - MQTT username (= device_code, e.g. "MC-0001")
 * @param {string} secret     - MQTT password (= device_secret plaintext)
 * @returns {Promise<Object|null>}
 */
export async function authenticateDeviceCredentials(deviceCode, secret) {
  const query = `
    SELECT id, device_code, device_secret_hash, claimed_at
    FROM devices
    WHERE device_code = $1
  `;
  const { rows } = await pool.query(query, [deviceCode]);
  const device = rows[0];

  if (!device) return null;
  // Device must be claimed (has a device_secret_hash set)
  if (!device.device_secret_hash) return null;
  // Password must be provided
  if (!secret) return null;

  try {
    const match = await bcrypt.compare(secret, device.device_secret_hash);
    return match ? device : null;
  } catch {
    return null;
  }
}

/**
 * Check if a device_code is allowed to publish or subscribe to a given MQTT topic.
 *
 * ACL rules (per rancangan):
 *   PUBLISH  maceration/{own_device_code}/telemetry     ✓
 *   PUBLISH  maceration/{own_device_code}/status        ✓
 *   PUBLISH  maceration/{own_device_code}/command/ack   ✓
 *   SUBSCRIBE maceration/{own_device_code}/command      ✓
 *   Everything else                                     ✗
 *
 * @param {string} deviceCode - the MQTT client's username
 * @param {string} topic      - the topic being published/subscribed to
 * @param {number} acc        - 1 = subscribe, 2 = publish, 3 = subscribe+publish (go-auth convention)
 * @returns {boolean}
 */
export function isTopicAllowed(deviceCode, topic, acc) {
  const prefix = `maceration/${deviceCode}/`;

  // Publish-only topics
  const publishTopics = [
    `${prefix}telemetry`,
    `${prefix}status`,
    `${prefix}command/ack`,
  ];

  // Subscribe-only topics
  const subscribeTopics = [
    `${prefix}command`,
  ];

  const canPublish   = publishTopics.includes(topic);
  const canSubscribe = subscribeTopics.includes(topic);

  // acc values from mosquitto-go-auth: 1=read(sub), 2=write(pub), 3=readwrite
  switch (acc) {
    case 1: return canSubscribe;
    case 2: return canPublish;
    case 3: return canPublish && canSubscribe;
    default: return false;
  }
}
