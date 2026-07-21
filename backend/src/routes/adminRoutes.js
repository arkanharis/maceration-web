import { Router } from "express";
import { adminGenerateDevice } from "../controllers/deviceController.js";
import {
  adminGetAllDevices,
  adminGetAllUsers,
  adminPatchUserRole,
} from "../controllers/adminController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireGlobalRole } from "../middlewares/requireGlobalRole.js";

const router = Router();

// Shorthand — all admin routes require a valid JWT + superadmin role.
const adminGuard = [requireAuth, requireGlobalRole("superadmin")];

// Task 2.2 — Generate a new device (device_code + secret returned once)
router.post("/devices", ...adminGuard, adminGenerateDevice);

// Task 2.6 — Admin overview: all devices in the system (claimed + unclaimed)
router.get("/devices", ...adminGuard, adminGetAllDevices);

// Task 2.6 — Admin overview: all users
router.get("/users", ...adminGuard, adminGetAllUsers);

// Task 2.6 — Promote / demote a user's global role
router.patch("/users/:id", ...adminGuard, adminPatchUserRole);

export default router;