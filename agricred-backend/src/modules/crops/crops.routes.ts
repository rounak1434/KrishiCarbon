import { Router } from "express";
import { CropsController } from "./crops.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams } from "../../middleware/validate.middleware.js";
import {
  createCropSchema,
  updateCropSchema,
  cropIdParamSchema,
  farmIdCropsParamSchema,
} from "./crops.schema.js";

const router = Router();

router.use(requireAuth);

router.post("/", validateBody(createCropSchema), CropsController.create);
router.get("/farm/:farmId", validateParams(farmIdCropsParamSchema), CropsController.getByFarmId);
router.put("/:id", validateParams(cropIdParamSchema), validateBody(updateCropSchema), CropsController.update);
router.patch("/:id", validateParams(cropIdParamSchema), validateBody(updateCropSchema), CropsController.update);
router.delete("/:id", validateParams(cropIdParamSchema), CropsController.delete);

export default router;
