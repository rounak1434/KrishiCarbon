import { describe, it, expect } from "vitest";
import { SCORING_CONFIG } from "../src/engine/scoring/scoring.config.js";
import { AssessmentEngine } from "../src/engine/scoring/assessment.engine.js";
import { DocumentType, DocumentStatus } from "@prisma/client";
import type { FarmAssessmentInput } from "../src/engine/scoring/scoring.types.js";

describe("Scoring Engine Boundary & Edge Case Audit", () => {
  it("should classify score thresholds precisely according to configuration", () => {
    expect(SCORING_CONFIG.thresholds.high).toBe(75);
    expect(SCORING_CONFIG.thresholds.moderate).toBe(50);

    // Helper to evaluate boundary classification
    const classify = (score: number) => {
      if (score >= SCORING_CONFIG.thresholds.high) return "HIGH_READINESS";
      if (score >= SCORING_CONFIG.thresholds.moderate) return "MODERATE_READINESS";
      return "NEEDS_IMPROVEMENT";
    };

    // Boundary 0
    expect(classify(0)).toBe("NEEDS_IMPROVEMENT");

    // Boundary 49
    expect(classify(49)).toBe("NEEDS_IMPROVEMENT");

    // Boundary 50
    expect(classify(50)).toBe("MODERATE_READINESS");

    // Boundary 74
    expect(classify(74)).toBe("MODERATE_READINESS");

    // Boundary 75
    expect(classify(75)).toBe("HIGH_READINESS");

    // Boundary 100
    expect(classify(100)).toBe("HIGH_READINESS");
  });

  it("should handle worst-case inputs without crashing or yielding scores outside 0-100", () => {
    const worstCaseInput: FarmAssessmentInput = {
      farm: {
        id: "worst-1",
        name: "Degraded Farm",
        areaAcres: 1.0,
        soilType: "Degraded Saline",
        irrigationMethod: "Wild Flood",
        waterSource: "Depleted Borewell",
        fertilizerUsage: "Excessive Urea",
        pesticideUsage: "Heavy Prophylactic Chemicals",
        tillageMethod: "Conventional Deep Plowing",
        residueManagement: "Stubble Burning",
        organicPractices: false,
      },
      crops: [],
      documents: [],
    };

    const result = AssessmentEngine.evaluate(worstCaseInput);

    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.readinessLevel).toBe("NEEDS_IMPROVEMENT");
    expect(result.categories.farmingPractices).toBeGreaterThanOrEqual(0);
    expect(result.categories.farmingPractices).toBeLessThanOrEqual(100);
    expect(result.categories.soilManagement).toBeGreaterThanOrEqual(0);
    expect(result.categories.soilManagement).toBeLessThanOrEqual(100);
    expect(result.categories.irrigation).toBeGreaterThanOrEqual(0);
    expect(result.categories.irrigation).toBeLessThanOrEqual(100);
    expect(result.categories.cropHistory).toBeGreaterThanOrEqual(0);
    expect(result.categories.cropHistory).toBeLessThanOrEqual(100);
    expect(result.categories.documentation).toBeGreaterThanOrEqual(0);
    expect(result.categories.documentation).toBeLessThanOrEqual(100);
    expect(result.categories.evidenceQuality).toBeGreaterThanOrEqual(0);
    expect(result.categories.evidenceQuality).toBeLessThanOrEqual(100);
  });

  it("should handle best-case inputs and clamp properly at 100", () => {
    const bestCaseInput: FarmAssessmentInput = {
      farm: {
        id: "best-1",
        name: "Model Agroforestry Farm",
        areaAcres: 50.0,
        soilType: "Black Cotton Soil",
        irrigationMethod: "Solar Drip Micro-Irrigation",
        waterSource: "Rainwater Harvesting Pond",
        fertilizerUsage: "Biofertilizers, Vermicompost & Compost",
        pesticideUsage: "Bio-pesticides & IPM",
        tillageMethod: "Zero Tillage",
        residueManagement: "In-situ Mulching & Biochar",
        organicPractices: true,
      },
      crops: [
        { id: "1", crop: "Soybean", season: "Kharif", year: 2024, yield: 2.8 },
        { id: "2", crop: "Chickpea (Gram)", season: "Rabi", year: 2024, yield: 2.3 },
        { id: "3", crop: "Moong (Green Gram)", season: "Zaid", year: 2024, yield: 1.5 },
        { id: "4", crop: "Mustard", season: "Rabi", year: 2023, yield: 1.9 },
        { id: "5", crop: "Pigeon Pea", season: "Kharif", year: 2023, yield: 2.0 },
      ],
      documents: [
        { id: "1", type: DocumentType.LAND_DOCUMENT, status: DocumentStatus.VERIFIED, filename: "deed.pdf", fileSize: 100 },
        { id: "2", type: DocumentType.SOIL_REPORT, status: DocumentStatus.VERIFIED, filename: "soil.pdf", fileSize: 100 },
        { id: "3", type: DocumentType.CROP_RECORD, status: DocumentStatus.VERIFIED, filename: "crops.pdf", fileSize: 100 },
        { id: "4", type: DocumentType.IRRIGATION_RECORD, status: DocumentStatus.VERIFIED, filename: "irr.pdf", fileSize: 100 },
        { id: "5", type: DocumentType.FERTILIZER_RECORD, status: DocumentStatus.VERIFIED, filename: "fert.pdf", fileSize: 100 },
        { id: "6", type: DocumentType.PRACTICE_PHOTO, status: DocumentStatus.VERIFIED, filename: "photo.jpg", fileSize: 100 },
      ],
    };

    const result = AssessmentEngine.evaluate(bestCaseInput);

    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.overallScore).toBeGreaterThanOrEqual(75);
    expect(result.readinessLevel).toBe("HIGH_READINESS");
    expect(result.engineVersion).toBe(SCORING_CONFIG.engineVersion);
  });
});
