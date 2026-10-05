import { Role, AssessmentStatus, RecommendationPriority } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { NotFoundError, ForbiddenError } from "../../utils/errors.util.js";
import { createAuditLog } from "../../utils/audit.util.js";
import { FarmsService } from "../farms/farms.service.js";
import { AssessmentEngine } from "../../engine/scoring/assessment.engine.js";
import { SCORING_CONFIG } from "../../engine/scoring/scoring.config.js";
import type { FarmAssessmentInput, CategoryBreakdown } from "../../engine/scoring/scoring.types.js";

export class AssessmentsService {
  /**
   * Helper to format assessment data into clean, frontend-friendly response
   */
  private static formatAssessmentResponse(assessment: {
    id: string;
    farmId: string;
    overallScore: number;
    readinessLevel: string;
    status: AssessmentStatus;
    engineVersion: string;
    summary: unknown;
    createdAt: Date;
    categoryScores: Array<{ category: string; score: number; weight: number }>;
    recommendations: Array<{
      id: string;
      category: string;
      priority: RecommendationPriority;
      message: string;
      completed: boolean;
      createdAt: Date;
    }>;
  }) {
    const summaryData = (assessment.summary as {
      strengths?: string[];
      gaps?: string[];
      factors?: string[];
      readinessLabel?: string;
      disclaimer?: string;
    }) || {};

    const categoriesMap: Record<string, number> = {};
    for (const cs of assessment.categoryScores) {
      categoriesMap[cs.category] = cs.score;
    }

    const categories: CategoryBreakdown = {
      farmingPractices: categoriesMap["farmingPractices"] ?? 0,
      soilManagement: categoriesMap["soilManagement"] ?? 0,
      irrigation: categoriesMap["irrigation"] ?? 0,
      cropHistory: categoriesMap["cropHistory"] ?? 0,
      documentation: categoriesMap["documentation"] ?? 0,
      evidenceQuality: categoriesMap["evidenceQuality"] ?? 0,
    };

    return {
      id: assessment.id,
      farmId: assessment.farmId,
      overallScore: assessment.overallScore,
      status: assessment.readinessLevel,
      readinessLevel: assessment.readinessLevel,
      readinessLabel: summaryData.readinessLabel || assessment.readinessLevel.replace(/_/g, " "),
      engineVersion: assessment.engineVersion,
      categories,
      strengths: summaryData.strengths || [],
      gaps: summaryData.gaps || [],
      factors: summaryData.factors || [],
      recommendations: assessment.recommendations.map((rec) => ({
        id: rec.id,
        category: rec.category,
        priority: rec.priority,
        message: rec.message,
        completed: rec.completed,
        createdAt: rec.createdAt,
      })),
      farm: (assessment as any).farm
        ? {
            id: (assessment as any).farm.id,
            name: (assessment as any).farm.name,
            areaAcres: (assessment as any).farm.areaAcres,
            soilType: (assessment as any).farm.soilType,
            fertilizerUsage: (assessment as any).farm.fertilizerUsage,
            fertilizerCategory: (assessment as any).farm.fertilizerCategory,
            organicFertilizerType: (assessment as any).farm.organicFertilizerType,
            tillageMethod: (assessment as any).farm.tillageMethod,
            residueManagement: (assessment as any).farm.residueManagement,
            irrigationMethod: (assessment as any).farm.irrigationMethod,
            waterSource: (assessment as any).farm.waterSource,
            organicPractices: (assessment as any).farm.organicPractices,
          }
        : undefined,
      disclaimer: summaryData.disclaimer || SCORING_CONFIG.disclaimer,
      createdAt: assessment.createdAt,
    };
  }

