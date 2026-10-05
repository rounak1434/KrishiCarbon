import { Router } from "express";
import { FarmsController } from "./farms.controller.js";
import { AssessmentsController } from "../assessments/assessments.controller.js";
import { CropsController } from "../crops/crops.controller.js";
import { DocumentsController } from "../documents/documents.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams } from "../../middleware/validate.middleware.js";
import { createFarmSchema, updateFarmSchema, farmIdParamSchema } from "./farms.schema.js";

const router = Router();

router.use(requireAuth);

router.post("/", validateBody(createFarmSchema), FarmsController.create);
router.get("/", FarmsController.getAll);
router.get("/:id", validateParams(farmIdParamSchema), FarmsController.getById);
router.put("/:id", validateParams(farmIdParamSchema), validateBody(updateFarmSchema), FarmsController.update);
router.patch("/:id", validateParams(farmIdParamSchema), validateBody(updateFarmSchema), FarmsController.update);
router.delete("/:id", validateParams(farmIdParamSchema), FarmsController.delete);

// Nested sub-resources for frontend convenience
router.get("/:farmId/assessments", AssessmentsController.getByFarmId);
router.get("/:farmId/crops", CropsController.getByFarmId);
router.get("/:farmId/documents", DocumentsController.getByFarmId);

export default router;
