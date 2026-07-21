import { sendCommand, CommandError } from "../services/commandService.js";

/**
 * POST /api/v1/devices/:id/command
 * Body: { action, relay, value }
 *
 * Sends a relay command to the device via MQTT and waits for the ESP32 ACK.
 * Requires owner or operator role on the device.
 */
export async function postDeviceCommand(req, res) {
  try {
    const { action, relay, value } = req.body || {};

    if (!action || !relay || value === undefined) {
      return res.status(400).json({ error: "action, relay, and value are required" });
    }

    const ack = await sendCommand({
      deviceId: req.params.id,
      userId: req.user.id,
      action,
      relay,
      value,
    });

    return res.status(200).json({ ack });
  } catch (err) {
    if (err instanceof CommandError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("[commandController.postDeviceCommand]", err);
    return res.status(500).json({ error: "internal server error" });
  }
}