  public static async createAssessment(
    farmId: string,
    userId: string,
    role: Role,
    ipAddress?: string
  ) {
    // 1. Verify farm access
    await FarmsService.verifyFarmAccess(farmId, userId, role);

    // 2. Fetch farm, crops, and documents
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
    });

    if (!farm) {
      throw new NotFoundError(`Farm with ID ${farmId} was not found`);
    }

    const crops = await prisma.cropHistory.findMany({
      where: { farmId },
      orderBy: { year: "desc" },
    });

    const documents = await prisma.document.findMany({
      where: { farmId },
      select: {
        id: true,
        type: true,
        status: true,
        filename: true,
        fileSize: true,
      },
    });

    // 3. Prepare structured input for scoring engine
    const engineInput: FarmAssessmentInput = {
      farm: {
        id: farm.id,
        name: farm.name,
        areaAcres: farm.areaAcres,
        soilType: farm.soilType,
        irrigationMethod: farm.irrigationMethod,
        waterSource: farm.waterSource,
        fertilizerUsage: farm.fertilizerUsage,
        fertilizerCategory: farm.fertilizerCategory,
        organicFertilizerType: farm.organicFertilizerType,
        pesticideUsage: farm.pesticideUsage,
        tillageMethod: farm.tillageMethod,
        residueManagement: farm.residueManagement,
        organicPractices: farm.organicPractices,
      },
      crops: crops.map((c) => ({
        id: c.id,
        crop: c.crop,
        season: c.season,
        year: c.year,
        yield: c.yield,
      })),
      documents,
    };

    // 4. Calculate deterministic scores, gaps, and recommendations
    const calcResult = AssessmentEngine.evaluate(engineInput);

    // 5. Store atomically in database transaction
    const savedAssessment = await prisma.$transaction(async (tx) => {
      const assessment = await tx.assessment.create({
        data: {
          farmId,
          overallScore: calcResult.overallScore,
          readinessLevel: calcResult.readinessLevel,
          status: AssessmentStatus.COMPLETED,
          engineVersion: calcResult.engineVersion,
          summary: {
            readinessLabel: calcResult.readinessLabel,
            strengths: calcResult.strengths,
            gaps: calcResult.gaps,
            factors: calcResult.factors,
            disclaimer: calcResult.disclaimer,
          },
        },
      });

      // Insert category scores
      const categoryData = Object.entries(calcResult.categories).map(([category, score]) => ({
        assessmentId: assessment.id,
        category,
        score,
        weight: SCORING_CONFIG.weights[category as keyof typeof SCORING_CONFIG.weights] || 1.0,
      }));

      await tx.assessmentCategoryScore.createMany({
        data: categoryData,
      });

      // Insert recommendations
      if (calcResult.recommendations.length > 0) {
        await tx.recommendation.createMany({
          data: calcResult.recommendations.map((rec) => ({
            assessmentId: assessment.id,
            category: rec.category,
            priority: rec.priority as RecommendationPriority,
            message: rec.message,
            completed: false,
          })),
        });
      }

      return tx.assessment.findUniqueOrThrow({
        where: { id: assessment.id },
        include: {
          categoryScores: true,
          recommendations: true,
          farm: true,
        },
      });
    });

    await createAuditLog({
      userId,
      action: "ASSESSMENT_CREATE",
      entityType: "Assessment",
      entityId: savedAssessment.id,
      details: {
        farmId,
        overallScore: savedAssessment.overallScore,
        readinessLevel: savedAssessment.readinessLevel,
        engineVersion: savedAssessment.engineVersion,
      },
      ipAddress,
    });

    return this.formatAssessmentResponse(savedAssessment);
  }

  public static async getAssessmentById(id: string, userId: string, role: Role) {
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        farm: {
          include: { farmer: true },
        },
        categoryScores: true,
        recommendations: {
          orderBy: [{ completed: "asc" }, { priority: "asc" }],
        },
      },
    });

    if (!assessment) {
      throw new NotFoundError(`Assessment with ID ${id} not found`);
    }

    if (role !== Role.ADMIN && assessment.farm.farmer.userId !== userId) {
      throw new ForbiddenError("You do not have permission to view this assessment");
    }

    return this.formatAssessmentResponse(assessment);
  }

  public static async recalculateAssessment(
    id: string,
    userId: string,
    role: Role,
    ipAddress?: string
  ) {
    const existing = await prisma.assessment.findUnique({
      where: { id },
      include: {
        farm: {
          include: { farmer: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError(`Assessment with ID ${id} not found`);
    }

    if (role !== Role.ADMIN && existing.farm.farmer.userId !== userId) {
      throw new ForbiddenError("You do not have permission to recalculate this assessment");
    }

    // Creates a NEW assessment record rather than overwriting historical result
    const newAssessment = await this.createAssessment(existing.farmId, userId, role, ipAddress);

    await createAuditLog({
      userId,
      action: "ASSESSMENT_RECALCULATE",
      entityType: "Assessment",
      entityId: newAssessment.id,
      details: {
        previousAssessmentId: id,
        previousScore: existing.overallScore,
        newScore: newAssessment.overallScore,
        farmId: existing.farmId,
      },
      ipAddress,
    });

    return newAssessment;
  }

  public static async getAssessmentsByFarmId(farmId: string, userId: string, role: Role) {
    await FarmsService.verifyFarmAccess(farmId, userId, role);

    const assessments = await prisma.assessment.findMany({
      where: { farmId },
      include: {
        categoryScores: true,
        recommendations: true,
        farm: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return assessments.map((a) => this.formatAssessmentResponse(a));
  }

  public static async toggleRecommendation(id: string, userId: string, role: Role) {
    const rec = await prisma.recommendation.findUnique({
      where: { id },
      include: {
        assessment: {
          include: {
            farm: {
              include: { farmer: true },
            },
          },
        },
      },
    });

    if (!rec) {
      throw new NotFoundError(`Recommendation with ID ${id} not found`);
    }

    if (role !== Role.ADMIN && rec.assessment.farm.farmer.userId !== userId) {
      throw new ForbiddenError("You do not have permission to modify this recommendation");
    }

    const updated = await prisma.recommendation.update({
      where: { id },
      data: {
        completed: !rec.completed,
      },
    });

    await createAuditLog({
      userId,
      action: "RECOMMENDATION_TOGGLE",
      entityType: "Recommendation",
      entityId: id,
      details: { completed: updated.completed },
    });

    return updated;
  }
}
