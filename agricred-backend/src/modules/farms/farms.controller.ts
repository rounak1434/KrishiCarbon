import type { Request, Response, NextFunction } from "express";
import { FarmsService } from "./farms.service.js";
import { sendSuccess } from "../../utils/response.util.js";
import type { CreateFarmInput, UpdateFarmInput } from "./farms.schema.js";

export class FarmsController {
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const farm = await FarmsService.createFarm(req.user!.id, req.body as CreateFarmInput, req.ip);
      sendSuccess(res, farm, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const farmerId = req.query.farmerId as string | undefined;
      const farms = await FarmsService.getFarms(req.user!.id, req.user!.role, farmerId);
      sendSuccess(res, farms, 200);
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const farm = await FarmsService.getFarmById(req.params.id as string, req.user!.id, req.user!.role);
      sendSuccess(res, farm, 200);
    } catch (err) {
      next(err);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await FarmsService.updateFarm(
        req.params.id as string,
        req.user!.id,
        req.user!.role,
        req.body as UpdateFarmInput,
        req.ip
      );
      sendSuccess(res, updated, 200);
    } catch (err) {
      next(err);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await FarmsService.deleteFarm(
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
