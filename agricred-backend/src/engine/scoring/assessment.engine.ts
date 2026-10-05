import { DocumentType, DocumentStatus } from "@prisma/client";
import { SCORING_CONFIG } from "./scoring.config.js";
import { EvidenceService } from "../evidence/evidence.service.js";
import { RecommendationService } from "../recommendations/recommendation.service.js";
import type {
  FarmAssessmentInput,
  AssessmentCalculationResult,
  CategoryBreakdown,
  ReadinessClassification,
} from "./scoring.types.js";

export class AssessmentEngine {
  /**
   * Deterministically calculates readiness assessment based on farm practices,
   * crop history, and document evidence.
   */
  public static evaluate(input: FarmAssessmentInput): AssessmentCalculationResult {
    const { farm, crops, documents } = input;

    // 1. Calculate Category Scores (0 - 100 each)
    const farmingPractices = this.calculateFarmingPracticesScore(farm);
    const soilManagement = this.calculateSoilManagementScore(farm, documents);
    const irrigation = this.calculateIrrigationScore(farm, documents);
    const cropHistory = this.calculateCropHistoryScore(crops);

    // Document & Evidence Quality via EvidenceService
    const evidenceAudit = EvidenceService.evaluateEvidence(documents);
    const documentation = this.calculateDocumentationScore(evidenceAudit);
    const evidenceQuality = evidenceAudit.qualityScore;

    const categories: CategoryBreakdown = {
      farmingPractices: Math.min(100, Math.max(0, Math.round(farmingPractices))),
      soilManagement: Math.min(100, Math.max(0, Math.round(soilManagement))),
      irrigation: Math.min(100, Math.max(0, Math.round(irrigation))),
      cropHistory: Math.min(100, Math.max(0, Math.round(cropHistory))),
      documentation: Math.min(100, Math.max(0, Math.round(documentation))),
      evidenceQuality: Math.min(100, Math.max(0, Math.round(evidenceQuality))),
    };

    // 2. Compute Weighted Overall Score
    const weights = SCORING_CONFIG.weights;
    const rawOverall =
      categories.farmingPractices * weights.farmingPractices +
      categories.soilManagement * weights.soilManagement +
      categories.irrigation * weights.irrigation +
      categories.cropHistory * weights.cropHistory +
      categories.documentation * weights.documentation +
      categories.evidenceQuality * weights.evidenceQuality;

    const overallScore = Math.min(100, Math.max(0, Math.round(rawOverall)));

    // 3. Classify Readiness Level
    let readinessLevel: ReadinessClassification;
    let readinessLabel: string;

    if (overallScore >= SCORING_CONFIG.thresholds.high) {
      readinessLevel = "HIGH_READINESS";
      readinessLabel = SCORING_CONFIG.labels.HIGH_READINESS;
    } else if (overallScore >= SCORING_CONFIG.thresholds.moderate) {
      readinessLevel = "MODERATE_READINESS";
      readinessLabel = SCORING_CONFIG.labels.MODERATE_READINESS;
    } else {
      readinessLevel = "NEEDS_IMPROVEMENT";
      readinessLabel = SCORING_CONFIG.labels.NEEDS_IMPROVEMENT;
    }

    // 4. Generate Explainability: Strengths, Gaps, Factors
    const strengths: string[] = [];
    const gaps: string[] = [];
    const factors: string[] = [];

    // Farming practices insights
    const normResidue = farm.residueManagement.toUpperCase();
    if (normResidue.includes("BURNING")) {
      gaps.push("Crop residue burning severely depletes soil carbon and generates greenhouse gas emissions");
      factors.push("Residue burning penalty (-40 pts to practices)");
    } else if (normResidue.includes("MULCH") || normResidue.includes("RETENTION") || normResidue.includes("BIOCHAR")) {
      strengths.push("In-situ residue retention/mulching retains organic biomass and builds soil organic matter");
      factors.push("Beneficial residue recycling (+25 pts)");
    }

    const normTillage = farm.tillageMethod.toUpperCase();
    if (normTillage.includes("NO_TILL") || normTillage.includes("ZERO")) {
      strengths.push("Zero/No-tillage practice prevents soil disturbance and preserves mycorrhizal fungal networks");
      factors.push("Conservation zero-tillage (+30 pts)");
    } else if (normTillage.includes("CONVENTIONAL") || normTillage.includes("DEEP")) {
      gaps.push("Conventional deep tillage oxidizes soil organic carbon and causes soil structure loss");
      factors.push("High tillage soil disturbance penalty");
    }

    if (farm.organicPractices) {
      strengths.push("Certified or demonstrated organic management reduces synthetic input emissions");
      factors.push("Organic practice adoption (+15 pts)");
    }

    // Fertilizer explainability
    const { category: fertCat, organicType: fertType, isExcessive: fertExcessive } = this.resolveFertilizerInfo(farm);
    const fertRules = SCORING_CONFIG.fertilizerRules;

    const formatOrganicTypeName = (type: string | null) => {
      if (!type) return "organic fertilizer";
      const names: Record<string, string> = {
        COMPOST: "Compost",
        FARMYARD_MANURE: "Farmyard Manure (FYM)",
        VERMICOMPOST: "Vermicompost",
        BIOFERTILIZER: "Biofertilizer",
        GREEN_MANURE: "Green Manure",
        OTHER: "Organic Fertilizer",
      };
      return names[type] || type.replace(/_/g, " ").toLowerCase();
    };

    if (fertCat === "ORGANIC") {
      const typeStr = fertType ? ` using ${formatOrganicTypeName(fertType)}` : "";
      strengths.push(`Organic nutrient management is being practiced${typeStr}, building soil organic carbon and avoiding synthetic chemical emissions`);
      const bonus = fertRules.farmingPractices.ORGANIC + (fertType && fertRules.organicTypeBonuses[fertType] ? fertRules.organicTypeBonuses[fertType] : 0);
      factors.push(`Organic fertilizer practice (+${bonus} pts to practices)`);
    } else if (fertCat === "INTEGRATED") {
      strengths.push("Integrated nutrient management is being practiced, balancing organic inputs with targeted synthetic supplementation");
      factors.push(`Integrated fertilizer management (+${fertRules.farmingPractices.INTEGRATED} pts to practices)`);
    } else if (fertCat === "SYNTHETIC") {
      if (fertExcessive) {
        gaps.push("Current fertilizer management relies heavily on excessive synthetic chemical inputs without adequate soil replenishment");
        factors.push(`Excessive synthetic fertilizer penalty (${fertRules.farmingPractices.EXCESSIVE_PENALTY} pts)`);
      } else {
        gaps.push("Current fertilizer management relies primarily on synthetic inputs");
        factors.push("Synthetic fertilizer practice (baseline)");
      }
    } else {
      gaps.push("Fertilizer management information is missing or unrecorded; documenting nutrient sources is required for carbon credit assessment");
      factors.push("Unrecorded fertilizer inputs (incomplete evidence)");
    }

    // Irrigation insights
    const normIrr = farm.irrigationMethod.toUpperCase();
    if (normIrr.includes("DRIP") || normIrr.includes("MICRO")) {
      strengths.push("Drip micro-irrigation optimizes water use efficiency and mitigates nitrous oxide volatilization");
      factors.push("High-efficiency micro-irrigation (+35 pts)");
    } else if (normIrr.includes("FLOOD")) {
      gaps.push("Flood irrigation causes excessive water runoff, nutrient leaching, and potential methane emissions");
      factors.push("Flood irrigation inefficiency penalty");
    }

    // Soil management & reports
    const hasSoilDoc = documents.some(
      (d) => d.type === DocumentType.SOIL_REPORT && d.status === DocumentStatus.VERIFIED
    );
    if (hasSoilDoc) {
      strengths.push("Verified laboratory soil test report available for baseline carbon and nutrient profiling");
      factors.push("Verified soil analysis report on file (+25 pts)");
    } else {
      gaps.push("Lack of certified laboratory soil test report for establishing soil organic carbon baseline");
      factors.push("Missing verified soil health report");
    }

    // Crop history insights
    if (crops.length >= 3) {
      strengths.push(`Documented multi-season crop history across ${crops.length} distinct crop cycles`);
    } else if (crops.length === 0) {
      gaps.push("No historical crop or yield records provided to demonstrate continuous land productivity");
    } else {
      gaps.push("Limited crop history; at least 3 distinct seasonal records are recommended for verification");
    }

    const hasLegumes = crops.some((c) => {
      const cropName = c.crop.toLowerCase();
      return (
        cropName.includes("pulse") ||
        cropName.includes("gram") ||
        cropName.includes("moong") ||
        cropName.includes("urad") ||
        cropName.includes("chickpea") ||
        cropName.includes("lentil") ||
        cropName.includes("soy") ||
        cropName.includes("bean") ||
        cropName.includes("pea")
      );
    });

    if (hasLegumes) {
      strengths.push("Crop rotation includes nitrogen-fixing leguminous species, lowering synthetic fertilizer demand");
      factors.push("Nitrogen-fixing leguminous crop rotation (+15 pts)");
    } else if (crops.length > 0) {
      gaps.push("Crop rotation lacks leguminous or green manuring crops to naturally replenish soil nitrogen");
    }

    // Documentation insights
    if (evidenceAudit.missingTypes.length > 0) {
      gaps.push(
        `Missing key documentary evidence: ${evidenceAudit.missingTypes.map((t) => t.replace(/_/g, " ")).join(", ")}`
      );
    }
    if (evidenceAudit.verifiedCount >= 3) {
      strengths.push(`Strong evidentiary audit trail with ${evidenceAudit.verifiedCount} verified supporting documents`);
    }

    // 5. Generate Prioritized Recommendations
    const recommendations = RecommendationService.generate(categories, farm, crops, evidenceAudit);

    return {
      engineVersion: SCORING_CONFIG.engineVersion,
      overallScore,
      readinessLevel,
      readinessLabel,
      categories,
      strengths,
      gaps,
      factors,
      recommendations,
      disclaimer: SCORING_CONFIG.disclaimer,
    };
  }

