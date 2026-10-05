import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import { sendSuccess } from "../../utils/response.util.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body as RegisterInput, req.ip);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body as LoginInput, req.ip);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  public static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.getProfile(req.user!.id);
      sendSuccess(res, user, 200);
    } catch (err) {
      next(err);
    }
  }
}
