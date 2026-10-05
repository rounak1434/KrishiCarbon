import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.config.js";
import { ConflictError, UnauthorizedError, NotFoundError } from "../../utils/errors.util.js";
import { createAuditLog } from "../../utils/audit.util.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

export interface AuthResponseData {
  user: {
    id: string;
    email: string;
    role: Role;
    createdAt: Date;
    farmer?: {
      id: string;
      name: string;
      phone: string;
      state: string;
      district: string;
    } | null;
  };
  token: string;
}

export class AuthService {
  public static async register(input: RegisterInput, ipAddress?: string): Promise<AuthResponseData> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictError("A user with this email address already exists");
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          role: input.role,
        },
      });

      let farmerData = null;
      if (input.role === Role.FARMER) {
        farmerData = await tx.farmer.create({
          data: {
            userId: createdUser.id,
            name: input.name!,
            phone: input.phone!,
            state: input.state!,
            district: input.district!,
          },
        });
      }

      return {
        ...createdUser,
        farmer: farmerData,
      };
    });

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: (env.JWT_EXPIRES_IN || "7d") as unknown as number }
    );

    await createAuditLog({
      userId: user.id,
      action: "AUTH_REGISTER",
      entityType: "User",
      entityId: user.id,
      details: { email: user.email, role: user.role },
      ipAddress,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        farmer: user.farmer,
      },
      token,
    };
  }

  public static async login(input: LoginInput, ipAddress?: string): Promise<AuthResponseData> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        farmer: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: (env.JWT_EXPIRES_IN || "7d") as unknown as number }
    );

    await createAuditLog({
      userId: user.id,
      action: "AUTH_LOGIN",
      entityType: "User",
      entityId: user.id,
      ipAddress,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        farmer: user.farmer,
      },
      token,
    };
  }

  public static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        farmer: {
          select: {
            id: true,
            name: true,
            phone: true,
            state: true,
            district: true,
            createdAt: true,
            farms: {
              select: {
                id: true,
                name: true,
                areaAcres: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }
}
