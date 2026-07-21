import { generateDevice, DeviceError } from "../services/deviceService.js";

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