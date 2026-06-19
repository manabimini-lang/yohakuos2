/**
 * Determines whether an AudioReflection should be generated.
 * 
 * Reflection is a quiet practice—we generate it thoughtfully,
 * not on every save. Conditions ensure that the reflection
 * has sufficient context and meaning to draw from.
 */

import { prisma } from "@/lib/prisma";
import { CONTENT_ITEM_SAFE_SELECT } from "@/lib/content-item-safe-select";

interface ReflectionEligibilityOptions {
  contentItemId: string;
  userId: string;
  hasReflection: boolean;
}

export async function shouldGenerateReflection(
  options: ReflectionEligibilityOptions
): Promise<boolean> {
  const { userId, contentItemId, hasReflection } = options;

  // If user has reflection text, always eligible
  if (hasReflection) {
    console.log("[should-generate-reflection] Has user reflection");
    return true;
  }

  // Check content count in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentCount = await prisma.contentItem.count({
    where: {
      userId,
      createdAt: { gte: sevenDaysAgo },
    },
  });

  // Threshold: At least 3 items in past week suggests meaningful pattern
  if (recentCount >= 3) {
    console.log(
      `[should-generate-reflection] Recent content count: ${recentCount} >= 3`
    );
    return true;
  }

  // Starter journey allowance: one older item plus no reflection yet
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const oldItem = await prisma.contentItem.findFirst({
    where: {
      userId,
      createdAt: { lte: twoDaysAgo },
    },
    select: CONTENT_ITEM_SAFE_SELECT,
  });

  if (oldItem) {
    console.log("[should-generate-reflection] Old content item found, eligible after 2 days");
    return true;
  }

  // Check for thematic resonance: multiple items with same tag
  const contentItem = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    select: CONTENT_ITEM_SAFE_SELECT,
  });

  if (contentItem?.aiTags && contentItem.aiTags.length > 0) {
    // If current item has tags, check if other recent items share tags
    const tagMatches = await prisma.contentItem.count({
      where: {
        userId,
        id: { not: contentItemId },
        aiTags: {
          hasSome: contentItem.aiTags,
        },
        createdAt: { gte: sevenDaysAgo },
      },
    });

    if (tagMatches >= 2) {
      console.log(
        `[should-generate-reflection] Tag resonance detected: ${tagMatches} matching items`
      );
      return true;
    }
  }

  // Check throttle: no reflection generated in last 24 hours
  // This prevents reflection generation spam
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentReflection = await prisma.audioReflection.findFirst({
    where: {
      userId,
      createdAt: { gte: oneDayAgo },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentReflection) {
    console.log(
      "[should-generate-reflection] Reflection generated in last 24h, throttling"
    );
    return false;
  }

  // No conditions met
  console.log("[should-generate-reflection] No eligibility conditions met");
  return false;
}
