import { prisma } from "@/lib/prisma";
import { generatePhilosophyFragments } from "@/lib/memory/philosophy";
import { CONTENT_ITEM_SAFE_SELECT } from "@/lib/content-item-safe-select";

/**
 * Life OS Layer — Life Themes Extraction Engine
 * 
 * ユーザーの記録から、
 * 長期的な人生テーマを静かに抽出。
 * 
 * 「管理」ではなく、
 * 人生の輪郭を見つける。
 */

export interface LifeTheme {
  id: string;
  userId: string;
  name: string;
  description: string;
  firstAppeared: Date;
  lastAppeared: Date;
  frequency: number; // How many times this theme appeared
  strength: number; // 0-1: how strong is this theme
  tags: string[];
  examples: string[];
  createdAt: Date;
}

export interface ReturningTheme {
  name: string;
  firstAppeared: Date;
  lastAppeared: Date;
  gapDays: number;
  cycleCount: number; // How many times has it returned
  philosophy?: string;
}

export interface PhilosophyFragment {
  id: string;
  userId: string;
  content: string;
  sourceTheme: string;
  evidenceCount: number;
  extractedAt: Date;
}

export interface LifeSnapshot {
  userId: string; 
  periodStart: Date;
  periodEnd: Date;
  themes: LifeTheme[];
  returningThemes: ReturningTheme[];
  philosophyFragments: PhilosophyFragment[];
  dominantDirection: string;
  createdAt: Date;
}

/**
 * Extract life themes from user records over extended period
 * Focus on patterns, not individual items
 */
export async function extractLifeThemes(
  userId: string,
  periodMonths: number = 6 // Default: last 6 months
): Promise<LifeTheme[]> {
  try {
    const now = new Date();
    const periodStart = new Date(now.getTime() - periodMonths * 30 * 24 * 60 * 60 * 1000);

    // Fetch all records in period
    const contentItems = await prisma.contentItem.findMany({
      where: {
        userId,
        createdAt: { gte: periodStart },
        memoryState: "active",
      },
      select: CONTENT_ITEM_SAFE_SELECT,
      orderBy: { createdAt: "asc" },
    });

    if (contentItems.length === 0) {
      return [];
    }

    // Aggregate tags with temporal data
    const tagTimeline = new Map<string, { dates: Date[]; count: number; examples: string[] }>();

    contentItems.forEach((item) => {
      item.aiTags.forEach((tag) => {
        if (!tagTimeline.has(tag)) {
          tagTimeline.set(tag, { dates: [], count: 0, examples: [] });
        }
        const entry = tagTimeline.get(tag)!;
        entry.dates.push(item.createdAt);
        entry.count++;
        if (entry.examples.length < 3 && item.title) {
          entry.examples.push(item.title);
        }
      });
    });

    // Convert tags to themes
    const themes: LifeTheme[] = [];
    const tagArray = Array.from(tagTimeline.entries());

    // Filter and score themes
    tagArray.forEach(([tag, data]) => {
      // Themes need minimum frequency (2+) to be considered
      if (data.count < 2) return;

      // Calculate strength based on frequency and recency
      const recencyScore = data.dates.length > 0 
        ? 1 - ((now.getTime() - data.dates[data.dates.length - 1].getTime()) / (periodMonths * 30 * 24 * 60 * 60 * 1000))
        : 0;
      const frequencyScore = Math.min(1, data.count / 20); // 20+ occurrences = max score

      const theme: LifeTheme = {
        id: `theme-${userId}-${tag}`,
        userId,
        name: tag,
        description: `「${tag}」に関する記録が、${periodMonths}ヶ月の間、静かに続いています。`,
        firstAppeared: data.dates[0],
        lastAppeared: data.dates[data.dates.length - 1],
        frequency: data.count,
        strength: Math.max(0.3, (recencyScore * 0.6 + frequencyScore * 0.4)),
        tags: [tag],
        examples: data.examples,
        createdAt: now,
      };

      themes.push(theme);
    });

    // Sort by strength descending
    themes.sort((a, b) => b.strength - a.strength);

    // Return top themes (max 8 for cognitive load)
    return themes.slice(0, 8);
  } catch (error) {
    console.error("Failed to extract life themes:", error);
    return [];
  }
}

/**
 * Detect returning themes — things that keep coming back
 */
