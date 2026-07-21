import { findDeviceById } from "../repositories/deviceRepository.js";
import {
  grantAccess,
  getUserRoleForDevice,
  listAccessForDevice,
  updateAccessRole,
  revokeAccess,
} from "../repositories/deviceAccessRepository.js";
import { findUserByEmail, findUserById } from "../repositories/userRepository.js";
import { logEvent } from "../repositories/deviceEventRepository.js";
import { DeviceError } from "./deviceService.js";

const SHAREABLE_ROLES = ["operator", "viewer"];

/**
 * Verify the requester is the owner of the device. Throws otherwise.
 * Used by every access-management action (Task 2.5) — only owners may
 * view/manage who has access to their device.
 * @param {string} deviceId - UUID
 * @param {string} requesterId - UUID
 * @returns {Promise<Object>} the device row (so callers don't need a second lookup)
 * @throws {DeviceError} 404 if device doesn't exist, 403 if requester isn't owner
 */
async function requireOwner(deviceId, requesterId) {
  const device = await findDeviceById(deviceId);
  if (!device) {
    throw new DeviceError("device not found", 404);
  }

  const role = await getUserRoleForDevice(requesterId, deviceId);
  if (role !== "owner") {
    throw new DeviceError("only the device owner can manage access", 403);
  }

  return device;
}

/**
 * GET /devices/:id/access — list everyone who has access to a device.
 * @param {Object} params
 * @param {string} params.deviceId - UUID
 * @param {string} params.requesterId - UUID of the logged-in user
 * @returns {Promise<Object[]>}
 */
export async function listDeviceAccess({ deviceId, requesterId }) {
  await requireOwner(deviceId, requesterId);
  return listAccessForDevice(deviceId);
}

/**
 * POST /devices/:id/access — share access to a device with another user, by email.
 * @param {Object} params
 * @param {string} params.deviceId - UUID
 * @param {string} params.requesterId - UUID of the logged-in user (must be owner)
 * @param {string} params.email - email of the user to share access with
 * @param {string} params.role - 'operator' | 'viewer'
 * @returns {Promise<Object>} the created device_access row
 * @throws {DeviceError} 400 invalid input, 403 not owner, 404 email not registered,
 *   409 user already has access
 */
export async function shareDeviceAccess({ deviceId, requesterId, email, role }) {
  await requireOwner(deviceId, requesterId);

  const trimmedEmail = email?.trim().toLowerCase();
  if (!trimmedEmail) {
    throw new DeviceError("email is required", 400);
  }
  if (!SHAREABLE_ROLES.includes(role)) {
    throw new DeviceError(`role must be one of: ${SHAREABLE_ROLES.join(", ")}`, 400);
  }

  const targetUser = await findUserByEmail(trimmedEmail);
  if (!targetUser) {
    throw new DeviceError(`no registered user found with email "${trimmedEmail}"`, 404);
  }

  const existingRole = await getUserRoleForDevice(targetUser.id, deviceId);
  if (existingRole) {
    throw new DeviceError(`user "${trimmedEmail}" already has access to this device`, 409);
  }

  let access;
  try {
    access = await grantAccess({
      deviceId,
      userId: targetUser.id,
      role,
      grantedBy: requesterId,
    });
  } catch (err) {
    // Unique violation on (device_id, user_id) — race with a concurrent share.
    if (err.code === "23505") {
      throw new DeviceError(`user "${trimmedEmail}" already has access to this device`, 409);
    }
    throw err;
  }

  await logEvent({
    deviceId,
    userId: requesterId,
    eventType: "access_granted",
    detail: { target_user_id: targetUser.id, target_email: trimmedEmail, role },
  });

  return access;
}

/**
 * PATCH /devices/:id/access/:userId — change an existing user's role (operator <-> viewer).
 * @param {Object} params
 * @param {string} params.deviceId - UUID
 * @param {string} params.requesterId - UUID of the logged-in user (must be owner)
 * @param {string} params.targetUserId - UUID of the user whose role is changing
 * @param {string} params.role - 'operator' | 'viewer'
 * @returns {Promise<Object>} the updated device_access row
 * @throws {DeviceError} 400 invalid role, 403 not owner, 404 target has no access
 */
export async function updateDeviceAccessRole({ deviceId, requesterId, targetUserId, role }) {
  await requireOwner(deviceId, requesterId);

  if (!SHAREABLE_ROLES.includes(role)) {
    throw new DeviceError(`role must be one of: ${SHAREABLE_ROLES.join(", ")}`, 400);
  }
  if (targetUserId === requesterId) {
    throw new DeviceError("owner's own role cannot be changed this way", 400);
  }

  const existingRole = await getUserRoleForDevice(targetUserId, deviceId);
  if (!existingRole) {
    throw new DeviceError("that user does not have access to this device", 404);
  }

  const updated = await updateAccessRole(deviceId, targetUserId, role);

  await logEvent({
    deviceId,
    userId: requesterId,
    eventType: "access_role_updated",
    detail: { target_user_id: targetUserId, role },
  });

  return updated;
}

/**
 * DELETE /devices/:id/access/:userId — revoke a user's access to a device.
 * @param {Object} params
 * @param {string} params.deviceId - UUID
 * @param {string} params.requesterId - UUID of the logged-in user (must be owner)
 * @param {string} params.targetUserId - UUID of the user losing access
 * @returns {Promise<void>}
 * @throws {DeviceError} 400 trying to revoke the owner, 403 not owner, 404 no such access
 */
export async function revokeDeviceAccess({ deviceId, requesterId, targetUserId }) {
  await requireOwner(deviceId, requesterId);

  if (targetUserId === requesterId) {
    throw new DeviceError(
      "owner cannot revoke their own access — release the device instead",
      400
    );
  }

  const existingRole = await getUserRoleForDevice(targetUserId, deviceId);
  if (!existingRole) {
    throw new DeviceError("that user does not have access to this device", 404);
  }

  await revokeAccess(deviceId, targetUserId);

  const targetUser = await findUserById(targetUserId);
  await logEvent({
    deviceId,
    userId: requesterId,
    eventType: "access_revoked",
    detail: { target_user_id: targetUserId, target_email: targetUser?.email ?? null },
  });
}