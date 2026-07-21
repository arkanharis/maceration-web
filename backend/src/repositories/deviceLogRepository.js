import { pool } from "../config/db.js";

/**
 * Repository layer for the `device_logs` table (sensor history).
 * Pure data-access only.
 */

/**
 * Insert one telemetry row into device_logs.
 * Called every time the backend receives a telemetry MQTT message.
 *
 * @param {Object} params
 * @param {string} params.deviceId    - UUID of the device
 * @param {number} params.temperature
 * @param {number} params.rpm
 * @param {Object} params.relayState  - e.g. { r1: true, r2: false, r3: false, r4: true }
 * @returns {Promise<Object>} the inserted row
 */
export async function insertLog({ deviceId, temperature, rpm, relayState }) {
  const query = `
    INSERT INTO device_logs (device_id, temperature, rpm, relay_state)
    VALUES ($1, $2, $3, $4)
    RETURNING id, device_id, temperature, rpm, relay_state, recorded_at
  `;
  const { rows } = await pool.query(query, [
    deviceId,
    temperature,
    rpm,
    JSON.stringify(relayState),
  ]);
  return rows[0];
}

/**
 * Fetch historical logs for a device within a time range.
 * Used by GET /devices/:id/history (Task 3.6).
 *
 * @param {string} deviceId  - UUID
 * @param {Date}   from      - start of range (inclusive)
 * @param {Date}   to        - end of range (inclusive)
 * @param {number} [limit=1000] - safety cap to avoid huge payloads
 * @returns {Promise<Object[]>}
 */
export async function listLogsForDevice(deviceId, from, to, limit = 1000) {
  const query = `
    SELECT id, device_id, temperature, rpm, relay_state, recorded_at
    FROM device_logs
    WHERE device_id = $1
      AND recorded_at >= $2
      AND recorded_at <= $3
    ORDER BY recorded_at ASC
    LIMIT $4
  `;
  const { rows } = await pool.query(query, [deviceId, from, to, limit]);
  return rows;
}
