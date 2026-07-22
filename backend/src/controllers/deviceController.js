import {
  generateDevice,
  claimDeviceByCode,
  listMyDevices,
  getDeviceDetail,
  renameDevice,
  releaseDeviceForUser,
  DeviceError,
} from "../services/deviceService.js";

/**
 * POST /api/v1/admin/devices
 * Generates a new device with a unique device_code and a random device_secret.
 * The device_secret is returned in PLAINTEXT only in this response — it is
 * never stored or retrievable again (only its bcrypt hash is persisted).
 */
export async function adminGenerateDevice(req, res) {
  try {
    const { name } = req.body || {};
    const { device, deviceSecret } = await generateDevice({ name });

    return res.status(201).json({
      device_code: device.device_code,
      device_secret: deviceSecret,
      warning: "Catat device_secret ini sekarang — tidak akan ditampilkan lagi.",
      device: {
        id: device.id,
        device_code: device.device_code,
        name: device.name,
        status: device.status,
        connection_status: device.connection_status,
        created_at: device.created_at,
      },
    });
  } catch (err) {
    if (err instanceof DeviceError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("[deviceController.adminGenerateDevice]", err);
    return res.status(500).json({ error: "internal server error" });
  }
}

/**
 * POST /api/v1/devices/claim
 * Claims an unclaimed device (by device_code) on behalf of the logged-in user,
 * granting them the 'owner' role and recording a device_claimed event.
 */
export async function claimDevice(req, res) {
  try {
    const { device_code, device_secret } = req.body || {};
    const device = await claimDeviceByCode({
      deviceCode: device_code,
      deviceSecret: device_secret,
      userId: req.user.id,
    });

    return res.status(200).json({
      device: {
        id: device.id,
        device_code: device.device_code,
        name: device.name,
        status: device.status,
        connection_status: device.connection_status,
        owner_id: device.owner_id,
        claimed_at: device.claimed_at,
      },
    });
  } catch (err) {
    if (err instanceof DeviceError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("[deviceController.claimDevice]", err);
    return res.status(500).json({ error: "internal server error" });
  }
}

/**
 * GET /api/v1/devices
 * Lists all devices the logged-in user has access to (owner/operator/viewer),
 * including their role on each device.
 */
export async function listDevices(req, res) {
  try {
    const devices = await listMyDevices(req.user.id);
    return res.status(200).json({ devices });
  } catch (err) {
    console.error("[deviceController.listDevices]", err);
    return res.status(500).json({ error: "internal server error" });
  }
}

/**
 * GET /api/v1/devices/:id
 * Returns detail for a single device, including the caller's role on it.
 * 404 if the device doesn't exist, 403 if the user has no access to it.
 */
export async function getDevice(req, res) {
  try {
    const device = await getDeviceDetail({ deviceId: req.params.id, userId: req.user.id });
    return res.status(200).json({ device });
  } catch (err) {
    if (err instanceof DeviceError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("[deviceController.getDevice]", err);
    return res.status(500).json({ error: "internal server error" });
  }
}

/**
 * PATCH /api/v1/devices/:id
 * Rename a device. Owner only.
 * Body: { name }
 */
export async function patchDevice(req, res) {
  try {
    const { name } = req.body || {};
    const device = await renameDevice({ deviceId: req.params.id, userId: req.user.id, name });
    return res.status(200).json({ device });
  } catch (err) {
    if (err instanceof DeviceError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("[deviceController.patchDevice]", err);
    return res.status(500).json({ error: "internal server error" });
  }
}

/**
 * DELETE /api/v1/devices/:id
 * Release (unclaim) a device back to unclaimed state. Owner only.
 */
export async function deleteDevice(req, res) {
  try {
    const result = await releaseDeviceForUser({ deviceId: req.params.id, userId: req.user.id });
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof DeviceError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("[deviceController.deleteDevice]", err);
    return res.status(500).json({ error: "internal server error" });
  }
}