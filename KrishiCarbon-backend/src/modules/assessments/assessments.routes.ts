import { Router } from "express";
import { AssessmentsController } from "./assessments.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams } from "../../middleware/validate.middleware.js";
import {
  createAssessmentSchema,
  assessmentIdParamSchema,
  farmIdAssessmentsParamSchema,
  recommendationIdParamSchema,
} from "./assessments.schema.js";

const router = Router();

router.use(requireAuth);

// Create new assessment
router.post("/", validateBody(createAssessmentSchema), AssessmentsController.create);

// Get assessment by ID
router.get("/:id", validateParams(assessmentIdParamSchema), AssessmentsController.getById);

// Recalculate assessment based on current farm state and evidence
router.post(
  "/:id/recalculate",
  validateParams(assessmentIdParamSchema),
  AssessmentsController.recalculate
);

// Get assessment history for farm
router.get(
  "/farm/:farmId",
  validateParams(farmIdAssessmentsParamSchema),
  AssessmentsController.getByFarmId
);

// Toggle recommendation completed status
router.patch(
  "/recommendations/:id/toggle",
  validateParams(recommendationIdParamSchema),
  AssessmentsController.toggleRecommendation
);

export default router;
