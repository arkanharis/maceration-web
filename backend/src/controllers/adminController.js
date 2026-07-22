import {
  adminListAllDevices,
  adminListAllUsers,
  adminEditUser,
  adminDeleteUser,
  adminUnclaimDevice,
  adminDeleteDevice,
  AdminError,
} from "../services/adminService.js";

function handleError(err, res, fn) {
  if (err instanceof AdminError) return res.status(err.statusCode).json({ error: err.message });
  console.error(`[adminController.${fn}]`, err);
  return res.status(500).json({ error: "internal server error" });
}

/** GET /api/v1/admin/devices?search= */
export async function adminGetAllDevices(req, res) {
  try {
    const devices = await adminListAllDevices({ search: req.query.search });
    return res.status(200).json({ devices });
  } catch (err) { return handleError(err, res, "adminGetAllDevices"); }
}

/** GET /api/v1/admin/users?search= */
export async function adminGetAllUsers(req, res) {
  try {
    const users = await adminListAllUsers({ search: req.query.search });
    return res.status(200).json({ users });
  } catch (err) { return handleError(err, res, "adminGetAllUsers"); }
}

/** PATCH /api/v1/admin/users/:id — edit name/email */
export async function adminPatchUser(req, res) {
  try {
    const { name, email } = req.body || {};
    const user = await adminEditUser({
      targetUserId: req.params.id,
      callerUserId: req.user.id,
      name,
      email,
    });
    return res.status(200).json({ user });
  } catch (err) { return handleError(err, res, "adminPatchUser"); }
}

/** DELETE /api/v1/admin/users/:id */
export async function adminDeleteUserHandler(req, res) {
  try {
    const result = await adminDeleteUser({
      targetUserId: req.params.id,
      callerUserId: req.user.id,
    });
    return res.status(200).json(result);
  } catch (err) { return handleError(err, res, "adminDeleteUser"); }
}

/** DELETE /api/v1/admin/devices/:id/claim — unclaim device */
export async function adminUnclaimDeviceHandler(req, res) {
  try {
    const result = await adminUnclaimDevice(req.params.id);
    return res.status(200).json(result);
  } catch (err) { return handleError(err, res, "adminUnclaimDevice"); }
}

/** DELETE /api/v1/admin/devices/:id — permanently delete device */
export async function adminDeleteDeviceHandler(req, res) {
  try {
    const result = await adminDeleteDevice(req.params.id);
    return res.status(200).json(result);
  } catch (err) { return handleError(err, res, "adminDeleteDevice"); }
}
