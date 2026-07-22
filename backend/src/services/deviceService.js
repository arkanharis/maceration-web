import crypto from "crypto";
import bcrypt from "bcrypt";
import {
  createDevice,
  findDeviceByCode,
  findDeviceByCodeWithSecret,
  findDeviceById,
  getNextDeviceCodeNumber,
  claimDevice,
  listDevicesForUser,
  updateDeviceName,
  releaseDevice,
} from "../repositories/deviceRepository.js";
import { grantAccess, getUserRoleForDevice } from "../repositories/deviceAccessRepository.js";
import { logEvent } from "../repositories/deviceEventRepository.js";
import { pool } from "../config/db.js";

const SALT_ROUNDS = 10;
const MAX_GENERATE_RETRIES = 5;
const DEVICE_CODE_PREFIX = "MC-";
const DEVICE_CODE_PAD_LENGTH = 4;

export class DeviceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "DeviceError";
    this.statusCode = statusCode;
  }
}

/**
 * Format a numeric suffix into a device_code, e.g. 4 -> "MC-0004".
 * @param {number} num
 * @returns {string}
 */
function formatDeviceCode(num) {
  return `${DEVICE_CODE_PREFIX}${String(num).padStart(DEVICE_CODE_PAD_LENGTH, "0")}`;
}

/**
 * Generate a cryptographically random device secret (plaintext).
 * 24 random bytes -> 32-char base64url string, enough entropy for a
 * device credential and reasonably short to type/copy manually.
 * @returns {string}
 */
function generateDeviceSecret() {
  return crypto.randomBytes(24).toString("base64url");
}

/**
 * Generate a new device: auto-assigns a unique device_code, generates a
 * random device_secret, stores only the hash, and returns the plaintext
 * secret ONCE (the caller — the controller — must never log or persist it
 * beyond this response).
 *
 * @param {Object} params
 * @param {string} [params.name] - optional display name; defaults to the device_code
 * @returns {Promise<{device: Object, deviceSecret: string}>}
 */
export async function generateDevice({ name } = {}) {
  const nextNumber = await getNextDeviceCodeNumber();
  const deviceCode = formatDeviceCode(nextNumber);
  const deviceSecret = generateDeviceSecret();
  const deviceSecretHash = await bcrypt.hash(deviceSecret, SALT_ROUNDS);

  const device = await createDevice({
    deviceCode,
    deviceSecretHash,
    name: name?.trim() || deviceCode,
  });

  return { device, deviceSecret };
}

/**
 * Claim an unclaimed device on behalf of a user: sets owner_id/status on the
 * device, grants that user the 'owner' role in device_access, and records a
 * 'device_claimed' event.
 *
 * @param {Object} params
 * @param {string} params.deviceCode - device_code from the device's sticker, e.g. "MC-0001"
 * @param {string} params.userId - UUID of the user claiming the device
 * @returns {Promise<Object>} the claimed device row
 * @throws {DeviceError} 404 if device_code doesn't exist, 409 if already claimed
 */
export async function claimDeviceByCode({ deviceCode, deviceSecret, userId }) {
  const code = deviceCode?.trim();
  if (!code) {
    throw new DeviceError("device_code is required", 400);
  }
  if (!deviceSecret || !deviceSecret.trim()) {
    throw new DeviceError("device_secret is required", 400);
  }

  const existing = await findDeviceByCodeWithSecret(code);
  if (!existing) {
    throw new DeviceError(`no device found with device_code "${code}"`, 404);
  }
  if (existing.status !== "unclaimed") {
    throw new DeviceError(`device "${code}" has already been claimed`, 409);
  }

  const trimmedSecret = deviceSecret.trim();
  const secretMatches = await bcrypt.compare(trimmedSecret, existing.device_secret_hash);
  if (!secretMatches) {
    throw new DeviceError("device_secret is incorrect", 401);
  }

  const claimed = await claimDevice(existing.id, userId);
  if (!claimed) {
    throw new DeviceError(`device "${code}" has already been claimed`, 409);
  }

  await grantAccess({ deviceId: claimed.id, userId, role: "owner", grantedBy: userId });
  await logEvent({
    deviceId: claimed.id,
    userId,
    eventType: "device_claimed",
    detail: { device_code: claimed.device_code },
  });

  return claimed;
}

/**
 * List all devices a user has access to (any role: owner/operator/viewer).
 * Used by GET /devices (Task 2.4).
 * @param {string} userId - UUID
 * @returns {Promise<Object[]>} each row includes the caller's `role` for that device
 */
export async function listMyDevices(userId) {
  return listDevicesForUser(userId);
}

/**
 * Get a single device's detail, enforcing that the requesting user has some
 * access (owner/operator/viewer) to it.
 * @param {Object} params
 * @param {string} params.deviceId - UUID
 * @param {string} params.userId - UUID
 * @returns {Promise<Object>} device row plus the caller's `role`
 * @throws {DeviceError} 404 if the device doesn't exist, 403 if the user has no access
 */
export async function getDeviceDetail({ deviceId, userId }) {
  const device = await findDeviceById(deviceId);
  if (!device) throw new DeviceError("device not found", 404);

  const role = await getUserRoleForDevice(userId, deviceId);
  if (!role) throw new DeviceError("you do not have access to this device", 403);

  return { ...device, role };
}

/**
 * Task F: Rename a device. Owner only.
 */
export async function renameDevice({ deviceId, userId, name }) {
  if (!name || !name.trim()) throw new DeviceError("name is required", 400);

  const role = await getUserRoleForDevice(userId, deviceId);
  if (!role) throw new DeviceError("device not found or no access", 404);
  if (role !== "owner") throw new DeviceError("only the owner can rename a device", 403);

  const device = await updateDeviceName(deviceId, name.trim());
  if (!device) throw new DeviceError("device not found", 404);

  await logEvent({ deviceId, userId, eventType: "device_renamed", detail: { name: name.trim() } });
  return device;
}

/**
 * Release a device (owner unclaims it): removes all access, resets status.
 */
export async function releaseDeviceForUser({ deviceId, userId }) {
  const role = await getUserRoleForDevice(userId, deviceId);
  if (!role) throw new DeviceError("device not found or no access", 404);
  if (role !== "owner") throw new DeviceError("only the owner can release a device", 403);

  await pool.query(`DELETE FROM device_access WHERE device_id = $1`, [deviceId]);
  await releaseDevice(deviceId);

  return { message: "device released successfully" };
}