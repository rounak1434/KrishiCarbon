import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.config.js";
import { prisma } from "../config/prisma.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.util.js";
import type { Role } from "@prisma/client";

interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication token is missing or malformed");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new UnauthorizedError("Authentication token is missing");
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      throw new UnauthorizedError("Invalid or expired authentication token");
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { farmer: { select: { id: true } } },
    });

    if (!user) {
      throw new UnauthorizedError("User associated with this token no longer exists");
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      farmerId: user.farmer?.id ?? null,
    };

    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Access denied. Requires one of roles: ${roles.join(", ")}`));
    }

    next();
  };
}
