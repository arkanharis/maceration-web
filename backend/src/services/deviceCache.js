import { findDeviceByCode } from "../repositories/deviceRepository.js";

/**
 * In-process TTL cache: device_code (string) → { id: UUID, expiresAt: timestamp }.
 *
 * Shared by telemetryService, statusService, and any future MQTT handler so
 * each device_code is only looked up from the DB at most once per minute —
 * even when telemetry arrives every second.
 */
const CACHE_TTL_MS = 60 * 1000; // 1 minute
const _cache = new Map();

/**
 * Resolve a device_code string to its UUID primary key.
 * Returns null if the device_code doesn't exist in the database.
 *
 * @param {string} deviceCode - e.g. "MC-0001"
 * @returns {Promise<string|null>} UUID or null
 */
export async function resolveDeviceId(deviceCode) {
  const cached = _cache.get(deviceCode);
  if (cached && cached.expiresAt > Date.now()) return cached.id;

  const device = await findDeviceByCode(deviceCode);
  if (!device) return null;

  _cache.set(deviceCode, {
    id: device.id,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return device.id;
}

/**
 * Evict a specific entry from the cache (e.g. after a device is released/deleted).
 * @param {string} deviceCode
 */
export function evictDeviceCache(deviceCode) {
  _cache.delete(deviceCode);
}
