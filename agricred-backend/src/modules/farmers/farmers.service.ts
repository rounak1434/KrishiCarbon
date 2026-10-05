import { prisma } from "../../config/prisma.js";
import { NotFoundError } from "../../utils/errors.util.js";
import { createAuditLog } from "../../utils/audit.util.js";
import type { UpdateFarmerProfileInput } from "./farmers.schema.js";

export class FarmersService {
  public static async getFarmerByUserId(userId: string) {
    const farmer = await prisma.farmer.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        farms: {
          include: {
            _count: {
              select: {
                crops: true,
                documents: true,
                assessments: true,
              },
            },
            assessments: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                overallScore: true,
                readinessLevel: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!farmer) {
      throw new NotFoundError("Farmer profile not found for this user");
    }

    return farmer;
  }

  public static async updateProfile(userId: string, input: UpdateFarmerProfileInput, ipAddress?: string) {
    const existing = await prisma.farmer.findUnique({
      where: { userId },
    });

    if (!existing) {
      throw new NotFoundError("Farmer profile not found for this user");
    }

    const updated = await prisma.farmer.update({
      where: { userId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.state !== undefined && { state: input.state }),
        ...(input.district !== undefined && { district: input.district }),
      },
    });

    await createAuditLog({
      userId,
      action: "FARMER_PROFILE_UPDATE",
      entityType: "Farmer",
      entityId: updated.id,
      details: { changes: input },
      ipAddress,
    });

    return updated;
  }
}
