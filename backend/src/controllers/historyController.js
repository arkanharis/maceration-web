import { getDeviceHistory, getDeviceEvents } from "../services/historyService.js";
import { DeviceError } from "../services/deviceService.js";

/**
 * GET /api/v1/devices/:id/history
 * Query params: from (ISO), to (ISO) — defaults to last 1 hour
 * Access: owner / operator / viewer
 */
export async function getHistory(req, res) {
  try {
    const logs = await getDeviceHistory({
      deviceId: req.params.id,
      userId:   req.user.id,
      fromStr:  req.query.from,
      toStr:    req.query.to,
    });
    return res.status(200).json({ logs });
  } catch (err) {
    if (err instanceof DeviceError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("[historyController.getHistory]", err);
    return res.status(500).json({ error: "internal server error" });
  }
}

/**
 * GET /api/v1/devices/:id/events
 * Query params: limit (default 100, max 500)
 * Access: owner / operator / viewer
 */
export async function getEvents(req, res) {
  try {
    const events = await getDeviceEvents({
      deviceId: req.params.id,
      userId:   req.user.id,
      limit:    req.query.limit,
    });
    return res.status(200).json({ events });
  } catch (err) {
    if (err instanceof DeviceError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("[historyController.getEvents]", err);
    return res.status(500).json({ error: "internal server error" });
  }
}
