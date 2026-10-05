import type { Request, Response, NextFunction } from "express";
import { AdminService } from "./admin.service.js";
import { sendSuccess } from "../../utils/response.util.js";

export class AdminController {
  public static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await AdminService.getDashboardStats();
      sendSuccess(res, stats, 200);
    } catch (err) {
      next(err);
    }
  }

  public static async getFarmers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const data = await AdminService.getFarmers(page, limit);
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  }

  public static async getFarms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const data = await AdminService.getFarms(page, limit);
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  }

  public static async getAssessments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const data = await AdminService.getAssessments(page, limit);
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  }

  public static async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await AdminService.getStatistics();
      sendSuccess(res, stats, 200);
    } catch (err) {
      next(err);
    }
  }

  public static async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const logs = await AdminService.getAuditLogs(page, limit);
      sendSuccess(res, logs, 200);
    } catch (err) {
      next(err);
    }
  }
}
