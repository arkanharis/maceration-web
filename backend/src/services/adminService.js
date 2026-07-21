import { listAllDevices } from "../repositories/deviceRepository.js";
import { listAllUsers, findUserById, updateUserRole } from "../repositories/userRepository.js";

export class AdminError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "AdminError";
    this.statusCode = statusCode;
  }
}

const VALID_GLOBAL_ROLES = ["user", "superadmin"];

/**
 * Return every device in the system (unclaimed + claimed), with owner info.
 * Admin-only (Task 2.6).
 * @returns {Promise<Object[]>}
 */
export async function adminListAllDevices() {
  return listAllDevices();
}

/**
 * Return every user in the system, with their owned-device count.
 * Admin-only (Task 2.6).
 * @returns {Promise<Object[]>}
 */
export async function adminListAllUsers() {
  return listAllUsers();
}

/**
 * Update the global_role of a user (promote to superadmin, or demote back to user).
 * Prevents a superadmin from accidentally changing their own role.
 * Admin-only (Task 2.6).
 *
 * @param {Object} params
 * @param {string} params.targetUserId - UUID of the user to update
 * @param {string} params.callerUserId - UUID of the superadmin making the request
 * @param {string} params.globalRole   - 'user' | 'superadmin'
 * @returns {Promise<Object>} the updated user row
 * @throws {AdminError} 400 invalid role | 404 user not found | 403 self-demotion
 */
export async function adminUpdateUserRole({ targetUserId, callerUserId, globalRole }) {
  if (!VALID_GLOBAL_ROLES.includes(globalRole)) {
    throw new AdminError(
      `invalid global_role "${globalRole}"; must be one of: ${VALID_GLOBAL_ROLES.join(", ")}`,
      400
    );
  }

  if (targetUserId === callerUserId) {
    throw new AdminError("superadmin cannot change their own global_role", 403);
  }

  const user = await findUserById(targetUserId);
  if (!user) {
    throw new AdminError("user not found", 404);
  }

  return updateUserRole(targetUserId, globalRole);
}
