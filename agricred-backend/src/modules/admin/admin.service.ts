import { prisma } from "../../config/prisma.js";

export class AdminService {
  public static async getDashboardStats() {
    const [
      totalFarmers,
      totalFarms,
      totalAssessments,
      totalDocuments,
      scoreAggregates,
      highReadinessCount,
      moderateReadinessCount,
      needsImprovementCount,
      recentAssessments,
    ] = await Promise.all([
      prisma.farmer.count(),
      prisma.farm.count(),
      prisma.assessment.count(),
      prisma.document.count(),
      prisma.assessment.aggregate({
        _avg: { overallScore: true },
        _min: { overallScore: true },
        _max: { overallScore: true },
      }),
      prisma.assessment.count({ where: { readinessLevel: "HIGH_READINESS" } }),
      prisma.assessment.count({ where: { readinessLevel: "MODERATE_READINESS" } }),
      prisma.assessment.count({ where: { readinessLevel: "NEEDS_IMPROVEMENT" } }),
      prisma.assessment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          farm: {
            select: {
              name: true,
              farmer: { select: { name: true, state: true } },
            },
          },
        },
      }),
    ]);

    // Aggregate category averages
    const categoryScores = await prisma.assessmentCategoryScore.groupBy({
      by: ["category"],
      _avg: { score: true },
    });

    const categoryAverages: Record<string, number> = {};
    for (const c of categoryScores) {
      categoryAverages[c.category] = Math.round(c._avg.score || 0);
    }

    // Common gaps calculation from recent assessments
    const latestAssessments = await prisma.assessment.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      select: { summary: true },
    });

    const gapFrequency: Record<string, number> = {};
    for (const a of latestAssessments) {
      const summary = a.summary as { gaps?: string[] } | null;
      if (summary?.gaps) {
        for (const gap of summary.gaps) {
          gapFrequency[gap] = (gapFrequency[gap] || 0) + 1;
        }
      }
    }

    const mostCommonGaps = Object.entries(gapFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([gap, count]) => ({ gap, occurrences: count }));

    return {
      overview: {
        totalFarmers,
        totalFarms,
        totalAssessments,
        totalDocuments,
        averageReadinessScore: Math.round(scoreAggregates._avg.overallScore || 0),
        minScore: scoreAggregates._min.overallScore || 0,
        maxScore: scoreAggregates._max.overallScore || 0,
      },
      readinessDistribution: {
        highReadiness: highReadinessCount,
        moderateReadiness: moderateReadinessCount,
        needsImprovement: needsImprovementCount,
      },
      categoryAverages,
      mostCommonGaps,
      recentAssessments: recentAssessments.map((a) => ({
        id: a.id,
        farmName: a.farm.name,
        farmerName: a.farm.farmer.name,
        state: a.farm.farmer.state,
        overallScore: a.overallScore,
        readinessLevel: a.readinessLevel,
        createdAt: a.createdAt,
      })),
    };
  }

  public static async getFarmers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [total, farmers] = await Promise.all([
      prisma.farmer.count(),
      prisma.farmer.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { email: true, createdAt: true } },
          _count: { select: { farms: true } },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      farmers,
    };
  }

  public static async getFarms(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [total, farms] = await Promise.all([
      prisma.farm.count(),
      prisma.farm.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          farmer: { select: { id: true, name: true, phone: true, state: true, district: true } },
          assessments: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: {
              overallScore: true,
              readinessLevel: true,
              createdAt: true,
            },
          },
          _count: {
            select: { crops: true, documents: true, assessments: true },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      farms: farms.map((f) => ({
        ...f,
        latestAssessment: f.assessments[0] || null,
      })),
    };
  }

  public static async getAssessments(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [total, assessments] = await Promise.all([
      prisma.assessment.count(),
      prisma.assessment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          farm: {
            select: {
              id: true,
              name: true,
              areaAcres: true,
              farmer: {
                select: { name: true, phone: true, state: true, district: true },
              },
            },
          },
          categoryScores: true,
          recommendations: true,
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      assessments,
    };
  }

  public static async getStatistics() {
    // Practice adoption rates across all farms
    const totalFarms = await prisma.farm.count();

    const [organicCount, noTillCount, dripCount, mulchingCount] = await Promise.all([
      prisma.farm.count({ where: { organicPractices: true } }),
      prisma.farm.count({
        where: {
          OR: [
            { tillageMethod: { contains: "NO_TILL", mode: "insensitive" } },
            { tillageMethod: { contains: "ZERO", mode: "insensitive" } },
          ],
        },
      }),
      prisma.farm.count({
        where: {
          OR: [
            { irrigationMethod: { contains: "DRIP", mode: "insensitive" } },
            { irrigationMethod: { contains: "MICRO", mode: "insensitive" } },
          ],
        },
      }),
      prisma.farm.count({
        where: {
          OR: [
            { residueManagement: { contains: "MULCH", mode: "insensitive" } },
            { residueManagement: { contains: "RETENTION", mode: "insensitive" } },
            { residueManagement: { contains: "BIOCHAR", mode: "insensitive" } },
          ],
        },
      }),
    ]);

    // Document types breakdown
    const documentTypeStats = await prisma.document.groupBy({
      by: ["type"],
      _count: { id: true },
    });

    const documentStatusStats = await prisma.document.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    return {
      totalFarms,
      sustainablePracticeAdoption: {
        organicPracticesRate: totalFarms ? Math.round((organicCount / totalFarms) * 100) : 0,
        zeroTillageRate: totalFarms ? Math.round((noTillCount / totalFarms) * 100) : 0,
        microIrrigationRate: totalFarms ? Math.round((dripCount / totalFarms) * 100) : 0,
        residueRetentionRate: totalFarms ? Math.round((mulchingCount / totalFarms) * 100) : 0,
      },
      documentBreakdown: {
        byType: documentTypeStats.map((d) => ({ type: d.type, count: d._count.id })),
        byStatus: documentStatusStats.map((d) => ({ status: d.status, count: d._count.id })),
      },
    };
  }

  public static async getAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { email: true, role: true } },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      logs,
    };
  }
}
