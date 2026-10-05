import { Router } from "express";
import { FarmersController } from "./farmers.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { updateFarmerProfileSchema } from "./farmers.schema.js";

const router = Router();

router.get("/me", requireAuth, FarmersController.getMe);
router.put("/me", requireAuth, validateBody(updateFarmerProfileSchema), FarmersController.updateMe);

export default router;
