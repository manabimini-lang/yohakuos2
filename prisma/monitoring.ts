import { WisdomInsightType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getCommunityHealthMetrics() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [snapshots, recentSnapshots, snapshotGroups, insightGroups, totalInsights] =
    await Promise.all([
      prisma.communityReflectionSnapshot.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          summary: true,
          inspiredCount: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.communityReflectionSnapshot.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.communityReflectionSnapshot.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.wisdomInsight.groupBy({
        by: ["insightType"],
        _count: true,
      }),
      prisma.wisdomInsight.count(),
    ]);

  const generatedSnapshots = snapshotGroups.find(
    (group) => group.status === "GENERATED"
  )?._count ?? 0;
  const failedSnapshots = snapshotGroups.find(
    (group) => group.status === "AI_FAILED"
  )?._count ?? 0;
  const totalSnapshots = snapshotGroups.reduce(
    (sum, group) => sum + group._count,
    0
  );
  const alignmentCount =
    insightGroups.find(
      (group) => group.insightType === WisdomInsightType.ALIGNMENT
    )?._count ?? 0;
  const alignmentRate =
    totalInsights > 0 ? `${((alignmentCount / totalInsights) * 100).toFixed(1)}%` : "0%";

  return {
    totalShares: totalSnapshots,
    discordSuccessRate:
      totalSnapshots > 0
        ? `${((generatedSnapshots / totalSnapshots) * 100).toFixed(1)}%`
        : "0%",
    typeDistribution: snapshotGroups.map((group) => ({
      type: group.status,
      count: group._count,
    })),
    shareFailures7d: failedSnapshots,
    last7DaysShares: recentSnapshots,
    totalMoments: snapshots.length,
    totalInspiredEvents: snapshots.reduce(
      (sum, snapshot) => sum + snapshot.inspiredCount,
      0
    ),
    topMoments: snapshots.map((snapshot) => ({
      content: snapshot.summary,
      inspiredCount: snapshot.inspiredCount,
    })),
    retryRate: 0,
    totalWisdomInsights: totalInsights,
    insightDistribution: insightGroups.map((group) => ({
      type: group.insightType,
      count: group._count,
    })),
    alignmentRate,
  };
}
