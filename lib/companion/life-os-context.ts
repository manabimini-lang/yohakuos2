// ===================================================
// YOHAKU Companion — Life OS Context Integration
// ===================================================
//
// Surfaces life themes, returning patterns, and philosophy
// as ambient context for companion awareness (not synthesis)
//

import {
  extractLifeThemes,
  detectReturningThemes,
  detectLifeDirection,
  type LifeTheme,
  type ReturningTheme,
} from "@/lib/life/life-themes-engine";
import { getLatestPhilosophyFragments } from "@/lib/memory/philosophy";
import type { PhilosophyFragment } from "@/lib/life/life-themes-engine";
import { prisma } from "@/lib/prisma";

export interface LifeOSAwareContext {
  lifeThemes: Array<{
    name: string;
    description: string;
    strength: number; // 0-1
    monthsSince: number;
  }>;
  returningThemes: Array<{
    name: string;
    cycleCount: number;
    gapDays: number;
  }>;
  philosophyFragments: Array<{
    content: string;
    sourceTheme: string;
  }>;
  lifeDirection: string | null;
  innerLandscape?: {
    period: string;
    seasonalAir?: string;
    quietCurrents?: string[];
    returningQuestions?: string[];
    resonanceWeather?: string;
    philosophyEchoes?: string[];
  } | null;
}

/**
 * Fetch Life OS context for companion awareness.
 * Lightweight aggregation — companion knows life themes but doesn't synthesize them.
 * Used by companion to understand user's trajectory, values, and patterns.
 */
export async function getLifeOSContextForCompanion(
  userId: string
): Promise<LifeOSAwareContext> {
  try {
    const [themes, returning, philosophy, direction, innerLandscapeRec] = await Promise.all([
      extractLifeThemes(userId, 6).then((t) => t.slice(0, 3)), // top 3 themes
      detectReturningThemes(userId).then((t) =>
        t.slice(0, 2).map((th) => ({
          name: th.name,
          cycleCount: th.cycleCount,
          gapDays: th.gapDays,
        }))
      ),
      getLatestPhilosophyFragments(userId, 2).then((p) =>
        p.map((f) => ({
          content: f.fragment,
          sourceTheme: f.relatedTheme ?? f.sourceType,
        }))
      ),
      detectLifeDirection(userId),
      prisma.innerLandscape.findFirst({
        where: { userId },
        orderBy: { generatedAt: "desc" },
        select: {
          period: true,
          seasonalAir: true,
          quietCurrents: true,
          returningQuestions: true,
          resonanceWeather: true,
          philosophyEchoes: true,
        },
      }),
    ]);

    return {
      lifeThemes: themes.map((t) => ({
        name: t.name,
        description: t.description,
        strength: t.strength,
        monthsSince: Math.floor((Date.now() - t.lastAppeared.getTime()) / (30 * 24 * 60 * 60 * 1000)),
      })),
      returningThemes: returning,
      philosophyFragments: philosophy,
      lifeDirection: direction,
      innerLandscape: innerLandscapeRec
        ? {
            period: innerLandscapeRec.period,
            seasonalAir: innerLandscapeRec.seasonalAir || undefined,
            quietCurrents: (innerLandscapeRec.quietCurrents as string[]) || [],
            returningQuestions: (innerLandscapeRec.returningQuestions as string[]) || [],
            resonanceWeather: innerLandscapeRec.resonanceWeather || undefined,
            philosophyEchoes: (innerLandscapeRec.philosophyEchoes as string[]) || [],
          }
        : null,
    };
  } catch (error: any) {
    console.warn("[Life OS Context] Failed to fetch:", error?.message);
    // Graceful degradation - companion works without life context
    return {
      lifeThemes: [],
      returningThemes: [],
      philosophyFragments: [],
      lifeDirection: null,
      innerLandscape: null,
    };
  }
}
