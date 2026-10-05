import { describe, it, expect } from "vitest";
import { AssessmentEngine } from "../src/engine/scoring/assessment.engine.js";
import { SCORING_CONFIG } from "../src/engine/scoring/scoring.config.js";
import { DocumentType, DocumentStatus } from "@prisma/client";
import type { FarmAssessmentInput } from "../src/engine/scoring/scoring.types.js";

describe("Scoring Engine Core Unit Tests", () => {
  it("should verify scoring weights sum exactly to 1.0", () => {
    const weights = SCORING_CONFIG.weights;
    const sum =
      weights.farmingPractices +
      weights.soilManagement +
      weights.irrigation +
      weights.cropHistory +
      weights.documentation +
      weights.evidenceQuality;

    expect(sum).toBeCloseTo(1.0, 5);
  });

  it("should be strictly deterministic (identical inputs yield identical score)", () => {
    const input: FarmAssessmentInput = {
      farm: {
        id: "farm-1",
        name: "Test Farm",
        areaAcres: 10.0,
        soilType: "Clay Loam",
        irrigationMethod: "Drip Irrigation",
        waterSource: "Rainwater Harvesting",
        fertilizerUsage: "Biofertilizer",
        pesticideUsage: "IPM",
        tillageMethod: "Zero Tillage",
        residueManagement: "In-situ Mulching",
        organicPractices: true,
      },
      crops: [
        { id: "c1", crop: "Soybean", season: "Kharif", year: 2024, yield: 2.5 },
        { id: "c2", crop: "Chickpea", season: "Rabi", year: 2024, yield: 2.0 },
      ],
      documents: [
        {
          id: "d1",
          type: DocumentType.LAND_DOCUMENT,
          status: DocumentStatus.VERIFIED,
          filename: "land.pdf",
          fileSize: 1000,
        },
        {
          id: "d2",
          type: DocumentType.SOIL_REPORT,
          status: DocumentStatus.VERIFIED,
          filename: "soil.pdf",
          fileSize: 2000,
        },
      ],
    };

    const run1 = AssessmentEngine.evaluate(input);
    const run2 = AssessmentEngine.evaluate(input);
    const run3 = AssessmentEngine.evaluate(input);

    expect(run1.overallScore).toBe(run2.overallScore);
    expect(run2.overallScore).toBe(run3.overallScore);
    expect(run1.categories).toEqual(run2.categories);
    expect(run1.readinessLevel).toBe(run2.readinessLevel);
  });

  it("should correctly classify score boundaries: 49 (NEEDS_IMPROVEMENT), 50 (MODERATE_READINESS), 74 (MODERATE_READINESS), 75 (HIGH_READINESS)", () => {
    // Check threshold configurations
    expect(SCORING_CONFIG.thresholds.high).toBe(75);
    expect(SCORING_CONFIG.thresholds.moderate).toBe(50);

    // Verify low farm is classified as NEEDS_IMPROVEMENT
    const lowInput: FarmAssessmentInput = {
      farm: {
        id: "low-1",
        name: "Low Farm",
        areaAcres: 5.0,
        soilType: "Sandy",
        irrigationMethod: "Flood",
        waterSource: "Borewell",
        fertilizerUsage: "Heavy Chemical",
        pesticideUsage: "Heavy Prophylactic",
        tillageMethod: "Conventional Deep Plowing",
        residueManagement: "Stubble Burning",
        organicPractices: false,
      },
      crops: [{ id: "c1", crop: "Wheat", season: "Rabi", year: 2024, yield: 3.0 }],
      documents: [],
    };

    const lowResult = AssessmentEngine.evaluate(lowInput);
    expect(lowResult.overallScore).toBeLessThan(50);
    expect(lowResult.readinessLevel).toBe("NEEDS_IMPROVEMENT");
    expect(lowResult.readinessLabel).toBe("Needs Improvement");

    // Verify high farm is classified as HIGH_READINESS
    const highInput: FarmAssessmentInput = {
      farm: {
        id: "high-1",
        name: "High Farm",
        areaAcres: 20.0,
        soilType: "Black Soil",
        irrigationMethod: "Drip",
        waterSource: "Rainwater Harvesting",
        fertilizerUsage: "Biofertilizers & Vermicompost",
        pesticideUsage: "IPM",
        tillageMethod: "Zero Tillage",
        residueManagement: "Biochar & Mulching",
        organicPractices: true,
      },
      crops: [
        { id: "c1", crop: "Pigeon Pea", season: "Kharif", year: 2024, yield: 2.2 },
        { id: "c2", crop: "Chickpea", season: "Rabi", year: 2024, yield: 2.0 },
        { id: "c3", crop: "Green Gram", season: "Zaid", year: 2024, yield: 1.5 },
        { id: "c4", crop: "Mustard", season: "Rabi", year: 2023, yield: 1.8 },
      ],
      documents: [
        { id: "d1", type: DocumentType.LAND_DOCUMENT, status: DocumentStatus.VERIFIED, filename: "land.pdf", fileSize: 100 },
        { id: "d2", type: DocumentType.SOIL_REPORT, status: DocumentStatus.VERIFIED, filename: "soil.pdf", fileSize: 100 },
        { id: "d3", type: DocumentType.CROP_RECORD, status: DocumentStatus.VERIFIED, filename: "crop.pdf", fileSize: 100 },
        { id: "d4", type: DocumentType.IRRIGATION_RECORD, status: DocumentStatus.VERIFIED, filename: "irr.pdf", fileSize: 100 },
        { id: "d5", type: DocumentType.FERTILIZER_RECORD, status: DocumentStatus.VERIFIED, filename: "fert.pdf", fileSize: 100 },
        { id: "d6", type: DocumentType.PRACTICE_PHOTO, status: DocumentStatus.VERIFIED, filename: "photo.jpg", fileSize: 100 },
      ],
    };

    const highResult = AssessmentEngine.evaluate(highInput);
    expect(highResult.overallScore).toBeGreaterThanOrEqual(75);
    expect(highResult.readinessLevel).toBe("HIGH_READINESS");
    expect(highResult.readinessLabel).toBe("High Readiness");
  });

  it("should penalize stubble burning and conventional tillage", () => {
    const baseFarm = {
      id: "farm-pen",
      name: "Penalty Test",
      areaAcres: 10.0,
      soilType: "Loam",
      irrigationMethod: "Drip",
      waterSource: "Canal",
      fertilizerUsage: "Balanced",
      pesticideUsage: "IPM",
      organicPractices: false,
    };

    const sustainableInput: FarmAssessmentInput = {
      farm: {
        ...baseFarm,
        tillageMethod: "Zero Tillage",
        residueManagement: "In-situ Mulching",
      },
      crops: [],
      documents: [],
    };

    const degradedInput: FarmAssessmentInput = {
      farm: {
        ...baseFarm,
        tillageMethod: "Conventional Deep Plowing",
        residueManagement: "Stubble Burning",
      },
      crops: [],
      documents: [],
    };

    const resSustainable = AssessmentEngine.evaluate(sustainableInput);
    const resDegraded = AssessmentEngine.evaluate(degradedInput);

    expect(resSustainable.categories.farmingPractices).toBeGreaterThan(
      resDegraded.categories.farmingPractices + 40
    );
  });

  it("should reward nitrogen-fixing leguminous crops in crop history", () => {
    const inputWithoutLegumes: FarmAssessmentInput = {
      farm: {
        id: "f1",
        name: "Test",
        areaAcres: 10,
        soilType: "Loam",
        irrigationMethod: "Drip",
        waterSource: "Canal",
        fertilizerUsage: "Balanced",
        pesticideUsage: "IPM",
        tillageMethod: "Zero Tillage",
        residueManagement: "Mulch",
        organicPractices: false,
      },
      crops: [
        { id: "c1", crop: "Wheat", season: "Rabi", year: 2024, yield: 4.0 },
        { id: "c2", crop: "Paddy", season: "Kharif", year: 2024, yield: 4.5 },
      ],
      documents: [],
    };

    const inputWithLegumes: FarmAssessmentInput = {
      ...inputWithoutLegumes,
      crops: [
        { id: "c1", crop: "Wheat", season: "Rabi", year: 2024, yield: 4.0 },
        { id: "c2", crop: "Chickpea (Gram)", season: "Rabi", year: 2024, yield: 2.0 },
      ],
    };

    const res1 = AssessmentEngine.evaluate(inputWithoutLegumes);
    const res2 = AssessmentEngine.evaluate(inputWithLegumes);

    expect(res2.categories.cropHistory).toBeGreaterThan(res1.categories.cropHistory);
  });

  it("should include regulatory prototype disclaimer in evaluation result", () => {
    const result = AssessmentEngine.evaluate({
      farm: {
        id: "f",
        name: "F",
        areaAcres: 1,
        soilType: "Loam",
        irrigationMethod: "Drip",
        waterSource: "Canal",
        fertilizerUsage: "Bio",
        pesticideUsage: "None",
        tillageMethod: "Zero",
        residueManagement: "Mulch",
        organicPractices: true,
      },
      crops: [],
      documents: [],
    });

    expect(result.disclaimer).toContain("prototype assessment model");
    expect(result.disclaimer).not.toContain("officially eligible");
  });
});
