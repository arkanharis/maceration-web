import { resolveDeviceId } from "./deviceCache.js";
import { updateDeviceConnectionStatus } from "../repositories/deviceRepository.js";
import { logEvent } from "../repositories/deviceEventRepository.js";
import { getIO } from "../config/socket.js";

/**
 * Handle an incoming status MQTT message (online / offline).
 *
 * This topic is published in two ways:
 *   - Explicitly by the ESP32 on connect: { state: "online", ip: "...", ts: ... }
 *   - Automatically by the Mosquitto broker as an LWT when the device
 *     disconnects unexpectedly: { state: "offline" }
 *
 * Flow:
 *   1. Resolve device_code → device_id.
 *   2. Update devices.connection_status + last_seen_at.
 *   3. Insert a device_events row ("device_online" | "device_offline").
 *   4. Broadcast device_status_changed to the Socket.IO room.
 *
 * @param {string} deviceCode - e.g. "MC-0001"
 * @param {object} payload    - { state: "online"|"offline", ip?, ts? }
 */
export async function handleStatus(deviceCode, payload) {
  const { state } = payload;

  if (state !== "online" && state !== "offline") {
    console.warn(`[status] unexpected state "${state}" from ${deviceCode} — ignoring`);
    return;
  }

  const deviceId = await resolveDeviceId(deviceCode);
  if (!deviceId) {
    console.warn(`[status] unknown device_code "${deviceCode}" — ignoring`);
    return;
  }

  // 1. Persist connection status
  await updateDeviceConnectionStatus(deviceId, state);

  // 2. Audit event (no user — this comes from the device/broker itself)
  await logEvent({
    deviceId,
    userId: null,
    eventType: state === "online" ? "device_online" : "device_offline",
    detail: {
      ip: payload.ip ?? null,
      ts: payload.ts ?? null,
    },
  });

  // 3. Broadcast to all subscribed browser clients
  getIO().to(deviceId).emit("device_status_changed", {
    deviceId,
    status: state,
  });

  console.log(`[status] ${deviceCode} is now ${state.toUpperCase()}`);
}