  // --- Sub-scoring Algorithms ---

  /**
   * Helper to resolve normalized fertilizer information
   */
  public static resolveFertilizerInfo(farm: FarmAssessmentInput["farm"]): {
    category: "ORGANIC" | "INTEGRATED" | "SYNTHETIC" | "MISSING";
    organicType: string | null;
    isExcessive: boolean;
  } {
    let category: "ORGANIC" | "INTEGRATED" | "SYNTHETIC" | "MISSING";
    let organicType: string | null = farm.organicFertilizerType || null;
    let isExcessive = false;

    const fertUsageUpper = (farm.fertilizerUsage || "").toUpperCase();

    if (farm.fertilizerCategory) {
      category = farm.fertilizerCategory;
      if (category === "SYNTHETIC" && (fertUsageUpper.includes("HEAVY") || fertUsageUpper.includes("EXCESSIVE"))) {
        isExcessive = true;
      }
    } else if (fertUsageUpper.includes("ORGANIC") || fertUsageUpper.includes("BIO") || fertUsageUpper.includes("VERMICOMPOST")) {
      category = "ORGANIC";
      if (!organicType) {
        if (fertUsageUpper.includes("VERMICOMPOST")) organicType = "VERMICOMPOST";
        else if (fertUsageUpper.includes("BIO")) organicType = "BIOFERTILIZER";
        else if (fertUsageUpper.includes("COMPOST")) organicType = "COMPOST";
        else if (fertUsageUpper.includes("MANURE") || fertUsageUpper.includes("FYM")) organicType = "FARMYARD_MANURE";
      }
    } else if (fertUsageUpper.includes("BALANCED") || fertUsageUpper.includes("INTEGRATED") || fertUsageUpper.includes("IPM")) {
      category = "INTEGRATED";
    } else if (fertUsageUpper.includes("HEAVY") || fertUsageUpper.includes("EXCESSIVE")) {
      category = "SYNTHETIC";
      isExcessive = true;
    } else if (fertUsageUpper.includes("CHEMICAL") || fertUsageUpper.includes("SYNTHETIC") || fertUsageUpper.includes("UREA") || fertUsageUpper.includes("DAP")) {
      category = "SYNTHETIC";
    } else if (!farm.fertilizerUsage || fertUsageUpper === "UNSPECIFIED" || fertUsageUpper === "NOT_SPECIFIED" || fertUsageUpper.trim() === "") {
      category = "MISSING";
    } else {
      category = "MISSING";
    }

    return { category, organicType, isExcessive };
  }

