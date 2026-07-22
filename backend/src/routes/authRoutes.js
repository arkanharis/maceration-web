import { Router } from "express";
import { register, login, me, logout, updateMe } from "../controllers/authController.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, updateMe);
router.post("/logout", requireAuth, logout);

export default router;