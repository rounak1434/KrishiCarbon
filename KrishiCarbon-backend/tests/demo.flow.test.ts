import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AuthService } from "../src/modules/auth/auth.service.js";
import { FarmsService } from "../src/modules/farms/farms.service.js";
import { AssessmentsService } from "../src/modules/assessments/assessments.service.js";
import { DocumentsService } from "../src/modules/documents/documents.service.js";
import { CropsService } from "../src/modules/crops/crops.service.js";
import { prisma } from "../src/config/prisma.js";
import { Role, DocumentType, DocumentStatus } from "@prisma/client";

describe("Live Demo Scenario End-to-End Flow", () => {
  let farmerToken: string;
  let farmerUserId: string;
  let testFarmId: string;
  let firstAssessmentId: string;
  const testEmail = `demo.farmer.${Date.now()}@agricred.test`;

  beforeAll(async () => {
    // Register a fresh demo farmer with baseline low readiness practices
    const regRes = await AuthService.register({
      email: testEmail,
      password: "TestPassword#2026",
      role: Role.FARMER,
      name: "Demo Flow Farmer",
      phone: "+91 99999 88888",
      state: "Punjab",
      district: "Ludhiana",
    });

    farmerToken = regRes.token;
    farmerUserId = regRes.user.id;

    // Create farm with conventional low readiness practices
    const farm = await FarmsService.createFarm(farmerUserId, {
      name: "Demo Flow Farm",
      areaAcres: 10.0,
      soilType: "Sandy Loam",
      irrigationMethod: "Flood Irrigation",
      waterSource: "Borewell",
      fertilizerUsage: "Heavy Chemical Urea",
      pesticideUsage: "Heavy Chemical",
      tillageMethod: "Conventional Deep Plowing",
      residueManagement: "Stubble Burning",
      organicPractices: false,
    });

    testFarmId = farm.id;

    // Single crop record
    await CropsService.createCrop(farmerUserId, Role.FARMER, {
      farmId: testFarmId,
      crop: "Paddy",
      season: "Kharif",
      year: 2024,
      yield: 3.5,
    });
  });

  afterAll(async () => {
    // Cleanup the isolated test user and associated cascade data
    try {
      await prisma.user.delete({ where: { id: farmerUserId } });
    } catch {
      // Ignore cleanup error
    }
  });

  it("Step 1-5: Start assessment, receive initial low readiness score (< 50, NEEDS_IMPROVEMENT)", async () => {
    const assessment = await AssessmentsService.createAssessment(
      testFarmId,
      farmerUserId,
      Role.FARMER
    );

    firstAssessmentId = assessment.id;

    expect(assessment.id).toBeDefined();
    expect(assessment.overallScore).toBeLessThan(50);
    expect(assessment.readinessLevel).toBe("NEEDS_IMPROVEMENT");
    expect(assessment.categories).toBeDefined();
    expect(assessment.categories.farmingPractices).toBeDefined();
    expect(assessment.categories.soilManagement).toBeDefined();
    expect(assessment.categories.irrigation).toBeDefined();
    expect(assessment.categories.cropHistory).toBeDefined();
    expect(assessment.categories.documentation).toBeDefined();
    expect(assessment.categories.evidenceQuality).toBeDefined();
    expect(assessment.strengths).toBeInstanceOf(Array);
    expect(assessment.gaps).toBeInstanceOf(Array);
    expect(assessment.recommendations.length).toBeGreaterThan(0);
  });

  it("Step 6: Show missing documentation in evidence summary", async () => {
    const summary = await DocumentsService.getEvidenceSummary(
      testFarmId,
      farmerUserId,
      Role.FARMER
    );

    expect(summary.missingCount).toBeGreaterThan(0);
    expect(summary.items.some((i) => i.status === "MISSING")).toBe(true);
  });

  it("Step 7-9: Upload evidence, add legumes, upgrade irrigation, and recalculate for improved score", async () => {
    const initialAssessment = await AssessmentsService.getAssessmentById(
      firstAssessmentId,
      farmerUserId,
      Role.FARMER
    );

    // Upload verified land title and soil test report
    await prisma.document.create({
      data: {
        farmId: testFarmId,
        type: DocumentType.LAND_DOCUMENT,
        filename: "verified_land_deed.pdf",
        storageUrl: "/uploads/verified_land_deed.pdf",
        mimeType: "application/pdf",
        fileSize: 200000,
        status: DocumentStatus.VERIFIED,
        uploadedBy: farmerUserId,
      },
    });

    await prisma.document.create({
      data: {
        farmId: testFarmId,
        type: DocumentType.SOIL_REPORT,
        filename: "soil_health_card.pdf",
        storageUrl: "/uploads/soil_health_card.pdf",
        mimeType: "application/pdf",
        fileSize: 300000,
        status: DocumentStatus.VERIFIED,
        uploadedBy: farmerUserId,
      },
    });

    // Add nitrogen-fixing pulse crop to rotation
    await CropsService.createCrop(farmerUserId, Role.FARMER, {
      farmId: testFarmId,
      crop: "Chickpea (Desi Chana)",
      season: "Rabi",
      year: 2024,
      yield: 2.1,
    });

    // Upgrade practices: stop burning, adopt mulching, drip irrigation, zero tillage
    await FarmsService.updateFarm(testFarmId, farmerUserId, Role.FARMER, {
      irrigationMethod: "Drip Micro-Irrigation",
      residueManagement: "In-situ Mulching with Happy Seeder",
      tillageMethod: "Zero Tillage",
      fertilizerUsage: "Biofertilizers & Compost",
      organicPractices: true,
    });

    // Recalculate assessment
    const reassessment = await AssessmentsService.recalculateAssessment(
      firstAssessmentId,
      farmerUserId,
      Role.FARMER
    );

    expect(reassessment.id).not.toBe(firstAssessmentId);
    expect(reassessment.overallScore).toBeGreaterThan(initialAssessment.overallScore);
    expect(reassessment.overallScore).toBeGreaterThanOrEqual(50);
  });

  it("Step 10: Toggle recommendation completed status", async () => {
    const assessment = await AssessmentsService.getAssessmentById(
      firstAssessmentId,
      farmerUserId,
      Role.FARMER
    );

    const rec = assessment.recommendations[0];
    if (rec) {
      const toggled = await AssessmentsService.toggleRecommendation(
        rec.id,
        farmerUserId,
        Role.FARMER
      );
      expect(toggled.completed).toBe(true);
    }
  });

  it("Step 11: View assessment history showing progression over time", async () => {
    const history = await AssessmentsService.getAssessmentsByFarmId(
      testFarmId,
      farmerUserId,
      Role.FARMER
    );

    expect(history.length).toBeGreaterThanOrEqual(2);
    // Ordered by newest first
    expect(new Date(history[0]!.createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(history[1]!.createdAt).getTime()
    );
  });
});
