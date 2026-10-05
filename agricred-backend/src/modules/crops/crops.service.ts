import { Role } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { NotFoundError, ForbiddenError } from "../../utils/errors.util.js";
import { createAuditLog } from "../../utils/audit.util.js";
import { FarmsService } from "../farms/farms.service.js";
import type { CreateCropInput, UpdateCropInput } from "./crops.schema.js";

export class CropsService {
  public static async createCrop(userId: string, role: Role, input: CreateCropInput, ipAddress?: string) {
    // Verify access to the farm
    await FarmsService.verifyFarmAccess(input.farmId, userId, role);

    const crop = await prisma.cropHistory.create({
      data: {
        farmId: input.farmId,
        crop: input.crop,
        season: input.season,
        year: input.year,
        yield: input.yield,
      },
    });

    await createAuditLog({
      userId,
      action: "CROP_HISTORY_CREATE",
      entityType: "CropHistory",
      entityId: crop.id,
      details: { farmId: input.farmId, crop: crop.crop, year: crop.year, season: crop.season },
      ipAddress,
    });

    return crop;
  }

  public static async getCropsByFarmId(farmId: string, userId: string, role: Role) {
    await FarmsService.verifyFarmAccess(farmId, userId, role);

    return prisma.cropHistory.findMany({
      where: { farmId },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
    });
  }

  public static async updateCrop(
    cropId: string,
    userId: string,
    role: Role,
    input: UpdateCropInput,
    ipAddress?: string
  ) {
    const existingCrop = await prisma.cropHistory.findUnique({
      where: { id: cropId },
      include: {
        farm: {
          include: { farmer: true },
        },
      },
    });

    if (!existingCrop) {
      throw new NotFoundError(`Crop history record with ID ${cropId} not found`);
    }

    if (role !== Role.ADMIN && existingCrop.farm.farmer.userId !== userId) {
      throw new ForbiddenError("You do not have permission to modify this crop history record");
    }

    const updated = await prisma.cropHistory.update({
      where: { id: cropId },
      data: {
        ...(input.crop !== undefined && { crop: input.crop }),
        ...(input.season !== undefined && { season: input.season }),
        ...(input.year !== undefined && { year: input.year }),
        ...(input.yield !== undefined && { yield: input.yield }),
      },
    });

    await createAuditLog({
      userId,
      action: "CROP_HISTORY_UPDATE",
      entityType: "CropHistory",
      entityId: cropId,
      details: { changes: input },
      ipAddress,
    });

    return updated;
  }

  public static async deleteCrop(cropId: string, userId: string, role: Role, ipAddress?: string) {
    const existingCrop = await prisma.cropHistory.findUnique({
      where: { id: cropId },
      include: {
        farm: {
          include: { farmer: true },
        },
      },
    });

    if (!existingCrop) {
      throw new NotFoundError(`Crop history record with ID ${cropId} not found`);
    }

    if (role !== Role.ADMIN && existingCrop.farm.farmer.userId !== userId) {
      throw new ForbiddenError("You do not have permission to delete this crop history record");
    }

    await prisma.cropHistory.delete({
      where: { id: cropId },
    });

    await createAuditLog({
      userId,
      action: "CROP_HISTORY_DELETE",
      entityType: "CropHistory",
      entityId: cropId,
      details: { crop: existingCrop.crop, farmId: existingCrop.farmId },
      ipAddress,
    });

    return { message: "Crop history record deleted successfully", id: cropId };
  }
}
