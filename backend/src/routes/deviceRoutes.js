import { Router } from "express";
import { claimDevice, listDevices, getDevice } from "../controllers/deviceController.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.get("/", requireAuth, listDevices);
router.post("/claim", requireAuth, claimDevice);
router.get("/:id", requireAuth, getDevice);

export default router;