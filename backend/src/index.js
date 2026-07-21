import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import deviceRoutes from "./routes/deviceRoutes.js";
import { initMqttHandlers } from "./services/mqttService.js";

// Import the MQTT client config so the connection is established on startup
// (the import itself triggers mqtt.connect() inside config/mqtt.js).
import "./config/mqtt.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok", service: "maceration-iot-backend" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/devices", deviceRoutes);

// ─── MQTT handlers ────────────────────────────────────────────────────────────
// Placeholder handlers for now; will be replaced with real logic in Tasks 3.2/3.3.
initMqttHandlers({
  onTelemetry: (deviceCode, payload) => {
    // Task 3.2: save to device_logs + broadcast via Socket.IO
    console.log(`[mqtt:telemetry] ${deviceCode}`, payload);
  },
  onStatus: (deviceCode, payload) => {
    // Task 3.3: update connection_status in DB + broadcast device_status_changed
    console.log(`[mqtt:status] ${deviceCode}`, payload);
  },
  onCommandAck: (deviceCode, payload) => {
    // Task 3.5: forward ack to the waiting Socket.IO room
    console.log(`[mqtt:command/ack] ${deviceCode}`, payload);
  },
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});