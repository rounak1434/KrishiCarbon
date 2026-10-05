import { Role, DocumentStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { NotFoundError, ForbiddenError, BadRequestError } from "../../utils/errors.util.js";
import { createAuditLog } from "../../utils/audit.util.js";
import { documentStorageService } from "./storage.service.js";
import { DocumentExtractionService } from "../../engine/evidence/extraction.service.js";
import { EvidenceService } from "../../engine/evidence/evidence.service.js";
import { FarmsService } from "../farms/farms.service.js";
import type { UploadDocumentBodyInput, UpdateDocumentStatusInput } from "./documents.schema.js";

export class DocumentsService {
  public static async uploadDocument(
    userId: string,
    role: Role,
    file: Express.Multer.File | undefined,
    input: UploadDocumentBodyInput,
    ipAddress?: string
  ) {
    if (!file) {
      throw new BadRequestError("File is required for upload. Accepted formats: PDF, JPEG, PNG (max 10MB).");
    }

    // Verify farm access
    await FarmsService.verifyFarmAccess(input.farmId, userId, role);

    // Save through storage abstraction
    const stored = await documentStorageService.saveFile(file);

    // Call extraction service (AI or heuristic fallback)
    const extractionResult = await DocumentExtractionService.processDocument(
      file.path,
      file.mimetype,
      input.type
    );

    const document = await prisma.document.create({
      data: {
        farmId: input.farmId,
        type: input.type,
        filename: stored.filename,
        storageUrl: stored.storageUrl,
        mimeType: stored.mimeType,
        fileSize: stored.fileSize,
        status: extractionResult.suggestedStatus,
        extractedData: extractionResult.extractedData ? JSON.parse(JSON.stringify(extractionResult.extractedData)) : undefined,
        uploadedBy: userId,
      },
    });

    await createAuditLog({
      userId,
      action: "DOCUMENT_UPLOAD",
      entityType: "Document",
      entityId: document.id,
      details: {
        farmId: input.farmId,
        type: input.type,
        filename: document.filename,
        status: document.status,
      },
      ipAddress,
    });

    return document;
  }

  public static async getDocumentsByFarmId(farmId: string, userId: string, role: Role) {
    await FarmsService.verifyFarmAccess(farmId, userId, role);

    const documents = await prisma.document.findMany({
      where: { farmId },
      orderBy: { createdAt: "desc" },
    });

    const evidenceAudit = EvidenceService.evaluateEvidence(documents);

    return {
      documents,
      evidenceAudit,
    };
  }

  public static async getDocumentById(id: string, userId: string, role: Role) {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        farm: {
          include: { farmer: true },
        },
      },
    });

    if (!document) {
      throw new NotFoundError(`Document with ID ${id} not found`);
    }

    if (role !== Role.ADMIN && document.farm.farmer.userId !== userId) {
      throw new ForbiddenError("You do not have access to this document");
    }

    return document;
  }

  public static async getDocumentFilePath(id: string, userId: string, role: Role) {
    const document = await this.getDocumentById(id, userId, role);
    const filePath = documentStorageService.getFilePath(document.storageUrl);

    if (!filePath) {
      throw new NotFoundError("Physical file could not be found on storage");
    }

    return {
      filePath,
      filename: document.filename,
      mimeType: document.mimeType,
    };
  }

  public static async getDocumentDownloadTarget(id: string, userId: string, role: Role) {
    const document = await this.getDocumentById(id, userId, role);
    const target = await documentStorageService.getDownloadTarget(
      document.storageUrl,
      document.filename,
      document.mimeType
    );

    return {
      ...target,
      document,
    };
  }

  public static async updateStatus(
    id: string,
    userId: string,
    role: Role,
    input: UpdateDocumentStatusInput,
    ipAddress?: string
  ) {
    if (role !== Role.ADMIN) {
      throw new ForbiddenError("Only an administrator or auditor can update document review status");
    }

    const document = await this.getDocumentById(id, userId, role);

    const updated = await prisma.document.update({
      where: { id },
      data: {
        status: input.status,
      },
    });

    await createAuditLog({
      userId,
      action: "DOCUMENT_STATUS_UPDATE",
      entityType: "Document",
      entityId: id,
      details: { previousStatus: document.status, newStatus: input.status, notes: input.notes },
      ipAddress,
    });

    return updated;
  }

  public static async deleteDocument(id: string, userId: string, role: Role, ipAddress?: string) {
    const document = await this.getDocumentById(id, userId, role);

    // Delete file from storage
    await documentStorageService.deleteFile(document.storageUrl);

    // Delete record from database
    await prisma.document.delete({
      where: { id },
    });

    await createAuditLog({
      userId,
      action: "DOCUMENT_DELETE",
      entityType: "Document",
      entityId: id,
      details: { filename: document.filename, type: document.type, farmId: document.farmId },
      ipAddress,
    });

    return { message: "Document deleted successfully", id };
  }

  public static async getEvidenceSummary(farmId: string, userId: string, role: Role) {
    await FarmsService.verifyFarmAccess(farmId, userId, role);

    const documents = await prisma.document.findMany({
      where: { farmId },
      select: {
        id: true,
        type: true,
        status: true,
        filename: true,
        fileSize: true,
      },
    });

    return EvidenceService.evaluateEvidence(documents);
  }
}
