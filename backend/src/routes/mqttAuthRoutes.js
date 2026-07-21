import { Router } from "express";
import { mqttAuth, mqttAcl } from "../controllers/mqttAuthController.js";

/**
 * MQTT auth routes — consumed exclusively by Mosquitto's go-auth HTTP backend.
 * go-auth sends application/x-www-form-urlencoded bodies, so we need the
 * express.urlencoded middleware (already applied globally in index.js).
 *
 * These routes should only be accessible from the Docker internal network.
 * No JWT middleware — Mosquitto doesn't send user tokens.
 */
const router = Router();

router.post("/auth", mqttAuth);
router.post("/acl",  mqttAcl);

export default router;
