import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import deviceRoutes from "./routes/deviceRoutes.js";

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

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});