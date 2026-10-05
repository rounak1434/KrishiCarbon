import { Role } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { NotFoundError, ForbiddenError, BadRequestError } from "../../utils/errors.util.js";
import { createAuditLog } from "../../utils/audit.util.js";
import type { CreateFarmInput, UpdateFarmInput } from "./farms.schema.js";

export class FarmsService {
  /**
   * Helper to verify ownership or admin rights for a farm
   */
  public static async verifyFarmAccess(farmId: string, userId: string, role: Role) {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: {
        farmer: {
          select: {
            id: true,
            userId: true,
            name: true,
          },
        },
      },
    });

    if (!farm) {
      throw new NotFoundError(`Farm with ID ${farmId} was not found`);
    }

    if (role !== Role.ADMIN && farm.farmer.userId !== userId) {
      throw new ForbiddenError("You do not have permission to access or modify this farm");
    }

    return farm;
  }

  public static async createFarm(userId: string, input: CreateFarmInput, ipAddress?: string) {
    // Locate farmer profile
    let farmer = await prisma.farmer.findUnique({
      where: { userId },
    });

    if (!farmer) {
      throw new BadRequestError("Farmer profile not found for this user. Only registered farmers can register farms.");
    }

    // Derive or fallback fertilizerUsage if not explicitly provided
    let fertilizerUsage = input.fertilizerUsage;
    if (!fertilizerUsage || fertilizerUsage.trim().length === 0) {
      if (input.fertilizerCategory) {
        fertilizerUsage = input.organicFertilizerType
          ? `${input.fertilizerCategory} (${input.organicFertilizerType})`
          : input.fertilizerCategory;
      } else {
        fertilizerUsage = "NOT_SPECIFIED";
      }
    }

    const farm = await prisma.farm.create({
      data: {
        farmerId: farmer.id,
        name: input.name,
        areaAcres: input.areaAcres,
        soilType: input.soilType,
        irrigationMethod: input.irrigationMethod,
        waterSource: input.waterSource,
        fertilizerUsage,
        fertilizerCategory: input.fertilizerCategory ?? null,
        organicFertilizerType: input.organicFertilizerType ?? null,
        pesticideUsage: input.pesticideUsage,
        tillageMethod: input.tillageMethod,
        residueManagement: input.residueManagement,
        organicPractices: input.organicPractices,
      },
      include: {
        farmer: {
          select: { id: true, name: true },
        },
      },
    });

    await createAuditLog({
      userId,
      action: "FARM_CREATE",
      entityType: "Farm",
      entityId: farm.id,
      details: { name: farm.name, areaAcres: farm.areaAcres },
      ipAddress,
    });

    return farm;
  }

  public static async getFarms(userId: string, role: Role, filterFarmerId?: string) {
    if (role === Role.ADMIN) {
      return prisma.farm.findMany({
        ...(filterFarmerId ? { where: { farmerId: filterFarmerId } } : {}),
        include: {
          farmer: {
            select: { id: true, name: true, state: true, district: true },
          },
          _count: {
            select: { crops: true, documents: true, assessments: true },
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
        orderBy: { createdAt: "desc" },
      });
    }

    // Farmer role: only their own farms
    const farmer = await prisma.farmer.findUnique({
      where: { userId },
    });

    if (!farmer) {
      return [];
    }

    return prisma.farm.findMany({
      where: { farmerId: farmer.id },
      include: {
        _count: {
          select: { crops: true, documents: true, assessments: true },
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
      orderBy: { createdAt: "desc" },
    });
  }

  public static async getFarmById(farmId: string, userId: string, role: Role) {
    await this.verifyFarmAccess(farmId, userId, role);

    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: {
        farmer: {
          select: { id: true, name: true, phone: true, state: true, district: true },
        },
        crops: {
          orderBy: { year: "desc" },
        },
        documents: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            filename: true,
            mimeType: true,
            fileSize: true,
            status: true,
            extractedData: true,
            createdAt: true,
          },
        },
        assessments: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            categoryScores: true,
            recommendations: true,
          },
        },
      },
    });

    return farm;
  }

  public static async updateFarm(
    farmId: string,
    userId: string,
    role: Role,
    input: UpdateFarmInput,
    ipAddress?: string
  ) {
    await this.verifyFarmAccess(farmId, userId, role);

    let fertilizerUsage = input.fertilizerUsage;
    if (fertilizerUsage === undefined && input.fertilizerCategory !== undefined) {
      if (input.fertilizerCategory) {
        fertilizerUsage = input.organicFertilizerType
          ? `${input.fertilizerCategory} (${input.organicFertilizerType})`
          : input.fertilizerCategory;
      } else {
        fertilizerUsage = "NOT_SPECIFIED";
      }
    }

    const updated = await prisma.farm.update({
      where: { id: farmId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.areaAcres !== undefined && { areaAcres: input.areaAcres }),
        ...(input.soilType !== undefined && { soilType: input.soilType }),
        ...(input.irrigationMethod !== undefined && { irrigationMethod: input.irrigationMethod }),
        ...(input.waterSource !== undefined && { waterSource: input.waterSource }),
        ...(fertilizerUsage !== undefined && { fertilizerUsage }),
        ...(input.fertilizerCategory !== undefined && { fertilizerCategory: input.fertilizerCategory }),
        ...(input.organicFertilizerType !== undefined && { organicFertilizerType: input.organicFertilizerType }),
        ...(input.pesticideUsage !== undefined && { pesticideUsage: input.pesticideUsage }),
        ...(input.tillageMethod !== undefined && { tillageMethod: input.tillageMethod }),
        ...(input.residueManagement !== undefined && { residueManagement: input.residueManagement }),
        ...(input.organicPractices !== undefined && { organicPractices: input.organicPractices }),
      },
    });

    await createAuditLog({
      userId,
      action: "FARM_UPDATE",
      entityType: "Farm",
      entityId: farmId,
      details: { changes: input },
      ipAddress,
    });

    return updated;
  }

  public static async deleteFarm(farmId: string, userId: string, role: Role, ipAddress?: string) {
    await this.verifyFarmAccess(farmId, userId, role);

    const deleted = await prisma.farm.delete({
      where: { id: farmId },
    });

    await createAuditLog({
      userId,
      action: "FARM_DELETE",
      entityType: "Farm",
      entityId: farmId,
      details: { name: deleted.name },
      ipAddress,
    });

    return { message: "Farm deleted successfully", id: farmId };
  }
}
