import { pool } from "../config/db.js";

/**
 * Repository layer for the `devices` table.
 * Pure data-access functions only — no business logic (permission checks,
 * device_code/secret generation, etc.) belongs here. That lives in the
 * service/controller layer (Task 2.2+).
 */

/**
 * Create a new device (used by admin device-generation flow, Task 2.2).
 * @param {Object} params
 * @param {string} params.deviceCode - unique human-readable code, e.g. "MC-0001"
 * @param {string} params.deviceSecretHash - already-hashed device secret
 * @param {string} params.name - display name for the device
 * @returns {Promise<Object>} the created device row
 */
export async function createDevice({ deviceCode, deviceSecretHash, name }) {
  const query = `
    INSERT INTO devices (device_code, device_secret_hash, name)
    VALUES ($1, $2, $3)
    RETURNING id, device_code, name, status, connection_status, last_seen_at,
              owner_id, created_at, claimed_at
  `;
  const values = [deviceCode, deviceSecretHash, name];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Get the next available numeric suffix for device_code generation
 * (e.g. if MC-0001..MC-0003 exist, returns 4). Used by the admin
 * "generate device" flow (Task 2.2) to produce codes like "MC-0004".
 *
 * Reads the highest existing numeric suffix directly from device_code
 * values, so it works correctly even if devices are later deleted.
 * @returns {Promise<number>}
 */
export async function getNextDeviceCodeNumber() {
  const query = `
    SELECT COALESCE(MAX(CAST(SUBSTRING(device_code FROM 'MC-(\\d+)$') AS INTEGER)), 0) AS max_num
    FROM devices
  `;
  const { rows } = await pool.query(query);
  return Number(rows[0].max_num) + 1;
}

/**
 * Find a device by its id. Excludes device_secret_hash.
 * @param {string} id - UUID
 * @returns {Promise<Object|null>}
 */
export async function findDeviceById(id) {
  const query = `
    SELECT id, device_code, name, status, connection_status, last_seen_at,
           owner_id, created_at, claimed_at
    FROM devices
    WHERE id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}

/**
 * Find a device by its device_code. Excludes device_secret_hash.
 * @param {string} deviceCode
 * @returns {Promise<Object|null>}
 */
export async function findDeviceByCode(deviceCode) {
  const query = `
    SELECT id, device_code, name, status, connection_status, last_seen_at,
           owner_id, created_at, claimed_at
    FROM devices
    WHERE device_code = $1
  `;
  const { rows } = await pool.query(query, [deviceCode]);
  return rows[0] || null;
}

/**
 * Find a device by its device_code, including device_secret_hash.
 * Needed for MQTT auth checks (Task 3.7) — never expose this row as-is to clients.
 * @param {string} deviceCode
 * @returns {Promise<Object|null>}
 */
export async function findDeviceByCodeWithSecret(deviceCode) {
  const query = `
    SELECT id, device_code, device_secret_hash, name, status, connection_status,
           last_seen_at, owner_id, created_at, claimed_at
    FROM devices
    WHERE device_code = $1
  `;
  const { rows } = await pool.query(query, [deviceCode]);
  return rows[0] || null;
}

/**
 * List all devices (used by admin panel, Task 2.6).
 * @returns {Promise<Object[]>}
 */
export async function listAllDevices() {
  const query = `
    SELECT id, device_code, name, status, connection_status, last_seen_at,
           owner_id, created_at, claimed_at
    FROM devices
    ORDER BY created_at DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
}

/**
 * List devices a given user has access to (any role), via device_access.
 * Used by GET /devices (Task 2.4).
 * @param {string} userId - UUID
 * @returns {Promise<Object[]>} each row includes the caller's `role` for that device
 */
export async function listDevicesForUser(userId) {
  const query = `
    SELECT d.id, d.device_code, d.name, d.status, d.connection_status,
           d.last_seen_at, d.owner_id, d.created_at, d.claimed_at,
           da.role AS role
    FROM devices d
    INNER JOIN device_access da ON da.device_id = d.id
    WHERE da.user_id = $1
    ORDER BY d.created_at DESC
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
}

/**
 * Claim an unclaimed device: set owner_id, status='claimed', claimed_at=now().
 * Only updates rows that are currently 'unclaimed' — protects against a
 * race where two users try to claim the same device at once.
 * @param {string} deviceId - UUID
 * @param {string} ownerId - UUID of the user claiming the device
 * @returns {Promise<Object|null>} the updated device row, or null if it
 *   wasn't unclaimed (already claimed or doesn't exist)
 */
export async function claimDevice(deviceId, ownerId) {
  const query = `
    UPDATE devices
    SET owner_id = $2, status = 'claimed', claimed_at = now()
    WHERE id = $1 AND status = 'unclaimed'
    RETURNING id, device_code, name, status, connection_status, last_seen_at,
              owner_id, created_at, claimed_at
  `;
  const { rows } = await pool.query(query, [deviceId, ownerId]);
  return rows[0] || null;
}

/**
 * Release a device back to unclaimed (Task "Lepas Alat" in rancangan).
 * @param {string} deviceId - UUID
 * @returns {Promise<Object|null>}
 */
export async function releaseDevice(deviceId) {
  const query = `
    UPDATE devices
    SET owner_id = NULL, status = 'unclaimed', claimed_at = NULL
    WHERE id = $1
    RETURNING id, device_code, name, status, connection_status, last_seen_at,
              owner_id, created_at, claimed_at
  `;
  const { rows } = await pool.query(query, [deviceId]);
  return rows[0] || null;
}

/**
 * Rename a device (PATCH /devices/:id, owner only — checked at service layer).
 * @param {string} deviceId - UUID
 * @param {string} name
 * @returns {Promise<Object|null>}
 */
export async function updateDeviceName(deviceId, name) {
  const query = `
    UPDATE devices
    SET name = $2
    WHERE id = $1
    RETURNING id, device_code, name, status, connection_status, last_seen_at,
              owner_id, created_at, claimed_at
  `;
  const { rows } = await pool.query(query, [deviceId, name]);
  return rows[0] || null;
}

/**
 * Update connection status + last_seen_at (used by MQTT status handler, Task 3.3).
 * @param {string} deviceId - UUID
 * @param {'online'|'offline'} connectionStatus
 * @returns {Promise<Object|null>}
 */
export async function updateDeviceConnectionStatus(deviceId, connectionStatus) {
  const query = `
    UPDATE devices
    SET connection_status = $2, last_seen_at = now()
    WHERE id = $1
    RETURNING id, device_code, name, status, connection_status, last_seen_at,
              owner_id, created_at, claimed_at
  `;
  const { rows } = await pool.query(query, [deviceId, connectionStatus]);
  return rows[0] || null;
}

/**
 * Update only last_seen_at, e.g. on every telemetry message (Task 3.2),
 * without touching connection_status.
 * @param {string} deviceId - UUID
 * @returns {Promise<void>}
 */
export async function touchDeviceLastSeen(deviceId) {
  await pool.query(`UPDATE devices SET last_seen_at = now() WHERE id = $1`, [deviceId]);
}