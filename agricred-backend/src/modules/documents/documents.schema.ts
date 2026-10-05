import { z } from "zod";
import { DocumentType, DocumentStatus } from "@prisma/client";

export const uploadDocumentBodySchema = z.object({
  farmId: z.string().uuid("Invalid farm ID format"),
  type: z.nativeEnum(DocumentType, {
    message: `Invalid document type. Must be one of: ${Object.values(DocumentType).join(", ")}`,
  }),
});

export const updateDocumentStatusSchema = z.object({
  status: z.nativeEnum(DocumentStatus, {
    message: `Invalid status. Must be one of: ${Object.values(DocumentStatus).join(", ")}`,
  }),
  notes: z.string().optional(),
});

export const documentIdParamSchema = z.object({
  id: z.string().uuid("Invalid document ID format"),
});

export const farmIdDocumentsParamSchema = z.object({
  farmId: z.string().uuid("Invalid farm ID format"),
});

export type UploadDocumentBodyInput = z.infer<typeof uploadDocumentBodySchema>;
export type UpdateDocumentStatusInput = z.infer<typeof updateDocumentStatusSchema>;
