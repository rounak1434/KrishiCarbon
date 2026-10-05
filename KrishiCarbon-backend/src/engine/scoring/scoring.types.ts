import type { DocumentType, DocumentStatus, FertilizerCategory, OrganicFertilizerType } from "@prisma/client";

export interface FarmAssessmentInput {
  farm: {
    id: string;
    name: string;
    areaAcres: number;
    soilType: string;
    irrigationMethod: string;
    waterSource: string;
    fertilizerUsage: string;
    fertilizerCategory?: FertilizerCategory | null;
    organicFertilizerType?: OrganicFertilizerType | null;
    pesticideUsage: string;
    tillageMethod: string;
    residueManagement: string;
    organicPractices: boolean;
  };
  crops: Array<{
    id: string;
    crop: string;
    season: string;
    year: number;
    yield: number;
  }>;
  documents: Array<{
    id: string;
    type: DocumentType;
    status: DocumentStatus;
    filename: string;
    fileSize: number;
  }>;
}

export type ReadinessClassification = "HIGH_READINESS" | "MODERATE_READINESS" | "NEEDS_IMPROVEMENT";

export interface CategoryBreakdown {
  farmingPractices: number;
  soilManagement: number;
  irrigation: number;
  cropHistory: number;
  documentation: number;
  evidenceQuality: number;
}

export interface AssessmentCalculationResult {
  engineVersion: string;
  overallScore: number;
  readinessLevel: ReadinessClassification;
  readinessLabel: string;
  categories: CategoryBreakdown;
  strengths: string[];
  gaps: string[];
  factors: string[];
  recommendations: Array<{
    category: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    message: string;
  }>;
  disclaimer: string;
}
