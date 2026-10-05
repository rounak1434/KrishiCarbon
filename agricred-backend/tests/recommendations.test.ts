import { describe, it, expect } from "vitest";
import { RecommendationService } from "../src/engine/recommendations/recommendation.service.js";
import { DocumentType } from "@prisma/client";
import type { CategoryBreakdown, FarmAssessmentInput } from "../src/engine/scoring/scoring.types.js";
import type { EvidenceAuditSummary } from "../src/engine/evidence/evidence.types.js";

describe("Recommendation Engine Tests", () => {
  const baseFarm: FarmAssessmentInput["farm"] = {
    id: "f1",
    name: "Rec Farm",
    areaAcres: 10,
    soilType: "Loam",
    irrigationMethod: "Flood",
    waterSource: "Borewell",
    fertilizerUsage: "Chemical",
    pesticideUsage: "Chemical",
    tillageMethod: "Conventional",
    residueManagement: "Stubble Burning",
    organicPractices: false,
  };

  const baseAudit: EvidenceAuditSummary = {
    totalExpected: 5,
    totalUploaded: 0,
    verifiedCount: 0,
    pendingCount: 0,
    missingCount: 5,
    rejectedCount: 0,
    qualityScore: 0,
    items: [
      { documentType: DocumentType.SOIL_REPORT, label: "Soil Report", status: "MISSING" },
      { documentType: DocumentType.LAND_DOCUMENT, label: "Land Title", status: "MISSING" },
    ],
    missingTypes: [DocumentType.SOIL_REPORT, DocumentType.LAND_DOCUMENT],
  };

  it("should generate HIGH priority recommendations for flood irrigation and residue burning", () => {
    const categories: CategoryBreakdown = {
      farmingPractices: 30,
      soilManagement: 35,
      irrigation: 30,
      cropHistory: 30,
      documentation: 0,
      evidenceQuality: 0,
    };

    const recs = RecommendationService.generate(categories, baseFarm, [], baseAudit);

    const irrigationRec = recs.find((r) => r.category === "Irrigation");
    expect(irrigationRec).toBeDefined();
    expect(irrigationRec?.priority).toBe("HIGH");
    expect(irrigationRec?.message).toContain("micro-irrigation");

    const practiceRec = recs.find(
      (r) => r.category === "Farming Practices" && r.message.includes("burning")
    );
    expect(practiceRec).toBeDefined();
    expect(practiceRec?.priority).toBe("HIGH");

    const soilRec = recs.find((r) => r.category === "Soil Management" && r.message.includes("soil test"));
    expect(soilRec).toBeDefined();
    expect(soilRec?.priority).toBe("HIGH");
  });

  it("should recommend crop history records when fewer than 3 crops exist", () => {
    const categories: CategoryBreakdown = {
      farmingPractices: 80,
      soilManagement: 80,
      irrigation: 80,
      cropHistory: 40,
      documentation: 80,
      evidenceQuality: 80,
    };

    const recs = RecommendationService.generate(categories, baseFarm, [{ id: "c1", crop: "Wheat", season: "Rabi", year: 2024, yield: 3.5 }], baseAudit);

    const cropRec = recs.find((r) => r.category === "Crop History" && r.message.includes("3 consecutive"));
    expect(cropRec).toBeDefined();
    expect(cropRec?.priority).toBe("MEDIUM");
  });
});
