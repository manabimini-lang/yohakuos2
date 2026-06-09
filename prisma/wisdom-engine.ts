import { ReflectionTheme, SnapshotStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateCollectiveWisdom } from "@/lib/community/collective-wisdom";

export interface CollectiveWisdomContext {
  philosophyPatternId: string
  dominantTheme: ReflectionTheme
  trendDirection: number
  restorationScore: number
  growthScore: number
  connectionScore: number
}

/**
 * D-3 Wisdom Insight Generation
 * Iterates over eligible users and creates their weekly insight.
 */
export async function processWisdomInsightQueue() {
  const latestSnapshot = await prisma.communityReflectionSnapshot.findFirst({
    where: { status: SnapshotStatus.GENERATED },
    orderBy: { periodEnd: "desc" }
  });

  if (!latestSnapshot || latestSnapshot.momentCount < 10) {
    console.log("[WISDOM_ENGINE] Conditions not met (Moments < 10 or no snapshot)");
    return;
  }

  // Eligible users: active in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const users = await prisma.user.findMany({
    where: { updatedAt: { gte: sevenDaysAgo } },
    select: { id: true }
  });

  console.log(`[WISDOM_ENGINE] Generating insights for ${users.length} active users`);

  for (const user of users) {
    try {
      await generateCollectiveWisdom(user.id);
    } catch (e) {
      console.error(`[WISDOM_ENGINE_USER_ERROR] User ID: ${user.id}`, e);
    }
  }
}
