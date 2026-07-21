import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import { findUserById } from "../repositories/userRepository.js";
import { getUserRoleForDevice } from "../repositories/deviceAccessRepository.js";
import { findDeviceById } from "../repositories/deviceRepository.js";

/**
 * Socket.IO singleton.
 *
 * Initialised once in index.js by calling initSocketIO(httpServer).
 * All other modules that need to emit events call getIO().
 *
 * Room naming convention: one room per device_id UUID.
 * Clients join a room by emitting `subscribe_device` — the server verifies
 * their JWT and checks that they have at least viewer access before joining.
 */

let _io = null;

// ─────────────────────────────────────────────────────────────────────────────
// JWT auth middleware for Socket.IO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Socket.IO middleware that validates the JWT sent in the handshake.
 *
 * Clients must pass the token either as:
 *   - auth:  socket = io(url, { auth: { token: "<jwt>" } })   ← preferred
 *   - query: socket = io(url, { query: { token: "<jwt>" } })  ← fallback
 *
 * On success, attaches socket.user (same shape as req.user in REST routes).
 */
async function authenticateSocket(socket, next) {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token;

    if (!token) {
      return next(new Error("auth:missing_token"));
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return next(new Error("auth:invalid_token"));
    }

    const user = await findUserById(decoded.id);
    if (!user) {
      return next(new Error("auth:user_not_found"));
    }

    socket.user = user;
    next();
  } catch (err) {
    console.error("[socket.io] auth error:", err);
    next(new Error("auth:internal_error"));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-connection event handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register all event handlers for a single authenticated socket connection.
 * @param {import("socket.io").Socket} socket
 */
function registerSocketHandlers(socket) {
  const { user } = socket;
  console.log(`[socket.io] connected: ${socket.id} (user: ${user.email})`);

  // ── subscribe_device ───────────────────────────────────────────────────────
  /**
   * Client emits: { deviceId: "<uuid>" }
   * Server checks access, then joins the socket to room `deviceId`.
   * Acknowledges with: { ok: true, role } on success, { ok: false, error } on failure.
   */
  socket.on("subscribe_device", async ({ deviceId } = {}, ack) => {
    const respond = typeof ack === "function" ? ack : () => {};

    try {
      if (!deviceId) {
        return respond({ ok: false, error: "deviceId is required" });
      }

      // Verify the device actually exists
      const device = await findDeviceById(deviceId);
      if (!device) {
        return respond({ ok: false, error: "device not found" });
      }

      // Check the user has at least viewer access
      const role = await getUserRoleForDevice(user.id, deviceId);
      if (!role) {
        return respond({ ok: false, error: "access denied" });
      }

      await socket.join(deviceId);
      console.log(
        `[socket.io] ${user.email} joined room ${device.device_code} (${deviceId}) as ${role}`
      );
      respond({ ok: true, role });
    } catch (err) {
      console.error("[socket.io] subscribe_device error:", err);
      respond({ ok: false, error: "internal error" });
    }
  });

  // ── unsubscribe_device ─────────────────────────────────────────────────────
  /**
   * Client emits: { deviceId: "<uuid>" }
   * Server removes the socket from the device room.
   */
  socket.on("unsubscribe_device", async ({ deviceId } = {}, ack) => {
    const respond = typeof ack === "function" ? ack : () => {};

    if (!deviceId) {
      return respond({ ok: false, error: "deviceId is required" });
    }

    await socket.leave(deviceId);
    console.log(`[socket.io] ${user.email} left room ${deviceId}`);
    respond({ ok: true });
  });

  // ── disconnect ─────────────────────────────────────────────────────────────
  socket.on("disconnect", (reason) => {
    console.log(`[socket.io] disconnected: ${socket.id} (${user.email}) — ${reason}`);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attach Socket.IO to an existing HTTP server.
 * Must be called once before any calls to getIO().
 *
 * @param {import("http").Server} httpServer
 * @returns {import("socket.io").Server}
 */
export function initSocketIO(httpServer) {
  _io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  // Apply JWT auth middleware to every incoming connection
  _io.use(authenticateSocket);

  // Register per-socket handlers after auth succeeds
  _io.on("connection", registerSocketHandlers);

  return _io;
}

/**
 * Return the Socket.IO server instance.
 * Throws if initSocketIO() hasn't been called yet.
 *
 * @returns {import("socket.io").Server}
 */
export function getIO() {
  if (!_io) throw new Error("Socket.IO not initialised — call initSocketIO() first");
  return _io;
}
