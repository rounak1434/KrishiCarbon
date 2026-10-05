export const SCORING_CONFIG = {
  engineVersion: "1.1.0",
  disclaimer:
    "This assessment estimates preparedness based on the factors configured in our prototype assessment model and is not an official carbon-credit certification.",

  // Category Weights (must sum to 1.0)
  weights: {
    farmingPractices: 0.25,
    soilManagement: 0.20,
    irrigation: 0.15,
    cropHistory: 0.15,
    documentation: 0.15,
    evidenceQuality: 0.10,
  },

  // Classification Thresholds
  thresholds: {
    high: 75,      // >= 75: HIGH_READINESS
    moderate: 50,  // 50 - 74: MODERATE_READINESS
    // < 50: NEEDS_IMPROVEMENT
  },

  labels: {
    HIGH_READINESS: "High Readiness",
    MODERATE_READINESS: "Moderate Readiness",
    NEEDS_IMPROVEMENT: "Needs Improvement",
  },

  // Centralized Fertilizer Scoring Rules
  fertilizerRules: {
    // Points added to Farming Practices category
    farmingPractices: {
      ORGANIC: 20,
      INTEGRATED: 10,
      SYNTHETIC: 0,           // Non-excessive synthetic is neutral baseline
      EXCESSIVE_PENALTY: -15, // Penalty if heavy/excessive synthetic dependence indicated
      MISSING: 0,             // Incomplete/missing data is neutral (no invented assumption)
    },
    // Organic type-specific bonuses in Farming Practices (0 to 5 points)
    organicTypeBonuses: {
      VERMICOMPOST: 5,
      BIOFERTILIZER: 4,
      GREEN_MANURE: 4,
      COMPOST: 3,
      FARMYARD_MANURE: 2,
      OTHER: 2,
    } as Record<string, number>,
    // Points contributed to Soil Management category (for organic carbon buildup)
    soilManagement: {
      ORGANIC: 10,
      INTEGRATED: 5,
      SYNTHETIC: 0,
      MISSING: 0,
    },
  },
};
