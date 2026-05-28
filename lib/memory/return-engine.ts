import { prisma } from "@/lib/prisma";

/**
 * Quiet Return Engine
 * 
 * 本来的には消えゆく断片が、
 * 少し違う静けさで、
 * また現れることを感知する。
 * 
 * ノスタルジアではなく、
 * 存在の非直線性を映す。
 */

export interface ReturningFragment {
  id: string;
  originalId: string;
  type: "tag" | "theme" | "reflection" | "temporal-echo";
  content: string;
  originalDate: Date;
  currentDate: Date;
  daysSinceFading: number;
  resurfaceContext: string; // What brought it back
  strength: number; // 0-1: how clearly does it return
  quietness: number; // 0-1: how gently it returned
}

export interface TemporalEcho {
  id: string;
  fragmentContent: string;
  firstAppearance: Date;
  lastAppearance: Date;
  gapDays: number;
  similarContent?: string; // What echoed it back
  echoIntensity: number; // 0-1
}

export interface CalmResurfacing {
  id: string;
  content: string;
  fadedAt: Date;
  resurfacedAt: Date;
  silenceLength: number; // Days of not appearing
  resurfaceAtmosphere: string;
}

/**
 * Detect fragments that have faded and are now resurfacing
 * in similar but subtly different contexts
 */
