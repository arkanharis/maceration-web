import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { getUserById } from "../controllers/userController.js";

const router = Router();

router.get("/:id", requireAuth, getUserById);

export default router;
