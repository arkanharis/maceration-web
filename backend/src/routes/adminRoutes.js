import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireGlobalRole } from "../middlewares/requireGlobalRole.js";
import { adminGenerateDevice } from "../controllers/deviceController.js";
import {
  adminGetAllDevices,
  adminGetAllUsers,
  adminPatchUser,
  adminDeleteUserHandler,
  adminUnclaimDeviceHandler,
  adminDeleteDeviceHandler,
} from "../controllers/adminController.js";

const adminGuard = [requireAuth, requireGlobalRole("superadmin")];

const router = Router();

// ── Devices ────────────────────────────────────────────────────────────────
router.get("/devices",              ...adminGuard, adminGetAllDevices);
router.post("/devices",             ...adminGuard, adminGenerateDevice);
router.delete("/devices/:id/claim", ...adminGuard, adminUnclaimDeviceHandler);
router.delete("/devices/:id",       ...adminGuard, adminDeleteDeviceHandler);

// ── Users ──────────────────────────────────────────────────────────────────
router.get("/users",         ...adminGuard, adminGetAllUsers);
router.patch("/users/:id",   ...adminGuard, adminPatchUser);
router.delete("/users/:id",  ...adminGuard, adminDeleteUserHandler);

export default router;