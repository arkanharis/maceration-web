import {
  listDeviceAccess,
  shareDeviceAccess,
  updateDeviceAccessRole,
  revokeDeviceAccess,
} from "../services/deviceAccessService.js";
import { DeviceError } from "../services/deviceService.js";

function handleError(err, res, logLabel) {
  if (err instanceof DeviceError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error(`[deviceAccessController.${logLabel}]`, err);
  return res.status(500).json({ error: "internal server error" });
}

/**
 * GET /api/v1/devices/:id/access
 * Owner-only: list everyone who has access to the device.
 */
export async function getDeviceAccessList(req, res) {
  try {
    const access = await listDeviceAccess({
      deviceId: req.params.id,
      requesterId: req.user.id,
    });
    return res.status(200).json({ access });
  } catch (err) {
    return handleError(err, res, "getDeviceAccessList");
  }
}

/**
 * POST /api/v1/devices/:id/access
 * Owner-only: share access to the device with another user, by email.
 * Body: { email, role }
 */
export async function postDeviceAccess(req, res) {
  try {
    const { email, role } = req.body || {};
    const access = await shareDeviceAccess({
      deviceId: req.params.id,
      requesterId: req.user.id,
      email,
      role,
    });
    return res.status(201).json({ access });
  } catch (err) {
    return handleError(err, res, "postDeviceAccess");
  }
}

/**
 * PATCH /api/v1/devices/:id/access/:userId
 * Owner-only: change a shared user's role (operator <-> viewer).
 * Body: { role }
 */
export async function patchDeviceAccess(req, res) {
  try {
    const { role } = req.body || {};
    const access = await updateDeviceAccessRole({
      deviceId: req.params.id,
      requesterId: req.user.id,
      targetUserId: req.params.userId,
      role,
    });
    return res.status(200).json({ access });
  } catch (err) {
    return handleError(err, res, "patchDeviceAccess");
  }
}

/**
 * DELETE /api/v1/devices/:id/access/:userId
 * Owner-only: revoke a user's access to the device.
 */
export async function deleteDeviceAccess(req, res) {
  try {
    await revokeDeviceAccess({
      deviceId: req.params.id,
      requesterId: req.user.id,
      targetUserId: req.params.userId,
    });
    return res.status(204).send();
  } catch (err) {
    return handleError(err, res, "deleteDeviceAccess");
  }
}