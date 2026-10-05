import { Router } from "express";
import { DocumentsController } from "./documents.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { uploadSingleDocument } from "../../middleware/upload.middleware.js";
import { validateBody, validateParams } from "../../middleware/validate.middleware.js";
import {
  uploadDocumentBodySchema,
  updateDocumentStatusSchema,
  documentIdParamSchema,
  farmIdDocumentsParamSchema,
} from "./documents.schema.js";

const router = Router();

router.use(requireAuth);

// Upload document (file + body: farmId, type)
router.post(
  "/upload",
  uploadSingleDocument,
  validateBody(uploadDocumentBodySchema),
  DocumentsController.upload
);

// Get documents for farm
router.get("/farm/:farmId", validateParams(farmIdDocumentsParamSchema), DocumentsController.getByFarmId);

// Get evidence audit summary for farm
router.get(
  "/farm/:farmId/evidence-summary",
  validateParams(farmIdDocumentsParamSchema),
  DocumentsController.getEvidenceSummary
);

// Get single document metadata
router.get("/:id", validateParams(documentIdParamSchema), DocumentsController.getById);

// Download physical document file
router.get("/:id/download", validateParams(documentIdParamSchema), DocumentsController.download);

// Update document review status
router.patch(
  "/:id/status",
  validateParams(documentIdParamSchema),
  validateBody(updateDocumentStatusSchema),
  DocumentsController.updateStatus
);

// Delete document
router.delete("/:id", validateParams(documentIdParamSchema), DocumentsController.delete);

export default router;
