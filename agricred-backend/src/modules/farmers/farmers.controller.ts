import type { Request, Response, NextFunction } from "express";
import { FarmersService } from "./farmers.service.js";
import { sendSuccess } from "../../utils/response.util.js";
import type { UpdateFarmerProfileInput } from "./farmers.schema.js";

export class FarmersController {
  public static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const farmer = await FarmersService.getFarmerByUserId(req.user!.id);
      sendSuccess(res, farmer, 200);
    } catch (err) {
      next(err);
    }
  }

  public static async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await FarmersService.updateProfile(
        req.user!.id,
        req.body as UpdateFarmerProfileInput,
        req.ip
      );
      sendSuccess(res, updated, 200);
    } catch (err) {
      next(err);
    }
  }
}
