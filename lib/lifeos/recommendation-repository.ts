import { prisma } from "@/lib/prisma";
import { LifeArea, RecommendationStatus, DifficultyLevel, RecommendationStrategy } from "@prisma/client";

export class RecommendedQuietPlanRepository {
  static async createMany(userId: string, recommendations: any[]) {
    return await prisma.recommendedQuietPlan.createMany({
      data: recommendations.map(r => ({
        userId,
        area: r.area,
        title: r.title,
        reason: r.reason,
        expectedImpact: r.expectedImpact,
        strategy: r.strategy || RecommendationStrategy.SMALL_WIN, // Default strategy
        reasoning: r.reasoning || "AIの一般的な推薦",
        difficultyLevel: r.difficultyLevel || DifficultyLevel.MEDIUM, // Default to MEDIUM
        status: RecommendationStatus.PENDING,
      })),
    });
  }

  static async findPending(userId: string) {
    return await prisma.recommendedQuietPlan.findMany({
      where: { userId, status: RecommendationStatus.PENDING },
      orderBy: { createdAt: "desc" },
    });
  }

  static async updateStatus(id: string, status: RecommendationStatus) {
    const now = new Date();
    return await prisma.recommendedQuietPlan.update({
      where: { id },
      data: {
        status,
        acceptedAt: status === RecommendationStatus.ACCEPTED ? now : undefined,
        dismissedAt: status === RecommendationStatus.DISMISSED ? now : undefined,
      },
    });
  }

  static async expireOldRecommendations(userId: string) {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    return await prisma.recommendedQuietPlan.updateMany({
      where: {
        userId,
        status: RecommendationStatus.PENDING,
        createdAt: { lt: threeDaysAgo },
      },
      data: { status: RecommendationStatus.EXPIRED },
    });
  }

  static async getAnalytics(userId: string) {
    const stats = await prisma.recommendedQuietPlan.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    });
    return stats;
  }
}