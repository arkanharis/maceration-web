import { pool } from "../config/db.js";

/**
 * Repository layer for the `device_access` table (device sharing / permissions).
 * Pure data-access functions only — permission enforcement logic (who is
 * allowed to call these) belongs in the service/controller layer (Task 2.5+).
 */

/**
 * Grant a user a role on a device. Also used internally when a device is
 * first claimed (role='owner') — see claimDevice flow in Task 2.3.
 * @param {Object} params
 * @param {string} params.deviceId - UUID
 * @param {string} params.userId - UUID
 * @param {'owner'|'operator'|'viewer'} params.role
 * @param {string} [params.grantedBy] - UUID of the user who granted this access
 * @returns {Promise<Object>} the created device_access row
 */
export async function grantAccess({ deviceId, userId, role, grantedBy = null }) {
  const query = `
    INSERT INTO device_access (device_id, user_id, role, granted_by)
    VALUES ($1, $2, $3, $4)
    RETURNING id, device_id, user_id, role, granted_by, created_at
  `;
  const values = [deviceId, userId, role, grantedBy];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Get a specific user's role on a specific device.
 * This is the key permission-check helper used throughout the app
 * (REST middleware, Socket.IO room join checks, etc.).
 * @param {string} userId - UUID
 * @param {string} deviceId - UUID
 * @returns {Promise<'owner'|'operator'|'viewer'|null>} null if the user has no access
 */
export async function getUserRoleForDevice(userId, deviceId) {
  const query = `
    SELECT role
    FROM device_access
    WHERE user_id = $1 AND device_id = $2
  `;
  const { rows } = await pool.query(query, [userId, deviceId]);
  return rows[0]?.role || null;
}

/**
 * List everyone who has access to a device, along with their role.
 * Used by the "Kelola Akses" tab (Task 2.5 / 4.10).
 * @param {string} deviceId - UUID
 * @returns {Promise<Object[]>} rows include user_id, role, name, email, granted_by, created_at
 */
export async function listAccessForDevice(deviceId) {
  const query = `
    SELECT da.id, da.device_id, da.user_id, da.role, da.granted_by, da.created_at,
           u.name, u.email
    FROM device_access da
    INNER JOIN users u ON u.id = da.user_id
    WHERE da.device_id = $1
    ORDER BY da.created_at ASC
  `;
  const { rows } = await pool.query(query, [deviceId]);
  return rows;
}

/**
 * Update a user's role on a device (e.g. operator <-> viewer).
 * @param {string} deviceId - UUID
 * @param {string} userId - UUID
 * @param {'owner'|'operator'|'viewer'} role
 * @returns {Promise<Object|null>}
 */
export async function updateAccessRole(deviceId, userId, role) {
  const query = `
    UPDATE device_access
    SET role = $3
    WHERE device_id = $1 AND user_id = $2
    RETURNING id, device_id, user_id, role, granted_by, created_at
  `;
  const { rows } = await pool.query(query, [deviceId, userId, role]);
  return rows[0] || null;
}

/**
 * Revoke a user's access to a device.
 * @param {string} deviceId - UUID
 * @param {string} userId - UUID
 * @returns {Promise<boolean>} true if a row was deleted
 */
export async function revokeAccess(deviceId, userId) {
  const query = `
    DELETE FROM device_access
    WHERE device_id = $1 AND user_id = $2
  `;
  const { rowCount } = await pool.query(query, [deviceId, userId]);
  return rowCount > 0;
}