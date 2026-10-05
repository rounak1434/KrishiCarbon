import type { Request, Response, NextFunction } from "express";
import { type ZodType, ZodError } from "zod";
import { ValidationError } from "../utils/errors.util.js";

export function validateBody<T>(schema: ZodType<T>) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        next(new ValidationError("Request validation failed", issues));
      } else {
        next(error);
      }
    }
  };
}

export function validateQuery<T>(schema: ZodType<T>) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = (await schema.parseAsync(req.query)) as unknown as Request["query"];
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        next(new ValidationError("Query parameter validation failed", issues));
      } else {
        next(error);
      }
    }
  };
}

export function validateParams<T>(schema: ZodType<T>) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.params = (await schema.parseAsync(req.params)) as unknown as Request["params"];
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        next(new ValidationError("URL parameter validation failed", issues));
      } else {
        next(error);
      }
    }
  };
}
