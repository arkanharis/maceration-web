import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

let socket = null;

export function initSocket(token) {
  if (socket) {
    socket.disconnect();
  }

  if (!token) return null;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on("connect", () => {
    console.log(`[socket.io] connected: ${socket.id}`);
  });

  socket.on("connect_error", (err) => {
    console.warn(`[socket.io] connection error:`, err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[socket.io] disconnected: ${reason}`);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