  private static calculateFarmingPracticesScore(farm: FarmAssessmentInput["farm"]): number {
    let score = 50; // base score

    // Tillage evaluation
    const tillage = farm.tillageMethod.toUpperCase();
    if (tillage.includes("NO_TILL") || tillage.includes("ZERO")) {
      score += 25;
    } else if (tillage.includes("REDUCED") || tillage.includes("MINIMUM")) {
      score += 15;
    } else if (tillage.includes("CONVENTIONAL") || tillage.includes("DEEP")) {
      score -= 15;
    }

    // Residue management evaluation
    const residue = farm.residueManagement.toUpperCase();
    if (residue.includes("BURNING") || residue.includes("BURN")) {
      score -= 30; // heavy penalty for burning
    } else if (residue.includes("MULCH") || residue.includes("RETENTION") || residue.includes("IN_SITU")) {
      score += 20;
    } else if (residue.includes("BIOCHAR") || residue.includes("COMPOST")) {
      score += 20;
    } else if (residue.includes("REMOVAL")) {
      score -= 5;
    }

    // Fertilizer usage evaluation using centralized SCORING_CONFIG rules
    const rules = SCORING_CONFIG.fertilizerRules;
    const { category, organicType, isExcessive } = this.resolveFertilizerInfo(farm);

    if (category === "ORGANIC") {
      score += rules.farmingPractices.ORGANIC;
      if (organicType && rules.organicTypeBonuses[organicType]) {
        score += rules.organicTypeBonuses[organicType];
      }
    } else if (category === "INTEGRATED") {
      score += rules.farmingPractices.INTEGRATED;
    } else if (category === "SYNTHETIC") {
      if (isExcessive) {
        score += rules.farmingPractices.EXCESSIVE_PENALTY;
      } else {
        score += rules.farmingPractices.SYNTHETIC;
      }
    } else {
      // MISSING
      score += rules.farmingPractices.MISSING;
    }

    // Pesticide usage evaluation
    const pest = farm.pesticideUsage.toUpperCase();
    if (pest.includes("BIO") || pest.includes("IPM") || pest.includes("NEEM") || pest.includes("NONE")) {
      score += 10;
    } else if (pest.includes("HEAVY") || pest.includes("PROPHYLACTIC")) {
      score -= 15;
    }

    // Organic practices flag
    if (farm.organicPractices) {
      score += 15;
    }

    return Math.min(100, Math.max(0, score));
  }

