import { listLogsForDevice } from "../repositories/deviceLogRepository.js";
import { listEventsForDevice } from "../repositories/deviceEventRepository.js";
import { getUserRoleForDevice } from "../repositories/deviceAccessRepository.js";
import { findDeviceById } from "../repositories/deviceRepository.js";
import { DeviceError } from "./deviceService.js";

/**
 * Shared guard: verify the user has any access to the device (owner/operator/viewer).
 * Returns the role so callers don't need a second lookup.
 */
async function requireAnyAccess(deviceId, userId) {
  const device = await findDeviceById(deviceId);
  if (!device) throw new DeviceError("device not found", 404);

  const role = await getUserRoleForDevice(userId, deviceId);
  if (!role) throw new DeviceError("you do not have access to this device", 403);

  return { device, role };
}

// Default and max window sizes for history query
const DEFAULT_HISTORY_HOURS = 1;
const MAX_HISTORY_DAYS = 30;

/**
 * Get sensor history for a device within a time range.
 * GET /devices/:id/history?from=<ISO>&to=<ISO>
 *
 * Query params:
 *   from  - ISO 8601 datetime (default: 1 hour ago)
 *   to    - ISO 8601 datetime (default: now)
 *
 * @param {string} deviceId
 * @param {string} userId
 * @param {string|undefined} fromStr
 * @param {string|undefined} toStr
 * @returns {Promise<Object[]>}
 */
export async function getDeviceHistory({ deviceId, userId, fromStr, toStr }) {
  await requireAnyAccess(deviceId, userId);

  const to   = toStr   ? new Date(toStr)   : new Date();
  const from = fromStr ? new Date(fromStr) : new Date(to - DEFAULT_HISTORY_HOURS * 60 * 60 * 1000);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    throw new DeviceError("invalid date format for 'from' or 'to' — use ISO 8601", 400);
  }
  if (from >= to) {
    throw new DeviceError("'from' must be earlier than 'to'", 400);
  }

  const maxRange = MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000;
  if (to - from > maxRange) {
    throw new DeviceError(`time range cannot exceed ${MAX_HISTORY_DAYS} days`, 400);
  }

  return listLogsForDevice(deviceId, from, to);
}

/**
 * Get audit event log for a device.
 * GET /devices/:id/events?limit=<n>
 *
 * @param {string} deviceId
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
export async function getDeviceEvents({ deviceId, userId, limit = 100 }) {
  await requireAnyAccess(deviceId, userId);

  const safeLimit = Math.min(Math.max(1, Number(limit) || 100), 500);
  return listEventsForDevice(deviceId, safeLimit);
}
