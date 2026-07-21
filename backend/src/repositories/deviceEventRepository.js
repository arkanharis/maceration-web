import { pool } from "../config/db.js";

/**
 * Repository layer for the `device_events` table (audit trail / activity log).
 * Pure data-access functions only.
 */

/**
 * Log an event for a device (e.g. relay_toggled, device_claimed, access_granted).
 * @param {Object} params
 * @param {string} params.deviceId - UUID
 * @param {string|null} [params.userId] - UUID of the acting user, or null if the
 *   event originated from the system/device itself
 * @param {string} params.eventType - e.g. "device_claimed"
 * @param {Object} [params.detail] - arbitrary JSON detail for this event
 * @returns {Promise<Object>} the created device_events row
 */
export async function logEvent({ deviceId, userId = null, eventType, detail = null }) {
  const query = `
    INSERT INTO device_events (device_id, user_id, event_type, detail)
    VALUES ($1, $2, $3, $4)
    RETURNING id, device_id, user_id, event_type, detail, created_at
  `;
  const values = [deviceId, userId, eventType, detail ? JSON.stringify(detail) : null];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * List events for a device, most recent first (used by "Tab Aktivitas", Task 3.6/4.9).
 * @param {string} deviceId - UUID
 * @param {number} [limit=100]
 * @returns {Promise<Object[]>}
 */
export async function listEventsForDevice(deviceId, limit = 100) {
  const query = `
    SELECT id, device_id, user_id, event_type, detail, created_at
    FROM device_events
    WHERE device_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `;
  const { rows } = await pool.query(query, [deviceId, limit]);
  return rows;
}