  private static calculateSoilManagementScore(
    farm: FarmAssessmentInput["farm"],
    documents: FarmAssessmentInput["documents"]
  ): number {
    let score = 45; // baseline

    // Soil type inherent potential
    const soil = farm.soilType.toUpperCase();
    if (soil.includes("BLACK") || soil.includes("CLAY") || soil.includes("LOAM")) {
      score += 15; // Higher carbon stabilization potential
    } else if (soil.includes("ALLUVIAL") || soil.includes("SILT")) {
      score += 10;
    } else if (soil.includes("SANDY")) {
      score += 5;
    }

    // Tillage & residue contribution to soil structure
    const tillage = farm.tillageMethod.toUpperCase();
    if (tillage.includes("NO_TILL") || tillage.includes("ZERO")) {
      score += 15;
    } else if (tillage.includes("REDUCED")) {
      score += 10;
    }

    const residue = farm.residueManagement.toUpperCase();
    if (residue.includes("MULCH") || residue.includes("RETENTION") || residue.includes("BIOCHAR")) {
      score += 15;
    }

    // Fertilizer contribution to Soil Organic Carbon buildup
    const rules = SCORING_CONFIG.fertilizerRules;
    const { category } = this.resolveFertilizerInfo(farm);
    if (category === "ORGANIC") {
      score += rules.soilManagement.ORGANIC;
    } else if (category === "INTEGRATED") {
      score += rules.soilManagement.INTEGRATED;
    }

    // Presence of verified soil health document
    const hasVerifiedSoilDoc = documents.some(
      (d) => d.type === DocumentType.SOIL_REPORT && d.status === DocumentStatus.VERIFIED
    );
    const hasUploadedSoilDoc = documents.some(
      (d) => d.type === DocumentType.SOIL_REPORT && d.status !== DocumentStatus.REJECTED
    );

    if (hasVerifiedSoilDoc) {
      score += 20;
    } else if (hasUploadedSoilDoc) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  private static calculateIrrigationScore(
    farm: FarmAssessmentInput["farm"],
    documents: FarmAssessmentInput["documents"]
  ): number {
    let score = 40; // baseline

    // Irrigation method
    const method = farm.irrigationMethod.toUpperCase();
    if (method.includes("DRIP") || method.includes("MICRO")) {
      score += 45;
    } else if (method.includes("SPRINKLER") || method.includes("PIVOT")) {
      score += 35;
    } else if (method.includes("AWD") || method.includes("ALTERNATE")) {
      score += 40;
    } else if (method.includes("FURROW")) {
      score += 15;
    } else if (method.includes("RAINFED") || method.includes("DRYLAND")) {
      score += 25;
    } else if (method.includes("FLOOD")) {
      score -= 10;
    }

    // Water source efficiency & sustainability
    const source = farm.waterSource.toUpperCase();
    if (source.includes("RAINWATER") || source.includes("POND") || source.includes("HARVEST")) {
      score += 15;
    } else if (source.includes("CANAL") || source.includes("RIVER")) {
      score += 10;
    } else if (source.includes("SOLAR")) {
      score += 10;
    }

    // Supporting irrigation log document
    const hasIrrigationDoc = documents.some(
      (d) => d.type === DocumentType.IRRIGATION_RECORD && d.status === DocumentStatus.VERIFIED
    );
    if (hasIrrigationDoc) {
      score += 15;
    }

    return Math.min(100, Math.max(0, score));
  }

  private static calculateCropHistoryScore(crops: FarmAssessmentInput["crops"]): number {
    if (crops.length === 0) {
      return 15; // insufficient historical data
    }

    let score = 30; // base for having at least 1 record

    // Number of recorded seasons/years
    if (crops.length >= 4) {
      score += 30;
    } else if (crops.length >= 2) {
      score += 20;
    } else {
      score += 10;
    }

    // Crop rotation & diversity
    const distinctCrops = new Set(crops.map((c) => c.crop.trim().toLowerCase())).size;
    if (distinctCrops >= 3) {
      score += 15;
    } else if (distinctCrops >= 2) {
      score += 10;
    }

    // Leguminous crop presence
    const hasLegumes = crops.some((c) => {
      const name = c.crop.toLowerCase();
      return (
        name.includes("pulse") ||
        name.includes("gram") ||
        name.includes("moong") ||
        name.includes("urad") ||
        name.includes("chickpea") ||
        name.includes("lentil") ||
        name.includes("soy") ||
        name.includes("bean") ||
        name.includes("pea")
      );
    });

    if (hasLegumes) {
      score += 15;
    }

    // Season diversity (Kharif, Rabi, Zaid)
    const distinctSeasons = new Set(crops.map((c) => c.season.trim().toLowerCase())).size;
    if (distinctSeasons >= 2) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  private static calculateDocumentationScore(audit: ReturnType<typeof EvidenceService.evaluateEvidence>): number {
    // Audit summary directly computes verified, pending, and total expected weights
    let score = 0;
    for (const item of audit.items) {
      if (item.status === "VERIFIED") {
        score += 20;
      } else if (item.status === "PENDING_REVIEW" || item.status === "UPLOADED") {
        score += 10;
      }
    }
    return Math.min(100, Math.max(0, score));
  }
}