export async function detectReturningFragments(
  userId: string
): Promise<ReturningFragment[]> {
  try {
    const nowDate = new Date();
    const sixMonthsAgo = new Date(nowDate.getTime() - 180 * 24 * 60 * 60 * 1000);
    
    // Find tags that appeared in the past, faded, and are appearing again
    const pastItems = await prisma.contentItem.findMany({
      where: {
        userId,
        createdAt: { lte: sixMonthsAgo },
        memoryState: "active",
      },
      select: {
        id: true,
        createdAt: true,
        aiTags: true,
        title: true,
      },
      orderBy: { createdAt: "desc" },
      take: 300, // Large historical window
    });

    const recentItems = await prisma.contentItem.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(nowDate.getTime() - 30 * 24 * 60 * 60 * 1000) },
        memoryState: "active",
      },
      select: {
        id: true,
        createdAt: true,
        aiTags: true,
        title: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const returningFragments: ReturningFragment[] = [];

    // Filter items that have tags
    const pastItemsWithTags = pastItems.filter((item) => item.aiTags.length > 0);
    const recentItemsWithTags = recentItems.filter((item) => item.aiTags.length > 0);

    // Check for tag echoes: old tags reappearing after long silence
    const pastTags = new Map<string, Date>();
    pastItemsWithTags.forEach((item) => {
      item.aiTags.forEach((tag) => {
        if (!pastTags.has(tag) || pastTags.get(tag)! > item.createdAt) {
          pastTags.set(tag, item.createdAt);
        }
      });
    });

    const recentTags = new Set<string>();
    recentItemsWithTags.forEach((item) => {
      item.aiTags.forEach((tag) => {
        recentTags.add(tag);
      });
    });

    // Find tags that disappeared and returned
    recentTags.forEach((tag) => {
      const originalDate = pastTags.get(tag);
      if (originalDate) {
        const daysSince = Math.floor(
          (nowDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Only consider returns after significant silence (60+ days gap)
        if (daysSince > 60) {
          returningFragments.push({
            id: `return-tag-${tag}-${nowDate.getTime()}`,
            originalId: tag,
            type: "tag",
            content: tag,
            originalDate,
            currentDate: nowDate,
            daysSinceFading: daysSince,
            resurfaceContext: `「${tag}」という言葉が、${daysSince}日ぶりに静かに戻っています。`,
            strength: Math.min(1, 0.4 + Math.random() * 0.4), // 0.4-0.8
            quietness: Math.max(0.6, 1 - daysSince / 360), // Older = quieter
          });
        }
      }
    });

    return returningFragments.slice(0, 8); // Limit to avoid overwhelming
  } catch (error) {
    console.error("Failed to detect returning fragments:", error);
    return [];
  }
}

/**
 * Detect temporal echoes: similar content appearing at similar times
 * but in different contexts, creating a subtle sense of recurrence
 */
export async function detectTemporalEchoes(
  userId: string
): Promise<TemporalEcho[]> {
  try {
    const nowDate = new Date();
    const oneYearAgo = new Date(nowDate.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    const allItems = await prisma.contentItem.findMany({
      where: {
        userId,
        createdAt: { gte: oneYearAgo },
        memoryState: "active",
      },
      select: {
        id: true,
        createdAt: true,
        aiTags: true,
        title: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const echoes: TemporalEcho[] = [];
    
    // Check for seasonal/temporal patterns
    // Find items that have similar tags but are separated by long gaps
    for (let i = 0; i < allItems.length; i++) {
      for (let j = i + 1; j < allItems.length; j++) {
        const item1 = allItems[i];
        const item2 = allItems[j];

        // Count shared tags
        const tags1 = new Set(item1.aiTags);
        const shared = item2.aiTags.filter((tag) => tags1.has(tag));
        
        if (shared.length > 0) {
          const gapDays = Math.floor(
            (item2.createdAt.getTime() - item1.createdAt.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          // Meaningful gap: 60-300 days (2-10 months)
          if (gapDays > 60 && gapDays < 300) {
            echoes.push({
              id: `echo-${item1.id}-${item2.id}`,
              fragmentContent: shared.join(", "),
              firstAppearance: item1.createdAt,
              lastAppearance: item2.createdAt,
              gapDays,
              similarContent: `${shared.join("」と「")}`,
              echoIntensity: Math.min(1, shared.length / item1.aiTags.length),
            });
          }
        }
      }
    }

    return echoes.slice(0, 5); // Limit to most meaningful echoes
  } catch (error) {
    console.error("Failed to detect temporal echoes:", error);
    return [];
  }
}

/**
 * Detect calm resurfacing: fragments that have been absent
 * and are now appearing again with a sense of quiet return
 */
export async function detectCalmResurfacing(
  userId: string
): Promise<CalmResurfacing[]> {
  try {
    const nowDate = new Date();
    const ninetyDaysAgo = new Date(nowDate.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(nowDate.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    // Find items from past that have now reappeared
    const pastItems = await prisma.contentItem.findMany({
      where: {
        userId,
        createdAt: { gte: oneYearAgo, lte: ninetyDaysAgo },
        memoryState: "active",
      },
      select: {
        id: true,
        createdAt: true,
        aiTags: true,
        title: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const recentItems = await prisma.contentItem.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(nowDate.getTime() - 30 * 24 * 60 * 60 * 1000) },
        memoryState: "active",
      },
      select: {
        id: true,
        createdAt: true,
        aiTags: true,
        title: true,
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    const resurfacings: CalmResurfacing[] = [];
    const pastThemes = new Map<string, Date>();

    // Build map of past themes
    pastItems.forEach((item) => {
      item.aiTags.forEach((tag) => {
        const existing = pastThemes.get(tag);
        if (!existing || existing < item.createdAt) {
          pastThemes.set(tag, item.createdAt);
        }
      });
    });

    // Find themes that have now reappeared
    const now = new Date();
    recentItems.forEach((item) => {
      item.aiTags.forEach((tag) => {
        const fadedDate = pastThemes.get(tag);
        if (fadedDate) {
          const silenceLength = Math.floor(
            (now.getTime() - fadedDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (silenceLength > 60) {
            resurfacings.push({
              id: `resurfacing-${tag}-${now.getTime()}`,
              content: tag,
              fadedAt: fadedDate,
              resurfacedAt: now,
              silenceLength,
              resurfaceAtmosphere: `長い沈黙のあと、「${tag}」が静かに戻っています。`,
            });
          }
        }
      });
    });

    return resurfacings.slice(0, 6);
  } catch (error) {
    console.error("Failed to detect calm resurfacing:", error);
    return [];
  }
}

/**
 * Generate a narrative about the return
 * Not "remembering" but "noticing quiet return"
 */
export function generateReturnNarrative(fragment: ReturningFragment): string {
  const narratives = [
    `「${fragment.content}」は、${Math.floor(fragment.daysSinceFading / 30)}ヶ月の沈黙のあと、少し違う静けさで戻っています。`,
    `かつて${fragment.originalDate.toLocaleDateString("ja-JP")}に現れた「${fragment.content}」が、遠い場所から静かに響いています。`,
    `薄れていた「${fragment.content}」が、別の時間に静かに浮かび上がってきました。`,
    `「${fragment.content}」という断片は、存在の中で消えず、ただ静かに眠っていたようです。`,
    `以前の「${fragment.content}」と、いま現れた「${fragment.content}」は、違う顔をしています。`,
  ];

  return narratives[Math.floor(Math.random() * narratives.length)];
}

/**
 * Generate calm narrative for resurfacing
 */
export function generateResurfacingNarrative(resurfacing: CalmResurfacing): string {
  const months = Math.floor(resurfacing.silenceLength / 30);
  
  const narratives = [
    `${months}ヶ月の沈黙のあと、「${resurfacing.content}」が静かに戻ってきました。`,
    `長い空白を越えて、「${resurfacing.content}」という言葉がまた静かに現れています。`,
    `「${resurfacing.content}」は消えていたのではなく、ただ静かに眠っていたようです。`,
    `遠い時間から、「${resurfacing.content}」が別の静けさで戻っています。`,
  ];

  return narratives[Math.floor(Math.random() * narratives.length)];
}

/**
 * Check if fragment is worth displaying (strength and quietness threshold)
 */
export function isSignificantReturn(fragment: ReturningFragment): boolean {
  return fragment.strength > 0.5 && fragment.quietness > 0.4;
}
