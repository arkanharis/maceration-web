import { Router } from "express";
import { claimDevice, listDevices, getDevice } from "../controllers/deviceController.js";
import {
  getDeviceAccessList,
  postDeviceAccess,
  patchDeviceAccess,
  deleteDeviceAccess,
} from "../controllers/deviceAccessController.js";
import { postDeviceCommand } from "../controllers/commandController.js";
import { getHistory, getEvents } from "../controllers/historyController.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.get("/", requireAuth, listDevices);
router.post("/claim", requireAuth, claimDevice);
router.get("/:id", requireAuth, getDevice);
router.post("/:id/command", requireAuth, postDeviceCommand);
router.get("/:id/history", requireAuth, getHistory);
router.get("/:id/events", requireAuth, getEvents);

router.get("/:id/access", requireAuth, getDeviceAccessList);
router.post("/:id/access", requireAuth, postDeviceAccess);
router.patch("/:id/access/:userId", requireAuth, patchDeviceAccess);
router.delete("/:id/access/:userId", requireAuth, deleteDeviceAccess);

export default router;