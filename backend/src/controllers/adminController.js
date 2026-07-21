import {
  adminListAllDevices,
  adminListAllUsers,
  adminUpdateUserRole,
  AdminError,
} from "../services/adminService.js";

/**
 * GET /api/v1/admin/devices
 * Returns every device in the system (claimed + unclaimed), including owner info.
 * Superadmin only.
 */
export async function adminGetAllDevices(req, res) {
  try {
    const devices = await adminListAllDevices();
    return res.status(200).json({ devices });
  } catch (err) {
    console.error("[adminController.adminGetAllDevices]", err);
    return res.status(500).json({ error: "internal server error" });
  }
}

/**
 * GET /api/v1/admin/users
 * Returns all users in the system, with owned-device counts.
 * Superadmin only.
 */
export async function adminGetAllUsers(req, res) {
  try {
    const users = await adminListAllUsers();
    return res.status(200).json({ users });
  } catch (err) {
    console.error("[adminController.adminGetAllUsers]", err);
    return res.status(500).json({ error: "internal server error" });
  }
}

/**
 * PATCH /api/v1/admin/users/:id
 * Updates the global_role of a user.
 * Body: { global_role: 'user' | 'superadmin' }
 * Superadmin only; cannot change own role.
 */
export async function adminPatchUserRole(req, res) {
  try {
    const { global_role } = req.body || {};
    if (!global_role) {
      return res.status(400).json({ error: "global_role is required in request body" });
    }

    const updatedUser = await adminUpdateUserRole({
      targetUserId: req.params.id,
      callerUserId: req.user.id,
      globalRole: global_role,
    });

    return res.status(200).json({ user: updatedUser });
  } catch (err) {
    if (err instanceof AdminError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("[adminController.adminPatchUserRole]", err);
    return res.status(500).json({ error: "internal server error" });
  }
}
