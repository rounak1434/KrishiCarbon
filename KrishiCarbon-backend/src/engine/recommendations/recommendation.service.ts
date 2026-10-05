import type { CategoryBreakdown, FarmAssessmentInput } from "../scoring/scoring.types.js";
import type { EvidenceAuditSummary } from "../evidence/evidence.types.js";
import { DocumentType } from "@prisma/client";

export interface GeneratedRecommendation {
  category: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  message: string;
}

export class RecommendationService {
  /**
   * Generates tailored recommendations based on category gaps, farm practices, and documentation.
   */
  public static generate(
    categories: CategoryBreakdown,
    farm: FarmAssessmentInput["farm"],
    crops: FarmAssessmentInput["crops"],
    audit: EvidenceAuditSummary
  ): GeneratedRecommendation[] {
    const list: GeneratedRecommendation[] = [];

    // 1. Irrigation
    if (categories.irrigation < 50) {
      list.push({
        category: "Irrigation",
        priority: "HIGH",
        message:
          "Upgrade from flood irrigation to drip or sprinkler micro-irrigation to cut water waste, minimize nutrient leaching, and qualify for water-conservation carbon credits.",
      });
    } else if (categories.irrigation < 75) {
      list.push({
        category: "Irrigation",
        priority: "MEDIUM",
        message:
          "Implement structured water-usage logs and maintain pump operational records to substantiate irrigation efficiency claims during MRV audits.",
      });
    }

    // 2. Farming Practices
    const residueUpper = farm.residueManagement.toUpperCase();
    if (residueUpper.includes("BURNING") || residueUpper.includes("BURN")) {
      list.push({
        category: "Farming Practices",
        priority: "HIGH",
        message:
          "Immediately cease crop residue burning; adopt in-situ mulching with happy seeders or convert biomass into biochar to stop carbon loss and emissions penalties.",
      });
    }

    const tillageUpper = farm.tillageMethod.toUpperCase();
    if (tillageUpper.includes("CONVENTIONAL") || tillageUpper.includes("DEEP")) {
      list.push({
        category: "Farming Practices",
        priority: "HIGH",
        message:
          "Transition towards zero or minimum conservation tillage to stabilize soil aggregates and prevent rapid oxidation of soil organic carbon.",
      });
    }

    // Dynamic Fertilizer Management Recommendations
    const fertCat = farm.fertilizerCategory;
    const fertUsageUpper = (farm.fertilizerUsage || "").toUpperCase();

    const isOrganic =
      fertCat === "ORGANIC" ||
      (!fertCat && (fertUsageUpper.includes("ORGANIC") || fertUsageUpper.includes("BIO") || fertUsageUpper.includes("VERMICOMPOST")));

    const isIntegrated =
      fertCat === "INTEGRATED" ||
      (!fertCat && (fertUsageUpper.includes("INTEGRATED") || fertUsageUpper.includes("BALANCED") || fertUsageUpper.includes("IPM")));

    const isMissing =
      !fertCat &&
      (!farm.fertilizerUsage || fertUsageUpper === "UNSPECIFIED" || fertUsageUpper === "NOT_SPECIFIED" || fertUsageUpper.trim() === "");

    const isSynthetic = fertCat === "SYNTHETIC" || (!isOrganic && !isIntegrated && !isMissing);

    if (isMissing) {
      list.push({
        category: "Farming Practices",
        priority: "HIGH",
        message:
          "Document fertilizer type and application records to establish an agricultural input baseline for verification.",
      });
    } else if (isSynthetic) {
      list.push({
        category: "Farming Practices",
        priority: "HIGH",
        message:
          "Consider documenting and, where agronomically appropriate, increasing the use of organic nutrient sources such as compost, farmyard manure, vermicompost, or biofertilizers.",
      });
    } else if (isIntegrated) {
      list.push({
        category: "Farming Practices",
        priority: "LOW",
        message:
          "Maintain detailed input purchase receipts and application logs for your integrated nutrient management practice to substantiate reduced chemical dependence during MRV audits.",
      });
    }

    if (categories.farmingPractices < 50 && !residueUpper.includes("BURNING") && !tillageUpper.includes("CONVENTIONAL") && !isOrganic && !isIntegrated) {
      list.push({
        category: "Farming Practices",
        priority: "HIGH",
        message:
          "Adopt integrated nutrient management by replacing a portion of synthetic chemical fertilizers with certified biofertilizers and compost.",
      });
    }

    // 3. Soil Management
    const hasSoilReport = audit.items.some((i) => i.documentType === DocumentType.SOIL_REPORT && i.status === "VERIFIED");
    if (!hasSoilReport) {
      list.push({
        category: "Soil Management",
        priority: "HIGH",
        message:
          "Commission a certified laboratory soil test to measure baseline Soil Organic Carbon (SOC), pH, and bulk density required for carbon credit baseline verification.",
      });
    } else if (categories.soilManagement < 75) {
      list.push({
        category: "Soil Management",
        priority: "MEDIUM",
        message:
          "Introduce off-season green manure cover crops (e.g., sesbania/sunn hemp) to accelerate organic matter incorporation and enhance soil microbial activity.",
      });
    }

    // 4. Crop History
    if (crops.length < 3) {
      list.push({
        category: "Crop History",
        priority: "MEDIUM",
        message:
          "Document at least 3 consecutive crop seasons with verifiable harvest yields to establish a reliable historical productivity baseline for verifiers.",
      });
    }

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

    if (!hasLegumes && crops.length > 0) {
      list.push({
        category: "Crop History",
        priority: "MEDIUM",
        message:
          "Incorporate a leguminous pulse crop in your rotation cycle to enhance biological nitrogen fixation and reduce reliance on synthetic nitrogen.",
      });
    }

    // 5. Documentation
    if (categories.documentation < 50) {
      list.push({
        category: "Documentation",
        priority: "HIGH",
        message:
          "Upload foundational legal and operational records, particularly verified land ownership / tenancy documents and input purchase vouchers.",
      });
    } else if (audit.missingTypes.length > 0) {
      list.push({
        category: "Documentation",
        priority: "MEDIUM",
        message: `Upload remaining verification records: ${audit.missingTypes.map((t) => t.replace(/_/g, " ")).join(", ")}.`,
      });
    }

    // 6. Evidence Quality
    if (audit.qualityScore < 50) {
      list.push({
        category: "Evidence Quality",
        priority: "LOW",
        message:
          "Capture and upload geotagged photographs of on-farm sustainable practices (e.g. drip lines, mulch cover, organic composting pits) to elevate verification confidence.",
      });
    }

    return list;
  }
}
