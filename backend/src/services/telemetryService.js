import { resolveDeviceId } from "./deviceCache.js";
import {
  touchDeviceLastSeen,
} from "../repositories/deviceRepository.js";
import { insertLog } from "../repositories/deviceLogRepository.js";
import { getIO } from "../config/socket.js";

/**
 * Handle an incoming telemetry MQTT message.
 *
 * Flow (per rancangan §1 "Alur data live"):
 *   1. Resolve device_code → device_id (shared cache, max 1 DB hit/min).
 *   2. Insert row into device_logs (history for graphs).
 *   3. Touch devices.last_seen_at.
 *   4. Broadcast telemetry_update to the Socket.IO room for this device.
 *
 * @param {string} deviceCode - e.g. "MC-0001"
 * @param {object} payload    - { temperature, rpm, relay, ts }
 */
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

  console.log(
    `[telemetry] ${deviceCode} | temp=${temperature}°C rpm=${rpm} log#${log.id}`
  );
}
