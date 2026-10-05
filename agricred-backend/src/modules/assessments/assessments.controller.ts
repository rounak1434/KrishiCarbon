import type { Request, Response, NextFunction } from "express";
import { AssessmentsService } from "./assessments.service.js";
import { sendSuccess } from "../../utils/response.util.js";
import type { CreateAssessmentInput } from "./assessments.schema.js";

export class AssessmentsController {
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { farmId } = req.body as CreateAssessmentInput;
      const assessment = await AssessmentsService.createAssessment(
        farmId,
        req.user!.id,
        req.user!.role,
        req.ip
      );
      sendSuccess(res, assessment, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assessment = await AssessmentsService.getAssessmentById(
        req.params.id as string,
        req.user!.id,
        req.user!.role
      );
      sendSuccess(res, assessment, 200);
    } catch (err) {
      next(err);
    }
  }

  public static async recalculate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newAssessment = await AssessmentsService.recalculateAssessment(
        req.params.id as string,
        req.user!.id,
        req.user!.role,
        req.ip
      );
      sendSuccess(res, newAssessment, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async getByFarmId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await AssessmentsService.getAssessmentsByFarmId(
        req.params.farmId as string,
        req.user!.id,
        req.user!.role
      );
      sendSuccess(res, history, 200);
    } catch (err) {
      next(err);
    }
  }

  public static async toggleRecommendation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await AssessmentsService.toggleRecommendation(
        req.params.id as string,
        req.user!.id,
        req.user!.role
      );
      sendSuccess(res, updated, 200);
    } catch (err) {
      next(err);
    }
  }
}
