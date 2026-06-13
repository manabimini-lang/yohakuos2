import { prisma } from "@/lib/prisma";
import type { ContextProfileViewModel } from "./view-models/context-profile";

// Weights for the scoring algorithm
const SAVE_WEIGHT = 3;
const VIEW_WEIGHT = 2;
const RELATED_WEIGHT = 5;

export type ContextTheme = {
  tag: string;
  score: number;
};

export type ContextProfile = {
  themes: ContextTheme[];
  generatedAt: Date;
};

export async function buildContextProfile(userId: string): Promise<ContextProfileViewModel | null> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch recent items
  const recentItems = await prisma.contentItem.findMany({
    where: {
      userId,
      createdAt: {
        gte: thirtyDaysAgo,
      },
      aiTags: {
        isEmpty: false, // Must have some tags
      },
    },
    select: {
      aiTags: true,
      metadata: true,
    },
  });

  if (recentItems.length === 0) {
    return null;
  }

  // Calculate scores for each tag
  const tagScores = new Map<string, number>();

  for (const item of recentItems) {
    if (!Array.isArray(item.aiTags)) continue;

    // Parse metadata to extract viewCount and relatedClicks safely
    let viewCount = 0;
    let relatedClicks = 0;
    
    if (item.metadata && typeof item.metadata === "object") {
      const meta = item.metadata as Record<string, any>;
      viewCount = typeof meta.viewCount === "number" ? meta.viewCount : 0;
      relatedClicks = typeof meta.relatedClicks === "number" ? meta.relatedClicks : 0;
    }

    const itemScore = SAVE_WEIGHT + (VIEW_WEIGHT * viewCount) + (RELATED_WEIGHT * relatedClicks);

    for (const tag of item.aiTags) {
      if (typeof tag !== "string") continue;
      const cleanTag = tag.replace(/^#/, ""); // strip # if present
      const currentScore = tagScores.get(cleanTag) || 0;
      tagScores.set(cleanTag, currentScore + itemScore);
    }
  }

  // Extract top 3 themes
  const sortedThemes: ContextTheme[] = Array.from(tagScores.entries())
    .map(([tag, score]) => ({ tag, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (sortedThemes.length === 0) {
    return null;
  }

  return {
    title: "最近のあなたのテーマ",
    description: "最近よく触れている余白です",
    themes: sortedThemes.map((t) => t.tag),
  };
}
