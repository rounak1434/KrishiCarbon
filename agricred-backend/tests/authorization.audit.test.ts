import { describe, it, expect, beforeAll } from "vitest";
import { AuthService } from "../src/modules/auth/auth.service.js";
import { FarmsService } from "../src/modules/farms/farms.service.js";
import { AssessmentsService } from "../src/modules/assessments/assessments.service.js";
import { DocumentsService } from "../src/modules/documents/documents.service.js";
import { CropsService } from "../src/modules/crops/crops.service.js";
import { AdminService } from "../src/modules/admin/admin.service.js";
import { ForbiddenError, NotFoundError } from "../src/utils/errors.util.js";
import { prisma } from "../src/config/prisma.js";
import { Role, DocumentType, DocumentStatus } from "@prisma/client";

describe("Strict Multi-Tenant Authorization Security Audit", () => {
  let farmerAUserId: string;
  let farmAId: string;
  let assessmentAId: string;
  let docAId: string;
  let cropAId: string;

  let farmerBUserId: string;
  let farmBId: string;

  beforeAll(async () => {
    // 1. Create Farmer A
    const resA = await AuthService.register({
      email: `farmer.a.${Date.now()}@agricred.test`,
      password: "Password#2026",
      role: Role.FARMER,
      name: "Farmer Alpha",
      phone: "+91 91111 11111",
      state: "Punjab",
      district: "Ludhiana",
    });
    farmerAUserId = resA.user.id;

    const farmA = await FarmsService.createFarm(farmerAUserId, {
      name: "Farm Alpha",
      areaAcres: 12.0,
      soilType: "Loam",
      irrigationMethod: "Drip",
      waterSource: "Canal",
      fertilizerUsage: "Bio",
      pesticideUsage: "IPM",
      tillageMethod: "Zero",
      residueManagement: "Mulch",
      organicPractices: true,
    });
    farmAId = farmA.id;

    const cropA = await CropsService.createCrop(farmerAUserId, Role.FARMER, {
      farmId: farmAId,
      crop: "Chickpea",
      season: "Rabi",
      year: 2024,
      yield: 2.5,
    });
    cropAId = cropA.id;

    const docA = await prisma.document.create({
      data: {
        farmId: farmAId,
        type: DocumentType.LAND_DOCUMENT,
        filename: "alpha_deed.pdf",
        storageUrl: "/uploads/alpha_deed.pdf",
        mimeType: "application/pdf",
        fileSize: 1000,
        status: DocumentStatus.VERIFIED,
        uploadedBy: farmerAUserId,
      },
    });
    docAId = docA.id;

    const assessmentA = await AssessmentsService.createAssessment(
      farmAId,
      farmerAUserId,
      Role.FARMER
    );
    assessmentAId = assessmentA.id;

    // 2. Create Farmer B
    const resB = await AuthService.register({
      email: `farmer.b.${Date.now()}@agricred.test`,
      password: "Password#2026",
      role: Role.FARMER,
      name: "Farmer Beta",
      phone: "+91 92222 22222",
      state: "Haryana",
      district: "Karnal",
    });
    farmerBUserId = resB.user.id;

    const farmB = await FarmsService.createFarm(farmerBUserId, {
      name: "Farm Beta",
      areaAcres: 15.0,
      soilType: "Clay",
      irrigationMethod: "Flood",
      waterSource: "Borewell",
      fertilizerUsage: "Chemical",
      pesticideUsage: "Chemical",
      tillageMethod: "Conventional",
      residueManagement: "Burning",
      organicPractices: false,
    });
    farmBId = farmB.id;
  });

  it("Farmer B cannot view Farmer A's farm", async () => {
    await expect(
      FarmsService.getFarmById(farmAId, farmerBUserId, Role.FARMER)
    ).rejects.toThrow(ForbiddenError);
  });

  it("Farmer B cannot update Farmer A's farm", async () => {
    await expect(
      FarmsService.updateFarm(farmAId, farmerBUserId, Role.FARMER, { name: "Hacked Farm" })
    ).rejects.toThrow(ForbiddenError);
  });

  it("Farmer B cannot delete Farmer A's farm", async () => {
    await expect(
      FarmsService.deleteFarm(farmAId, farmerBUserId, Role.FARMER)
    ).rejects.toThrow(ForbiddenError);
  });

  it("Farmer B cannot view Farmer A's assessment", async () => {
    await expect(
      AssessmentsService.getAssessmentById(assessmentAId, farmerBUserId, Role.FARMER)
    ).rejects.toThrow(ForbiddenError);
  });

  it("Farmer B cannot recalculate Farmer A's assessment", async () => {
    await expect(
      AssessmentsService.recalculateAssessment(assessmentAId, farmerBUserId, Role.FARMER)
    ).rejects.toThrow(ForbiddenError);
  });

  it("Farmer B cannot access Farmer A's assessment history", async () => {
    await expect(
      AssessmentsService.getAssessmentsByFarmId(farmAId, farmerBUserId, Role.FARMER)
    ).rejects.toThrow(ForbiddenError);
  });

  it("Farmer B cannot view Farmer A's documents", async () => {
    await expect(
      DocumentsService.getDocumentById(docAId, farmerBUserId, Role.FARMER)
    ).rejects.toThrow(ForbiddenError);
  });

  it("Farmer B cannot delete Farmer A's documents", async () => {
    await expect(
      DocumentsService.deleteDocument(docAId, farmerBUserId, Role.FARMER)
    ).rejects.toThrow(ForbiddenError);
  });

  it("Farmer B cannot add crop history to Farmer A's farm", async () => {
    await expect(
      CropsService.createCrop(farmerBUserId, Role.FARMER, {
        farmId: farmAId,
        crop: "Unauthorized Crop",
        season: "Rabi",
        year: 2024,
        yield: 1.0,
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it("Farmer B cannot update Farmer A's crop history", async () => {
    await expect(
      CropsService.updateCrop(cropAId, farmerBUserId, Role.FARMER, { crop: "Hacked Crop" })
    ).rejects.toThrow(ForbiddenError);
  });

  it("Farmer B cannot delete Farmer A's crop history", async () => {
    await expect(
      CropsService.deleteCrop(cropAId, farmerBUserId, Role.FARMER)
    ).rejects.toThrow(ForbiddenError);
  });

  it("Farmer cannot verify their own document review status (Admin only)", async () => {
    await expect(
      DocumentsService.updateStatus(docAId, farmerAUserId, Role.FARMER, {
        status: DocumentStatus.VERIFIED,
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it("Admin CAN access any farm and view metrics", async () => {
    const adminFarm = await FarmsService.getFarmById(farmAId, "admin-user", Role.ADMIN);
    expect(adminFarm).toBeDefined();
    expect(adminFarm.id).toBe(farmAId);

    const stats = await AdminService.getDashboardStats();
    expect(stats.overview.totalFarms).toBeGreaterThanOrEqual(2);
  });
});
