import { describe, it, expect, beforeAll } from "vitest";
import { AssessmentEngine } from "../src/engine/scoring/assessment.engine.js";
import { SCORING_CONFIG } from "../src/engine/scoring/scoring.config.js";
import { RecommendationService } from "../src/engine/recommendations/recommendation.service.js";
import { FarmsService } from "../src/modules/farms/farms.service.js";
import { AssessmentsService } from "../src/modules/assessments/assessments.service.js";
import { AuthService } from "../src/modules/auth/auth.service.js";
import { prisma } from "../src/config/prisma.js";
import {
  FertilizerCategory,
  OrganicFertilizerType,
  DocumentType,
  DocumentStatus,
  Role,
} from "@prisma/client";
import type { FarmAssessmentInput } from "../src/engine/scoring/scoring.types.js";
import type { EvidenceAuditSummary } from "../src/engine/evidence/evidence.types.js";

describe("Organic Fertilizer Management Assessment & Persistence Tests", () => {
  const baseAudit: EvidenceAuditSummary = {
    totalExpected: 5,
    totalUploaded: 0,
    verifiedCount: 0,
    pendingCount: 0,
    missingCount: 5,
    rejectedCount: 0,
    qualityScore: 0,
    items: [],
    missingTypes: [DocumentType.LAND_DOCUMENT, DocumentType.SOIL_REPORT],
  };

  const createBaseFarmInput = (overrides?: Partial<FarmAssessmentInput["farm"]>): FarmAssessmentInput => ({
    farm: {
      id: "test-farm-1",
      name: "Greenfield Test Farm",
      areaAcres: 10.0,
      soilType: "Alluvial Loam",
      irrigationMethod: "Drip Irrigation",
      waterSource: "Borewell",
      fertilizerUsage: "Standard Fertilizer",
      fertilizerCategory: null,
      organicFertilizerType: null,
      pesticideUsage: "IPM",
      tillageMethod: "Reduced Tillage",
      residueManagement: "In-situ Mulching",
      organicPractices: false,
      ...overrides,
    },
    crops: [
      { id: "c1", crop: "Wheat", season: "Rabi", year: 2024, yield: 3.5 },
      { id: "c2", crop: "Paddy", season: "Kharif", year: 2024, yield: 4.0 },
      { id: "c3", crop: "Chickpea", season: "Rabi", year: 2023, yield: 1.8 },
    ],
    documents: [],
  });

  // 1. Organic fertilizer input tests
  describe("1. Organic Fertilizer Input & Sub-types", () => {
    it("should positively contribute to Farming Practices and Soil Management for ORGANIC category", () => {
      const input = createBaseFarmInput({
        fertilizerCategory: FertilizerCategory.ORGANIC,
        organicFertilizerType: OrganicFertilizerType.VERMICOMPOST,
      });

      const result = AssessmentEngine.evaluate(input);
      const rules = SCORING_CONFIG.fertilizerRules;

      const expectedBonus = rules.farmingPractices.ORGANIC + rules.organicTypeBonuses.VERMICOMPOST;
      expect(result.strengths.some((s) => s.includes("Organic nutrient management is being practiced"))).toBe(true);
      expect(result.strengths.some((s) => s.includes("Vermicompost"))).toBe(true);
      expect(result.factors.some((f) => f.includes(`+${expectedBonus} pts`))).toBe(true);
      expect(result.categories.farmingPractices).toBeGreaterThanOrEqual(70);
    });

    it("should support all defined organic fertilizer types with their respective bonuses", () => {
      const types = [
        OrganicFertilizerType.COMPOST,
        OrganicFertilizerType.FARMYARD_MANURE,
        OrganicFertilizerType.VERMICOMPOST,
        OrganicFertilizerType.BIOFERTILIZER,
        OrganicFertilizerType.GREEN_MANURE,
        OrganicFertilizerType.OTHER,
      ];

      for (const t of types) {
        const input = createBaseFarmInput({
          fertilizerCategory: FertilizerCategory.ORGANIC,
          organicFertilizerType: t,
        });
        const result = AssessmentEngine.evaluate(input);
        const bonus = SCORING_CONFIG.fertilizerRules.farmingPractices.ORGANIC + SCORING_CONFIG.fertilizerRules.organicTypeBonuses[t];
        expect(result.factors.some((f) => f.includes(`+${bonus} pts`))).toBe(true);
      }
    });
  });

  // 2. Synthetic fertilizer input tests
  describe("2. Synthetic Fertilizer Input (Nuanced Model)", () => {
    it("should treat standard synthetic fertilizer as neutral baseline without severe automatic penalty", () => {
      const input = createBaseFarmInput({
        fertilizerCategory: FertilizerCategory.SYNTHETIC,
        fertilizerUsage: "Balanced Urea & DAP application",
      });

      const result = AssessmentEngine.evaluate(input);
      expect(result.gaps.some((g) => g.includes("Current fertilizer management relies primarily on synthetic inputs"))).toBe(true);
      expect(result.factors.some((f) => f.includes("Synthetic fertilizer practice (baseline)"))).toBe(true);
    });

    it("should penalize excessive or heavy synthetic dependence", () => {
      const baselineInput = createBaseFarmInput({
        fertilizerCategory: FertilizerCategory.SYNTHETIC,
        fertilizerUsage: "Standard Synthetic",
      });

      const excessiveInput = createBaseFarmInput({
        fertilizerCategory: FertilizerCategory.SYNTHETIC,
        fertilizerUsage: "Excessive Heavy Urea Applications",
      });

      const baseResult = AssessmentEngine.evaluate(baselineInput);
      const excessiveResult = AssessmentEngine.evaluate(excessiveInput);

      expect(baseResult.categories.farmingPractices).toBeGreaterThan(excessiveResult.categories.farmingPractices);
      expect(excessiveResult.gaps.some((g) => g.includes("relies heavily on excessive synthetic chemical inputs"))).toBe(true);
      expect(excessiveResult.factors.some((f) => f.includes("Excessive synthetic fertilizer penalty"))).toBe(true);
    });
  });

  // 3. Integrated fertilizer input tests
  describe("3. Integrated Fertilizer Management", () => {
    it("should recognize INTEGRATED management with a positive/moderate score contribution", () => {
      const input = createBaseFarmInput({
        fertilizerCategory: FertilizerCategory.INTEGRATED,
        fertilizerUsage: "Integrated Nutrient Management (FYM + NPK)",
      });

      const result = AssessmentEngine.evaluate(input);
      const rules = SCORING_CONFIG.fertilizerRules;

      expect(result.strengths.some((s) => s.includes("Integrated nutrient management is being practiced"))).toBe(true);
      expect(result.factors.some((f) => f.includes(`+${rules.farmingPractices.INTEGRATED} pts`))).toBe(true);
    });
  });

  // 4. Missing fertilizer information tests
  describe("4. Missing Fertilizer Information", () => {
    it("should handle missing fertilizer data neutrally without invented assumptions", () => {
      const input = createBaseFarmInput({
        fertilizerCategory: null,
        organicFertilizerType: null,
        fertilizerUsage: "NOT_SPECIFIED",
      });

      const result = AssessmentEngine.evaluate(input);
      expect(result.gaps.some((g) => g.includes("Fertilizer management information is missing or unrecorded"))).toBe(true);
      expect(result.factors.some((f) => f.includes("incomplete evidence"))).toBe(true);
      expect(result.recommendations.some((r) => r.message.includes("Document fertilizer type and application records"))).toBe(true);
    });
  });

  // 5. Score determinism tests
  describe("5. Score Determinism Across Runs", () => {
    it("should produce strictly identical assessment outputs for repeated evaluations", () => {
      const input = createBaseFarmInput({
        fertilizerCategory: FertilizerCategory.ORGANIC,
        organicFertilizerType: OrganicFertilizerType.COMPOST,
      });

      const r1 = AssessmentEngine.evaluate(input);
      const r2 = AssessmentEngine.evaluate(input);
      const r3 = AssessmentEngine.evaluate(input);

      expect(r1.overallScore).toBe(r2.overallScore);
      expect(r2.overallScore).toBe(r3.overallScore);
      expect(r1.categories).toEqual(r2.categories);
      expect(r1.strengths).toEqual(r2.strengths);
      expect(r1.gaps).toEqual(r2.gaps);
      expect(r1.recommendations).toEqual(r2.recommendations);
    });
  });

  // 6. Recommendation generation tests
  describe("6. Dynamic Fertilizer Recommendation Generation", () => {
    it("should recommend organic nutrient sources when synthetic fertilizer is practiced", () => {
      const farm = createBaseFarmInput({
        fertilizerCategory: FertilizerCategory.SYNTHETIC,
      }).farm;

      const recs = RecommendationService.generate(
        { farmingPractices: 55, soilManagement: 50, irrigation: 60, cropHistory: 60, documentation: 20, evidenceQuality: 20 },
        farm,
        [],
        baseAudit
      );

      const fertRec = recs.find((r) =>
        r.message.includes("Consider documenting and, where agronomically appropriate, increasing the use of organic nutrient sources")
      );
      expect(fertRec).toBeDefined();
      expect(fertRec?.priority).toBe("HIGH");
    });

    it("should NOT recommend adopting organic fertilizer when organic is already practiced", () => {
      const farm = createBaseFarmInput({
        fertilizerCategory: FertilizerCategory.ORGANIC,
        organicFertilizerType: OrganicFertilizerType.VERMICOMPOST,
      }).farm;

      const recs = RecommendationService.generate(
        { farmingPractices: 85, soilManagement: 75, irrigation: 70, cropHistory: 70, documentation: 50, evidenceQuality: 50 },
        farm,
        [],
        baseAudit
      );

      const redundantRec = recs.find((r) => r.message.includes("increasing the use of organic nutrient sources"));
      expect(redundantRec).toBeUndefined();
    });

    it("should recognize integrated management as an existing practice without redundant conversion recommendations", () => {
      const farm = createBaseFarmInput({
        fertilizerCategory: FertilizerCategory.INTEGRATED,
      }).farm;

      const recs = RecommendationService.generate(
        { farmingPractices: 70, soilManagement: 65, irrigation: 65, cropHistory: 65, documentation: 30, evidenceQuality: 30 },
        farm,
        [],
        baseAudit
      );

      const inmRec = recs.find((r) => r.message.includes("integrated nutrient management practice"));
      expect(inmRec).toBeDefined();
      expect(inmRec?.priority).toBe("LOW");

      const syntheticRec = recs.find((r) => r.message.includes("increasing the use of organic nutrient sources"));
      expect(syntheticRec).toBeUndefined();
    });
  });

  // 7 & 8. Data Persistence and Recalculation Flow
  describe("7 & 8. Persistence & Recalculation Flow in PostgreSQL", () => {
    let testUserId: string;
    let createdFarmId: string;
    let firstAssessmentId: string;

    beforeAll(async () => {
      const email = `fert.test.${Date.now()}@agricred.test`;
      const reg = await AuthService.register({
        email,
        password: "Password#123",
        name: "Fertilizer Test Farmer",
        phone: "+91 91234 56789",
        state: "Jharkhand",
        district: "Ranchi",
        role: Role.FARMER,
      });
      testUserId = reg.user.id;
    });

    it("should persist farm with fertilizerCategory and organicFertilizerType in PostgreSQL", async () => {
      const farm = await FarmsService.createFarm(testUserId, {
        name: "Ranchi Regenerative Farm",
        areaAcres: 8.5,
        soilType: "Loam",
        irrigationMethod: "Drip",
        waterSource: "Pond",
        fertilizerCategory: FertilizerCategory.SYNTHETIC,
        fertilizerUsage: "Chemical NPK",
        pesticideUsage: "Chemical",
        tillageMethod: "Conventional Tillage",
        residueManagement: "Residue Removal",
        organicPractices: false,
      });

      createdFarmId = farm.id;
      expect(farm.fertilizerCategory).toBe(FertilizerCategory.SYNTHETIC);

      // Verify retrieval from DB
      const loaded = await FarmsService.getFarmById(createdFarmId, testUserId, Role.FARMER);
      expect(loaded.fertilizerCategory).toBe(FertilizerCategory.SYNTHETIC);
      expect(loaded.organicFertilizerType).toBeNull();
    });

    it("should execute assessment with SYNTHETIC fertilizer, update to ORGANIC, and recalculate with higher score", async () => {
      // Step A: Run initial assessment with SYNTHETIC
      const ass1 = await AssessmentsService.createAssessment(createdFarmId, testUserId, Role.FARMER);
      firstAssessmentId = ass1.id;
      const initialScore = ass1.overallScore;
      const initialPractices = ass1.categories.farmingPractices;

      expect(ass1.gaps.some((g) => g.includes("Current fertilizer management relies primarily on synthetic inputs"))).toBe(true);

      // Step B: Farmer updates farm practice to ORGANIC (Vermicompost)
      const updatedFarm = await FarmsService.updateFarm(createdFarmId, testUserId, Role.FARMER, {
        fertilizerCategory: FertilizerCategory.ORGANIC,
        organicFertilizerType: OrganicFertilizerType.VERMICOMPOST,
      });

      expect(updatedFarm.fertilizerCategory).toBe(FertilizerCategory.ORGANIC);
      expect(updatedFarm.organicFertilizerType).toBe(OrganicFertilizerType.VERMICOMPOST);

      // Step C: Farmer recalculates assessment
      const ass2 = await AssessmentsService.recalculateAssessment(firstAssessmentId, testUserId, Role.FARMER);

      expect(ass2.id).not.toBe(firstAssessmentId); // Brand new version
      expect(ass2.categories.farmingPractices).toBeGreaterThan(initialPractices);
      expect(ass2.overallScore).toBeGreaterThanOrEqual(initialScore);

      // Verify updated explainability
      expect(ass2.strengths.some((s) => s.includes("Organic nutrient management is being practiced"))).toBe(true);
      expect(ass2.strengths.some((s) => s.includes("Vermicompost"))).toBe(true);
      expect(ass2.gaps.some((g) => g.includes("relies primarily on synthetic inputs"))).toBe(false);

      // Step D: Verify assessment history reflects both versions
      const history = await AssessmentsService.getAssessmentsByFarmId(createdFarmId, testUserId, Role.FARMER);
      expect(history.length).toBe(2);
      expect(history[0].id).toBe(ass2.id); // Latest first
      expect(history[1].id).toBe(firstAssessmentId);
    });
  });
});
