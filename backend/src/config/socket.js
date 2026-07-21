import { Server } from "socket.io";

/**
 * Socket.IO singleton.
 *
 * Initialised once in index.js by calling initSocketIO(httpServer).
 * All other modules that need to emit events call getIO().
 *
 * Room naming convention: one room per device_id UUID.
 * A client joins a room by emitting subscribe_device (Task 3.4).
 */

let _io = null;

/**
 * Attach Socket.IO to an existing HTTP server and return the io instance.
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

  _io.on("connection", (socket) => {
    console.log(`[socket.io] client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`[socket.io] client disconnected: ${socket.id}`);
    });
  });

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
