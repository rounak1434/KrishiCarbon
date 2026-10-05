import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { authRateLimiter } from "../../middleware/rateLimit.middleware.js";

const router = Router();

router.post("/register", authRateLimiter, validateBody(registerSchema), AuthController.register);
router.post("/login", authRateLimiter, validateBody(loginSchema), AuthController.login);
router.get("/me", requireAuth, AuthController.getMe);

export default router;
