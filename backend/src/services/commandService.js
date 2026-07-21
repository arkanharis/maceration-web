import crypto from "crypto";
import { publishCommand } from "./mqttService.js";
import { findDeviceById } from "../repositories/deviceRepository.js";
import { getUserRoleForDevice } from "../repositories/deviceAccessRepository.js";
import { logEvent } from "../repositories/deviceEventRepository.js";
import { getIO } from "../config/socket.js";

/**
 * commandService — kirim perintah relay ke ESP32 via MQTT dan tunggu ACK.
 *
 * Flow (per rancangan §1 "Alur kontrol"):
 *   1. Cek role user — harus owner atau operator.
 *   2. Buat request_id unik, simpan Promise resolver di pendingAcks.
 *   3. Publish command ke topik maceration/{device_code}/command.
 *   4. Tunggu ACK dari ESP32 (via onCommandAck → resolveAck) dengan timeout.
 *   5. Kalau ACK diterima sebelum timeout → return hasilnya.
 *      Kalau timeout → lempar error (ESP32 mungkin offline / butuh waktu lama).
 *   6. Log event relay_toggled ke device_events.
 *
 * Dua jalur masuk: REST (POST /devices/:id/command) dan Socket.IO (send_command).
 * Keduanya memanggil sendCommand() di sini — satu source of truth.
 */

const VALID_ACTIONS   = ["set_relay"];
const VALID_RELAYS    = ["r1", "r2", "r3", "r4"];
const ACK_TIMEOUT_MS  = 8000; // 8 detik — cukup untuk ESP32 normal, tidak terlalu lama

// Map: request_id → { resolve, reject, timer }
const _pendingAcks = new Map();

export class CommandError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "CommandError";
    this.statusCode = statusCode;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a pending-ack slot and return a promise that resolves when the
 * ESP32 sends back command/ack with the matching request_id.
 * Auto-rejects after ACK_TIMEOUT_MS.
 *
 * @param {string} requestId
 * @returns {Promise<object>} the ack payload from the device
 */
function waitForAck(requestId) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      _pendingAcks.delete(requestId);
      reject(new CommandError("device did not acknowledge the command in time", 504));
    }, ACK_TIMEOUT_MS);

    _pendingAcks.set(requestId, { resolve, reject, timer });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: called by mqttService when command/ack arrives
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Called by the MQTT onCommandAck handler (index.js) when the ESP32 sends
 * back a command/ack message.  Resolves the matching pending promise.
 *
 * @param {string} deviceCode
 * @param {object} payload  - { request_id, success, relay }
 */
export function resolveCommandAck(deviceCode, payload) {
  const { request_id, success, relay } = payload;
  const pending = _pendingAcks.get(request_id);

  if (!pending) {
    // Ack arrived after timeout, or for an unknown request — safe to ignore
    console.warn(`[command] stale or unknown ack for request_id="${request_id}"`);
    return;
  }

  clearTimeout(pending.timer);
  _pendingAcks.delete(request_id);

  if (success) {
    pending.resolve({ request_id, success, relay });
  } else {
    pending.reject(new CommandError("device reported command failure", 502));
  }

  // Broadcast ack to all clients subscribed to this device (for UI feedback)
  // We need the device UUID for the room — resolve from ack payload's relay state
  // The broadcast is best-effort; caller (REST/socket) already has the result.
  console.log(`[command] ack received for ${deviceCode} req=${request_id} ok=${success}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: main entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send a relay command to a device and wait for the ESP32's ACK.
 *
 * @param {object} params
 * @param {string} params.deviceId - UUID of the target device
 * @param {string} params.userId   - UUID of the requesting user
 * @param {string} params.action   - "set_relay"
 * @param {string} params.relay    - "r1" | "r2" | "r3" | "r4"
 * @param {boolean} params.value   - true = ON, false = OFF
 * @returns {Promise<object>}  ack payload { request_id, success, relay }
 * @throws {CommandError}
 */
export async function sendCommand({ deviceId, userId, action, relay, value }) {
  // ── 1. Validate inputs ────────────────────────────────────────────────────
  if (!VALID_ACTIONS.includes(action)) {
    throw new CommandError(`invalid action "${action}"; must be one of: ${VALID_ACTIONS.join(", ")}`);
  }
  if (!VALID_RELAYS.includes(relay)) {
    throw new CommandError(`invalid relay "${relay}"; must be one of: ${VALID_RELAYS.join(", ")}`);
  }
  if (typeof value !== "boolean") {
    throw new CommandError('value must be a boolean (true = ON, false = OFF)');
  }

  // ── 2. Permission check ───────────────────────────────────────────────────
  const device = await findDeviceById(deviceId);
  if (!device) {
    throw new CommandError("device not found", 404);
  }

  const role = await getUserRoleForDevice(userId, deviceId);
  if (!role || role === "viewer") {
    throw new CommandError("only owner or operator can send commands", 403);
  }

  // ── 3. Publish command ────────────────────────────────────────────────────
  const requestId = crypto.randomUUID();
  const commandPayload = { action, relay, value, request_id: requestId };

  const ackPromise = waitForAck(requestId);
  await publishCommand(device.device_code, commandPayload);

  // ── 4. Wait for ack ───────────────────────────────────────────────────────
  const ack = await ackPromise;

  // ── 5. Log event ──────────────────────────────────────────────────────────
  await logEvent({
    deviceId,
    userId,
    eventType: "relay_toggled",
    detail: { relay, value, request_id: requestId, success: ack.success },
  });

  // ── 6. Broadcast ack to room (so other open tabs / users see it) ──────────
  getIO().to(deviceId).emit("command_ack", {
    deviceId,
    requestId,
    success: ack.success,
    relay: ack.relay,
  });

  return ack;
}
