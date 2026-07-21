import crypto from "crypto";
import bcrypt from "bcrypt";
import { createDevice, getNextDeviceCodeNumber } from "../repositories/deviceRepository.js";

const SALT_ROUNDS = 10;
const DEVICE_CODE_PREFIX = "MC-";
const DEVICE_CODE_PAD_LENGTH = 4;
const MAX_GENERATE_RETRIES = 5;

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
  let lastError;

  for (let attempt = 0; attempt < MAX_GENERATE_RETRIES; attempt++) {
    const nextNum = await getNextDeviceCodeNumber();
    const deviceCode = formatDeviceCode(nextNum);
    const deviceSecret = generateDeviceSecret();
    const deviceSecretHash = await bcrypt.hash(deviceSecret, SALT_ROUNDS);

    try {
      const device = await createDevice({
        deviceCode,
        deviceSecretHash,
        name: name?.trim() || deviceCode,
      });
      return { device, deviceSecret };
    } catch (err) {
      // Unique violation on device_code (concurrent generation) — retry with a fresh number.
      if (err.code === "23505") {
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw new DeviceError(
    "failed to generate a unique device code after several attempts, please try again",
    500
  );
}