import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.util.js";
import { logger } from "../utils/logger.util.js";
import { Prisma } from "@prisma/client";
import { MulterError } from "multer";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // 1. AppError (our custom operational errors)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined && { details: err.details }),
      },
    });
    return;
  }

  // 2. Multer upload errors
  if (err instanceof MulterError) {
    let message = "File upload failed";
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File exceeds maximum size limit of 10MB";
    }
    res.status(400).json({
      success: false,
      error: {
        code: "FILE_UPLOAD_ERROR",
        message,
        details: err.code,
      },
    });
    return;
  }

  // 3. Prisma known database errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        success: false,
        error: {
          code: "DUPLICATE_RECORD",
          message: "A record with this unique identifier already exists",
          details: err.meta,
        },
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        error: {
          code: "RECORD_NOT_FOUND",
          message: "Database record not found",
        },
      });
      return;
    }
  }

  // 4. Unexpected server error
  logger.error("Unhandled Exception:", {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred. Please try again later."
          : err.message,
    },
  });
}
