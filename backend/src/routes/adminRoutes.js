import { Router } from "express";
import { adminGenerateDevice } from "../controllers/deviceController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireGlobalRole } from "../middlewares/requireGlobalRole.js";

const router = Router();

router.post("/devices", requireAuth, requireGlobalRole("superadmin"), adminGenerateDevice);

export default router;