export async function detectReturningThemes(
  userId: string
): Promise<ReturningTheme[]> {
  try {
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const allItems = await prisma.contentItem.findMany({
      where: {
        userId,
        createdAt: { gte: oneYearAgo },
        memoryState: "active",
      },
      select: CONTENT_ITEM_SAFE_SELECT,
      orderBy: { createdAt: "asc" },
    });

    // Group tags by month
    const monthlyTags = new Map<string, Set<string>>();

    allItems.forEach((item) => {
      const monthKey = item.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyTags.has(monthKey)) {
        monthlyTags.set(monthKey, new Set());
      }
      item.aiTags.forEach((tag) => {
        monthlyTags.get(monthKey)!.add(tag);
      });
    });

    // Find tags that appear in non-consecutive months (returning)
    const tagMonthlyPresence = new Map<string, string[]>();
    monthlyTags.forEach((tags, month) => {
      tags.forEach((tag) => {
        if (!tagMonthlyPresence.has(tag)) {
          tagMonthlyPresence.set(tag, []);
        }
        tagMonthlyPresence.get(tag)!.push(month);
      });
    });

    const returningThemes: ReturningTheme[] = [];

    tagMonthlyPresence.forEach((months, tag) => {
      // Returning themes appear in 3+ separate months
      if (months.length >= 3) {
        // Check for gaps (non-consecutive)
        const hasGaps = months.length > 1 && 
          months.some((m, i) => i > 0 && months[i] !== months[i-1]);

        if (hasGaps) {
          const sortedMonths = months.sort();
          const theme: ReturningTheme = {
            name: tag,
            firstAppeared: new Date(sortedMonths[0]),
            lastAppeared: new Date(sortedMonths[sortedMonths.length - 1]),
            gapDays: Math.floor(
              (new Date(sortedMonths[sortedMonths.length - 1]).getTime() - 
               new Date(sortedMonths[0]).getTime()) / (1000 * 60 * 60 * 24)
            ),
            cycleCount: months.length,
            philosophy: `「${tag}」は、何度も異なる時期に戻ってくるテーマのようです。`,
          };
          returningThemes.push(theme);
        }
      }
    });

    // Sort by cycle count descending
    returningThemes.sort((a, b) => b.cycleCount - a.cycleCount);

    return returningThemes.slice(0, 6);
  } catch (error) {
    console.error("Failed to detect returning themes:", error);
    return [];
  }
}

/**
 * Extract philosophy fragments — values that emerge from records
 * These should NOT be AI-generated, but extracted from actual text
 */
export async function extractPhilosophyFragments(
  userId: string
): Promise<PhilosophyFragment[]> {
  try {
    const persistedFragments = await generatePhilosophyFragments(userId);

    return persistedFragments.slice(0, 4).map((record, index) => ({
      id: record.id,
      userId,
      content: record.fragment,
      sourceTheme: record.relatedTheme ?? record.sourceType,
      evidenceCount: 1,
      extractedAt: new Date(),
    }));
  } catch (error) {
    console.error("Failed to extract philosophy fragments:", error);
    return [];
  }
}

/**
 * Get dominant life direction from recent themes
 */
export async function detectLifeDirection(
  userId: string
): Promise<string> {
  try {
    const themes = await extractLifeThemes(userId, 3); // Last 3 months

    if (themes.length === 0) {
      return "人生の輪郭はまだ静かに育っています。";
    }

    const topTheme = themes[0];
    const topThemeOther = themes.length > 1 ? themes[1] : null;

    if (topThemeOther) {
      return `最近、「${topTheme.name}」と「${topThemeOther.name}」への関心が強まっているようです。`;
    } else {
      return `最近、「${topTheme.name}」に関する記録が静かに積み重なっています。`;
    }
  } catch (error) {
    console.error("Failed to detect life direction:", error);
    return "人生の流れを静かに見つめています。";
  }
}

/**
 * Generate monthly life reflection
 * Different from weekly reflections — focuses on longer patterns
 */
export async function generateMonthlyLifeReflection(
  userId: string,
  month?: Date // if not provided, uses current month
): Promise<string> {
  try {
    const targetMonth = month || new Date();
    const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

    const monthlyItems = await prisma.contentItem.findMany({
      where: {
        userId,
        createdAt: { gte: monthStart, lte: monthEnd },
        memoryState: "active",
      },
      select: {
        aiTags: true,
      },
    });

    if (monthlyItems.length === 0) {
      return "この月は、静かに歩んでいました。";
    }

    // Count theme occurrences
    const themeCounts = new Map<string, number>();
    monthlyItems.forEach((item) => {
      item.aiTags.forEach((tag) => {
        themeCounts.set(tag, (themeCounts.get(tag) || 0) + 1);
      });
    });

    const topThemes = Array.from(themeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([theme]) => theme);

    // Generate reflection message
    const monthName = targetMonth.toLocaleDateString("ja-JP", {
      month: "long",
    });

    const reflectionMessages = [
      `この${monthName}は、「${topThemes.join("」と「")}」を中心に、静かに流れていました。`,
      `${monthName}、「${topThemes[0]}」への関心が深まり始めたようです。`,
      `この${monthName}、「${topThemes.join("」「")}」という異なる関心が并行して走っていました。`,
      `${monthName}は、「${topThemes[0]}」に関する思考が積層していく月でした。`,
    ];

    return reflectionMessages[Math.floor(Math.random() * reflectionMessages.length)];
  } catch (error) {
    console.error("Failed to generate monthly life reflection:", error);
    return "この月の流れを静かに見つめています。";
  }
}
