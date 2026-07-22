import { pool } from "../config/db.js";
import bcrypt from "bcrypt";
import {
  findUserById,
  findUserByEmail,
  updateUserProfile,
  adminUpdateUser,
  deleteUser,
  listAllUsers,
} from "../repositories/userRepository.js";
import { releaseDevice } from "../repositories/deviceRepository.js";
import { listAllDevices, deleteDevice } from "../repositories/deviceRepository.js";

export class AdminError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "AdminError";
    this.statusCode = statusCode;
  }
}

// ── List ────────────────────────────────────────────────────────────────────

export async function adminListAllDevices({ search } = {}) {
  return listAllDevices({ search });
}

export async function adminListAllUsers({ search } = {}) {
  return listAllUsers({ search });
}

// ── Edit User ───────────────────────────────────────────────────────────────

/**
 * Admin: update a user's name and/or email.
 * Prevents editing own account from admin panel (use /auth/me instead).
 */
export async function adminEditUser({ targetUserId, callerUserId, name, email }) {
  if (!name && !email) {
    throw new AdminError("at least one field (name or email) is required", 400);
  }
  if (targetUserId === callerUserId) {
    throw new AdminError("use /auth/me to edit your own profile", 403);
  }

  const user = await findUserById(targetUserId);
  if (!user) throw new AdminError("user not found", 404);

  // Check email uniqueness if changing email
  if (email && email !== user.email) {
    const existing = await findUserByEmail(email);
    if (existing) throw new AdminError("email already in use", 409);
  }

  return adminUpdateUser(targetUserId, {
    name:  name?.trim()  || undefined,
    email: email?.trim() || undefined,
  });
}

// ── Delete User ─────────────────────────────────────────────────────────────

/**
 * Admin: delete a user.
 * - Devices they own are unclaimed (not deleted).
 * - Their device_access entries cascade-deleted via FK.
 * Cannot delete yourself.
 */
export async function adminDeleteUser({ targetUserId, callerUserId }) {
  if (targetUserId === callerUserId) {
    throw new AdminError("cannot delete your own account", 403);
  }

  const user = await findUserById(targetUserId);
  if (!user) throw new AdminError("user not found", 404);

  // Unclaim all devices this user owns before deleting them
  await pool.query(
    `UPDATE devices SET owner_id = NULL, status = 'unclaimed', claimed_at = NULL
     WHERE owner_id = $1`,
    [targetUserId]
  );

  const deleted = await deleteUser(targetUserId);
  if (!deleted) throw new AdminError("user not found", 404);

  return { message: `user ${user.email} deleted successfully` };
}

// ── Device Management ────────────────────────────────────────────────────────

/**
 * Admin: unclaim a device (reset to unclaimed, remove all device_access).
 */
export async function adminUnclaimDevice(deviceId) {
  await pool.query(
    `UPDATE devices SET owner_id = NULL, status = 'unclaimed', claimed_at = NULL
     WHERE id = $1`,
    [deviceId]
  );
  await pool.query(`DELETE FROM device_access WHERE device_id = $1`, [deviceId]);
  return { message: "device unclaimed successfully" };
}

/**
 * Admin: permanently delete a device (cascades: access, logs, events via FK ON DELETE CASCADE).
 */
export async function adminDeleteDevice(deviceId) {
  const deleted = await deleteDevice(deviceId);
  if (!deleted) throw new AdminError("device not found", 404);
  return { message: "device deleted successfully" };
}
