/**
 * ============================================================================
 * DEVELOPMENT & TEST FIXTURES ONLY
 * ============================================================================
 * This seed file provides synthetic test accounts for local development and
 * hackathon demonstration purposes.
 *
 * THIS FILE IS NEVER EXECUTED AUTOMATICALLY DURING PRODUCTION STARTUP.
 * AgriCred production runtime does not require or depend on seeded records.
 * ============================================================================
 */
import bcrypt from "bcrypt";
import { PrismaClient, Role, DocumentType, DocumentStatus, AssessmentStatus, RecommendationPriority } from "@prisma/client";
import { AssessmentEngine } from "../src/engine/scoring/assessment.engine.js";
import { SCORING_CONFIG } from "../src/engine/scoring/scoring.config.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting AgriCred database seed...");

  // Clean existing demo data
  await prisma.auditLog.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.assessmentCategoryScore.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.cropHistory.deleteMany();
  await prisma.farm.deleteMany();
  await prisma.farmer.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("AgriCred#2026", 10);
  const adminPasswordHash = await bcrypt.hash("Admin#2026", 10);

  // 1. Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@agricred.demo",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Seeded Admin: ${adminUser.email}`);

  // 2. Farmer 1: Low Readiness (Punjab - Conventional, Burning, Flood)
  const lowFarmerUser = await prisma.user.create({
    data: {
      email: "farmer.suresh@agricred.demo",
      passwordHash,
      role: Role.FARMER,
      farmer: {
        create: {
          name: "Suresh Verma",
          phone: "+91 98230 11223",
          state: "Punjab",
          district: "Ludhiana",
        },
      },
    },
    include: { farmer: true },
  });

  const lowFarm = await prisma.farm.create({
    data: {
      farmerId: lowFarmerUser.farmer!.id,
      name: "Verma Wheat & Paddy Farm",
      areaAcres: 8.5,
      soilType: "Sandy Loam",
      irrigationMethod: "Flood Irrigation",
      waterSource: "Borewell (Deep Groundwater)",
      fertilizerUsage: "Heavy Chemical Urea & DAP",
      pesticideUsage: "Regular Chemical Insecticides",
      tillageMethod: "Conventional Deep Tillage",
      residueManagement: "Stubble Burning",
      organicPractices: false,
    },
  });

  await prisma.cropHistory.createMany({
    data: [
      {
        farmId: lowFarm.id,
        crop: "Wheat",
        season: "Rabi",
        year: 2024,
        yield: 4.2,
      },
    ],
  });

  const lowDocs = await prisma.document.create({
    data: {
      farmId: lowFarm.id,
      type: DocumentType.OTHER,
      filename: "electricity_bill.pdf",
      storageUrl: "/uploads/electricity_bill.pdf",
      mimeType: "application/pdf",
      fileSize: 154200,
      status: DocumentStatus.REVIEW_REQUIRED,
      uploadedBy: lowFarmerUser.id,
    },
  });

  // Run assessment engine for Low Farmer
  const lowEvaluation = AssessmentEngine.evaluate({
    farm: {
      id: lowFarm.id,
      name: lowFarm.name,
      areaAcres: lowFarm.areaAcres,
      soilType: lowFarm.soilType,
      irrigationMethod: lowFarm.irrigationMethod,
      waterSource: lowFarm.waterSource,
      fertilizerUsage: lowFarm.fertilizerUsage,
      pesticideUsage: lowFarm.pesticideUsage,
      tillageMethod: lowFarm.tillageMethod,
      residueManagement: lowFarm.residueManagement,
      organicPractices: lowFarm.organicPractices,
    },
    crops: [{ id: "c1", crop: "Wheat", season: "Rabi", year: 2024, yield: 4.2 }],
    documents: [
      {
        id: lowDocs.id,
        type: lowDocs.type,
        status: lowDocs.status,
        filename: lowDocs.filename,
        fileSize: lowDocs.fileSize,
      },
    ],
  });

  const lowAssessment = await prisma.assessment.create({
    data: {
      farmId: lowFarm.id,
      overallScore: lowEvaluation.overallScore,
      readinessLevel: lowEvaluation.readinessLevel,
      status: AssessmentStatus.COMPLETED,
      engineVersion: lowEvaluation.engineVersion,
      summary: {
        readinessLabel: lowEvaluation.readinessLabel,
        strengths: lowEvaluation.strengths,
        gaps: lowEvaluation.gaps,
        factors: lowEvaluation.factors,
        disclaimer: lowEvaluation.disclaimer,
      },
      categoryScores: {
        create: Object.entries(lowEvaluation.categories).map(([category, score]) => ({
          category,
          score,
          weight: SCORING_CONFIG.weights[category as keyof typeof SCORING_CONFIG.weights] || 1.0,
        })),
      },
      recommendations: {
        create: lowEvaluation.recommendations.map((r) => ({
          category: r.category,
          priority: r.priority as RecommendationPriority,
          message: r.message,
          completed: false,
        })),
      },
    },
  });
  console.log(`✅ Seeded Low Readiness Farmer: ${lowFarmerUser.farmer!.name} (Score: ${lowAssessment.overallScore})`);

  // 3. Farmer 2: Moderate Readiness (Madhya Pradesh - Reduced Till, Furrow, Balanced)
  const modFarmerUser = await prisma.user.create({
    data: {
      email: "farmer.anil@agricred.demo",
      passwordHash,
      role: Role.FARMER,
      farmer: {
        create: {
          name: "Anil Kumar",
          phone: "+91 98765 22334",
          state: "Madhya Pradesh",
          district: "Indore",
        },
      },
    },
    include: { farmer: true },
  });

  const modFarm = await prisma.farm.create({
    data: {
      farmerId: modFarmerUser.farmer!.id,
      name: "Kumar Agro Farm",
      areaAcres: 14.0,
      soilType: "Alluvial Loam",
      irrigationMethod: "Furrow Irrigation & Sprinkler",
      waterSource: "Canal & Tubewell",
      fertilizerUsage: "Balanced NPK with Farmyard Manure",
      pesticideUsage: "Selective Chemical & Targeted Sprays",
      tillageMethod: "Reduced Conservation Tillage",
      residueManagement: "Baling and Compost Removal",
      organicPractices: false,
    },
  });

  const modCrops = await prisma.cropHistory.createManyAndReturn({
    data: [
      { farmId: modFarm.id, crop: "Soybean", season: "Kharif", year: 2024, yield: 2.1 },
      { farmId: modFarm.id, crop: "Wheat", season: "Rabi", year: 2024, yield: 4.8 },
      { farmId: modFarm.id, crop: "Chickpea", season: "Rabi", year: 2023, yield: 1.9 },
    ],
  });

  const modDocs = await prisma.document.createManyAndReturn({
    data: [
      {
        farmId: modFarm.id,
        type: DocumentType.LAND_DOCUMENT,
        filename: "land_khasra_712.pdf",
        storageUrl: "/uploads/land_khasra_712.pdf",
        mimeType: "application/pdf",
        fileSize: 450000,
        status: DocumentStatus.VERIFIED,
        uploadedBy: modFarmerUser.id,
      },
      {
        farmId: modFarm.id,
        type: DocumentType.CROP_RECORD,
        filename: "mandi_receipts_2024.pdf",
        storageUrl: "/uploads/mandi_receipts_2024.pdf",
        mimeType: "application/pdf",
        fileSize: 220000,
        status: DocumentStatus.REVIEW_REQUIRED,
        uploadedBy: modFarmerUser.id,
      },
      {
        farmId: modFarm.id,
        type: DocumentType.SOIL_REPORT,
        filename: "soil_sample_card_2024.pdf",
        storageUrl: "/uploads/soil_sample_card_2024.pdf",
        mimeType: "application/pdf",
        fileSize: 310000,
        status: DocumentStatus.REVIEW_REQUIRED,
        uploadedBy: modFarmerUser.id,
      },
    ],
  });

  const modEvaluation = AssessmentEngine.evaluate({
    farm: {
      id: modFarm.id,
      name: modFarm.name,
      areaAcres: modFarm.areaAcres,
      soilType: modFarm.soilType,
      irrigationMethod: modFarm.irrigationMethod,
      waterSource: modFarm.waterSource,
      fertilizerUsage: modFarm.fertilizerUsage,
      pesticideUsage: modFarm.pesticideUsage,
      tillageMethod: modFarm.tillageMethod,
      residueManagement: modFarm.residueManagement,
      organicPractices: modFarm.organicPractices,
    },
    crops: modCrops.map((c) => ({ id: c.id, crop: c.crop, season: c.season, year: c.year, yield: c.yield })),
    documents: modDocs.map((d) => ({
      id: d.id,
      type: d.type,
      status: d.status,
      filename: d.filename,
      fileSize: d.fileSize,
    })),
  });

  const modAssessment = await prisma.assessment.create({
    data: {
      farmId: modFarm.id,
      overallScore: modEvaluation.overallScore,
      readinessLevel: modEvaluation.readinessLevel,
      status: AssessmentStatus.COMPLETED,
      engineVersion: modEvaluation.engineVersion,
      summary: {
        readinessLabel: modEvaluation.readinessLabel,
        strengths: modEvaluation.strengths,
        gaps: modEvaluation.gaps,
        factors: modEvaluation.factors,
        disclaimer: modEvaluation.disclaimer,
      },
      categoryScores: {
        create: Object.entries(modEvaluation.categories).map(([category, score]) => ({
          category,
          score,
          weight: SCORING_CONFIG.weights[category as keyof typeof SCORING_CONFIG.weights] || 1.0,
        })),
      },
      recommendations: {
        create: modEvaluation.recommendations.map((r) => ({
          category: r.category,
          priority: r.priority as RecommendationPriority,
          message: r.message,
          completed: false,
        })),
      },
    },
  });
  console.log(`✅ Seeded Moderate Readiness Farmer: ${modFarmerUser.farmer!.name} (Score: ${modAssessment.overallScore})`);

  // 4. Farmer 3: High Readiness (Maharashtra - Zero Till, Drip, Organic, Mulching, Verified Docs)
  const highFarmerUser = await prisma.user.create({
    data: {
      email: "farmer.lakshmi@agricred.demo",
      passwordHash,
      role: Role.FARMER,
      farmer: {
        create: {
          name: "Lakshmi Devi",
          phone: "+91 99123 44556",
          state: "Maharashtra",
          district: "Amravati",
        },
      },
    },
    include: { farmer: true },
  });

  const highFarm = await prisma.farm.create({
    data: {
      farmerId: highFarmerUser.farmer!.id,
      name: "Pragati Regenerative Organics",
      areaAcres: 20.0,
      soilType: "Black Cotton Soil (Vertisol)",
      irrigationMethod: "Drip Micro-Irrigation",
      waterSource: "Rainwater Harvesting Farm Pond & Solar Borewell",
      fertilizerUsage: "Biofertilizers, Vermicompost & Jeevamrutha",
      pesticideUsage: "Integrated Pest Management (Neem & Pheromone Traps)",
      tillageMethod: "Zero Tillage with Seed Drill",
      residueManagement: "In-situ Mulching & Biochar Incorporation",
      organicPractices: true,
    },
  });

  const highCrops = await prisma.cropHistory.createManyAndReturn({
    data: [
      { farmId: highFarm.id, crop: "Cotton (Intercropped with Pigeon Pea)", season: "Kharif", year: 2024, yield: 2.8 },
      { farmId: highFarm.id, crop: "Chickpea (Desi Chana)", season: "Rabi", year: 2024, yield: 2.2 },
      { farmId: highFarm.id, crop: "Green Gram (Moong)", season: "Zaid", year: 2024, yield: 1.4 },
      { farmId: highFarm.id, crop: "Mustard & Linseed", season: "Rabi", year: 2023, yield: 1.8 },
    ],
  });

  const highDocs = await prisma.document.createManyAndReturn({
    data: [
      {
        farmId: highFarm.id,
        type: DocumentType.LAND_DOCUMENT,
        filename: "satbara_7_12_deed.pdf",
        storageUrl: "/uploads/satbara_7_12_deed.pdf",
        mimeType: "application/pdf",
        fileSize: 520000,
        status: DocumentStatus.VERIFIED,
        uploadedBy: highFarmerUser.id,
      },
      {
        farmId: highFarm.id,
        type: DocumentType.SOIL_REPORT,
        filename: "icar_soil_carbon_test_2024.pdf",
        storageUrl: "/uploads/icar_soil_carbon_test_2024.pdf",
        mimeType: "application/pdf",
        fileSize: 840000,
        status: DocumentStatus.VERIFIED,
        extractedData: {
          soilOrganicCarbonPct: 0.85,
          phLevel: 7.2,
          confidenceScore: 0.95,
          extractionMethod: "AI",
        },
        uploadedBy: highFarmerUser.id,
      },
      {
        farmId: highFarm.id,
        type: DocumentType.CROP_RECORD,
        filename: "crop_cutting_yield_report.pdf",
        storageUrl: "/uploads/crop_cutting_yield_report.pdf",
        mimeType: "application/pdf",
        fileSize: 410000,
        status: DocumentStatus.VERIFIED,
        uploadedBy: highFarmerUser.id,
      },
      {
        farmId: highFarm.id,
        type: DocumentType.IRRIGATION_RECORD,
        filename: "micro_irrigation_sensor_logs.pdf",
        storageUrl: "/uploads/micro_irrigation_sensor_logs.pdf",
        mimeType: "application/pdf",
        fileSize: 340000,
        status: DocumentStatus.VERIFIED,
        uploadedBy: highFarmerUser.id,
      },
      {
        farmId: highFarm.id,
        type: DocumentType.FERTILIZER_RECORD,
        filename: "bio_input_purchase_vouchers.pdf",
        storageUrl: "/uploads/bio_input_purchase_vouchers.pdf",
        mimeType: "application/pdf",
        fileSize: 280000,
        status: DocumentStatus.VERIFIED,
        uploadedBy: highFarmerUser.id,
      },
      {
        farmId: highFarm.id,
        type: DocumentType.PRACTICE_PHOTO,
        filename: "drip_mulch_field_photo.jpg",
        storageUrl: "/uploads/drip_mulch_field_photo.jpg",
        mimeType: "image/jpeg",
        fileSize: 1250000,
        status: DocumentStatus.VERIFIED,
        uploadedBy: highFarmerUser.id,
      },
    ],
  });

  const highEvaluation = AssessmentEngine.evaluate({
    farm: {
      id: highFarm.id,
      name: highFarm.name,
      areaAcres: highFarm.areaAcres,
      soilType: highFarm.soilType,
      irrigationMethod: highFarm.irrigationMethod,
      waterSource: highFarm.waterSource,
      fertilizerUsage: highFarm.fertilizerUsage,
      pesticideUsage: highFarm.pesticideUsage,
      tillageMethod: highFarm.tillageMethod,
      residueManagement: highFarm.residueManagement,
      organicPractices: highFarm.organicPractices,
    },
    crops: highCrops.map((c) => ({ id: c.id, crop: c.crop, season: c.season, year: c.year, yield: c.yield })),
    documents: highDocs.map((d) => ({
      id: d.id,
      type: d.type,
      status: d.status,
      filename: d.filename,
      fileSize: d.fileSize,
    })),
  });

  const highAssessment = await prisma.assessment.create({
    data: {
      farmId: highFarm.id,
      overallScore: highEvaluation.overallScore,
      readinessLevel: highEvaluation.readinessLevel,
      status: AssessmentStatus.COMPLETED,
      engineVersion: highEvaluation.engineVersion,
      summary: {
        readinessLabel: highEvaluation.readinessLabel,
        strengths: highEvaluation.strengths,
        gaps: highEvaluation.gaps,
        factors: highEvaluation.factors,
        disclaimer: highEvaluation.disclaimer,
      },
      categoryScores: {
        create: Object.entries(highEvaluation.categories).map(([category, score]) => ({
          category,
          score,
          weight: SCORING_CONFIG.weights[category as keyof typeof SCORING_CONFIG.weights] || 1.0,
        })),
      },
      recommendations: {
        create: highEvaluation.recommendations.map((r) => ({
          category: r.category,
          priority: r.priority as RecommendationPriority,
          message: r.message,
          completed: false,
        })),
      },
    },
  });
  console.log(`✅ Seeded High Readiness Farmer: ${highFarmerUser.farmer!.name} (Score: ${highAssessment.overallScore})`);

  console.log("\n==============================================");
  console.log("🌾 AgriCred Database Seeding Completed!");
  console.log("==============================================");
  console.log("Demo Credentials:");
  console.log("Admin:     admin@agricred.demo         / Admin#2026");
  console.log("Low:       farmer.suresh@agricred.demo / AgriCred#2026 (Score: ~30)");
  console.log("Moderate:  farmer.anil@agricred.demo   / AgriCred#2026 (Score: ~65)");
  console.log("High:      farmer.lakshmi@agricred.demo/ AgriCred#2026 (Score: ~88)");
  console.log("==============================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
