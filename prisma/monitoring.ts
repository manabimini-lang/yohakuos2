import { prisma } from "@/lib/prisma";
import { ShareStatus, WisdomInsightType } from "@prisma/client";

export async function getCommunityHealthMetrics() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const [total, successCount, failedCount, types, recentCount, moments, inspired, topMoments] = await Promise.all([
    prisma.communityShare.count(),
    prisma.communityShare.count({ where: { status: 'POSTED' } }),
    prisma.communityShare.count({ where: { status: 'FAILED' } }),
    prisma.communityShare.groupBy({ by: ['type'], _count: true }),
    prisma.communityShare.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.communityMoment.count(),
    prisma.communityInspiredEvent.count(),
    prisma.communityMoment.findMany({
      where: { isVisible: true },
      orderBy: { inspiredCount: 'desc' },
      take: 5,
      select: { content: true, inspiredCount: true }
    }),
    prisma.wisdomInsight.count(),
    prisma.wisdomInsight.groupBy({
      by: ['insightType'],
      _count: true
    })
  ]);

  const successRate = total > 0 ? (successCount / total) * 100 : 0;
  const totalJobs = await prisma.shareJob.count();
  const completedJobs = await prisma.shareJob.count({ where: { status: ShareStatus.COMPLETED } });

  const alignmentCount = insightsGroup.find(g => g.insightType === WisdomInsightType.ALIGNMENT)?._count || 0;
  const alignmentRate = insightsCount > 0 ? `${((alignmentCount / insightsCount) * 100).toFixed(1)}%` : "0%";

  return {
    totalShares: total,
    discordSuccessRate: totalJobs > 0 ? `${((completedJobs / totalJobs) * 100).toFixed(1)}%` : "0%",
    typeDistribution: types.map(t => ({ type: t.type, count: t._count })),
    shareFailures7d: failedCount,
    last7DaysShares: recentCount,
    totalMoments: moments,
    totalInspiredEvents: inspired,
    topMoments: topMoments,
    retryRate: totalJobs > 0 ? (await prisma.shareJob.aggregate({ _sum: { retryCount: true } }))._sum.retryCount : 0,
    totalWisdomInsights: insightsCount,
    insightDistribution: insightsGroup.map(g => ({ type: g.insightType, count: g._count })),
    alignmentRate
  };
}