import type { Request, Response, NextFunction } from "express";
import { CropsService } from "./crops.service.js";
import { sendSuccess } from "../../utils/response.util.js";
import type { CreateCropInput, UpdateCropInput } from "./crops.schema.js";

export class CropsController {
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const crop = await CropsService.createCrop(
        req.user!.id,
        req.user!.role,
        req.body as CreateCropInput,
        req.ip
      );
      sendSuccess(res, crop, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async getByFarmId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const crops = await CropsService.getCropsByFarmId(
        req.params.farmId as string,
        req.user!.id,
        req.user!.role
      );
      sendSuccess(res, crops, 200);
    } catch (err) {
      next(err);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await CropsService.updateCrop(
        req.params.id as string,
        req.user!.id,
        req.user!.role,
        req.body as UpdateCropInput,
        req.ip
      );
      sendSuccess(res, updated, 200);
    } catch (err) {
      next(err);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await CropsService.deleteCrop(
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
}
