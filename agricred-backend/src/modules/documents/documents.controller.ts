import type { Request, Response, NextFunction } from "express";
import { DocumentsService } from "./documents.service.js";
import { sendSuccess } from "../../utils/response.util.js";
import type { UploadDocumentBodyInput, UpdateDocumentStatusInput } from "./documents.schema.js";

export class DocumentsController {
  public static async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const document = await DocumentsService.uploadDocument(
        req.user!.id,
        req.user!.role,
        req.file,
        req.body as UploadDocumentBodyInput,
        req.ip
      );
      sendSuccess(res, document, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async getByFarmId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await DocumentsService.getDocumentsByFarmId(
        req.params.farmId as string,
        req.user!.id,
        req.user!.role
      );
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const document = await DocumentsService.getDocumentById(
        req.params.id as string,
        req.user!.id,
        req.user!.role
      );
      sendSuccess(res, document, 200);
    } catch (err) {
      next(err);
    }
  }

  public static async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const target = await DocumentsService.getDocumentDownloadTarget(
        req.params.id as string,
        req.user!.id,
        req.user!.role
      );

      if (target.type === "url" && target.url) {
        res.redirect(target.url);
        return;
      }

      if (target.type === "file" && target.filePath) {
        res.setHeader("Content-Type", target.mimeType);
        res.setHeader("Content-Disposition", `attachment; filename="${target.filename}"`);
        res.sendFile(target.filePath);
        return;
      }

      res.status(404).json({
        success: false,
        error: {
          code: "FILE_NOT_FOUND",
          message: "Document file could not be found or accessed",
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await DocumentsService.updateStatus(
        req.params.id as string,
        req.user!.id,
        req.user!.role,
        req.body as UpdateDocumentStatusInput,
        req.ip
      );
      sendSuccess(res, updated, 200);
    } catch (err) {
      next(err);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await DocumentsService.deleteDocument(
        req.params.id as string,
        req.user!.id,
        req.user!.role,
        req.ip
      );
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  public static async getEvidenceSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await DocumentsService.getEvidenceSummary(
        req.params.farmId as string,
        req.user!.id,
        req.user!.role
      );
      sendSuccess(res, summary, 200);
    } catch (err) {
      next(err);
    }
  }
}
