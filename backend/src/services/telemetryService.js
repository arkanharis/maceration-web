import { findDeviceByCode } from "../repositories/deviceRepository.js";
import {
  touchDeviceLastSeen,
  updateDeviceConnectionStatus,
} from "../repositories/deviceRepository.js";
import { insertLog } from "../repositories/deviceLogRepository.js";
import { getIO } from "../config/socket.js";

/**
 * Handle an incoming telemetry MQTT message.
 *
 * Flow (per rancangan §1 "Alur data live"):
 *   1. Resolve device_code → device_id (with caching to avoid a DB hit every second).
 *   2. Insert row into device_logs (history for graphs).
 *   3. Touch devices.last_seen_at.
 *   4. Broadcast telemetry_update to the Socket.IO room for this device.
 *
 * Steps 2–4 are fire-and-forget (no await on the broadcast) so the MQTT
 * message handler returns quickly and doesn't block the broker client.
 *
 * @param {string} deviceCode - e.g. "MC-0001"
 * @param {object} payload    - { temperature, rpm, relay, ts }
 */

// ── Simple in-process cache: device_code → device_id ──────────────────────
// TTL-based to handle device deletion/re-creation without restarting server.
const CACHE_TTL_MS = 60 * 1000; // 1 minute
const _deviceIdCache = new Map(); // deviceCode → { id, expiresAt }

async function resolveDeviceId(deviceCode) {
  const cached = _deviceIdCache.get(deviceCode);
  if (cached && cached.expiresAt > Date.now()) return cached.id;

  const device = await findDeviceByCode(deviceCode);
  if (!device) return null;

  _deviceIdCache.set(deviceCode, {
    id: device.id,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return device.id;
}

// ─────────────────────────────────────────────────────────────────────────────

export async function handleTelemetry(deviceCode, payload) {
  const { temperature, rpm, relay, ts } = payload;

  // Basic payload validation — silently drop if malformed
  if (temperature === undefined || rpm === undefined || !relay) {
    console.warn(`[telemetry] malformed payload from ${deviceCode}:`, payload);
    return;
  }

  const deviceId = await resolveDeviceId(deviceCode);
  if (!deviceId) {
    console.warn(`[telemetry] unknown device_code "${deviceCode}" — ignoring`);
    return;
  }

  // Run DB writes in parallel (non-blocking for each other)
  const [log] = await Promise.all([
    insertLog({ deviceId, temperature, rpm, relayState: relay }),
    touchDeviceLastSeen(deviceId),
  ]);

  // Broadcast to all clients subscribed to this device's room
  getIO().to(deviceId).emit("telemetry_update", {
    deviceId,
    temperature,
    rpm,
    relay,
    ts: ts ?? Math.floor(Date.now() / 1000),
  });

  // Debug log (one liner — easy to grep, easy to silence later)
  console.log(
    `[telemetry] ${deviceCode} | temp=${temperature}°C rpm=${rpm} log#${log.id}`
  );
}
