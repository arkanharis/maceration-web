import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import deviceRoutes from "./routes/deviceRoutes.js";

import { initSocketIO } from "./config/socket.js";
import { initMqttHandlers } from "./services/mqttService.js";
import { handleTelemetry } from "./services/telemetryService.js";
import { handleStatus } from "./services/statusService.js";
import { resolveCommandAck } from "./services/commandService.js";

// Trigger MQTT connection on startup
import "./config/mqtt.js";

dotenv.config();

// ── Express app ───────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok", service: "maceration-iot-backend" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/devices", deviceRoutes);

// ── HTTP server + Socket.IO ───────────────────────────────────────────────────
// Socket.IO must attach to a raw http.Server, not the express app directly.
const httpServer = http.createServer(app);
initSocketIO(httpServer);

// ── MQTT handlers ─────────────────────────────────────────────────────────────
initMqttHandlers({
  onTelemetry: handleTelemetry,

  onStatus: handleStatus,

  onCommandAck: resolveCommandAck,
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});