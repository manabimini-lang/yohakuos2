import { prisma } from "@/lib/prisma";
import { ReflectionTheme, WisdomInsightType, SnapshotStatus } from "@prisma/client";
import { getUserPhilosophyContext } from "@/lib/philosophy/engine";
import { generateWisdomContent } from "./wisdom-generator";

/**
 * D-3 Collective Wisdom Engine
 * Analyzes the relationship between personal philosophy and community flow.
 */
export async function generateCollectiveWisdom(userId: string) {
  // 1. Data Gathering
  const [philosophy, latestSnapshot, prevSnapshots] = await Promise.all([
    getUserPhilosophyContext(userId),
    prisma.communityReflectionSnapshot.findFirst({
      where: { status: SnapshotStatus.GENERATED },
      orderBy: { periodEnd: "desc" }
    }),
    prisma.communityReflectionSnapshot.findMany({
      where: { status: SnapshotStatus.GENERATED },
      orderBy: { periodEnd: "desc" },
      take: 4
    })
  ]);

  if (!latestSnapshot || Object.keys(philosophy).length === 0) {
    return null;
  }

  // 2. Alignment / Divergence Analysis
  // Compare user's primary pattern with community scores
  const analysis = performResonanceAnalysis(philosophy, latestSnapshot);

  // 3. Emerging Pattern Analysis (Check past 4 weeks)
  const patternType = detectEmergingPattern(prevSnapshots);

  // 4. Decision Logic for Insight Type
  let selectedType: WisdomInsightType = analysis.diff < 0.15 
    ? WisdomInsightType.ALIGNMENT 
    : WisdomInsightType.DIVERGENCE;

  // If community signal is strong (Trend), prioritize SIGNAL
  if (latestSnapshot.trendDirection !== 0 && latestSnapshot.inspiredCount > 20) {
    selectedType = WisdomInsightType.COMMUNITY_SIGNAL;
  } else if (patternType) {
    selectedType = WisdomInsightType.EMERGING_PATTERN;
  }

  // 5. Content Generation (AI)
  const aiResult = await generateWisdomContent({
    type: selectedType,
    userContext: philosophy,
    snapshot: latestSnapshot,
    patternTheme: patternType
  });

  // 6. Persistence
  return await prisma.wisdomInsight.create({
    data: {
      userId,
      title: aiResult.title,
      content: aiResult.content,
      insightType: selectedType,
      score: analysis.resonanceScore,
      metadata: {
        analysis,
        snapshotId: latestSnapshot.id,
        patternTheme: patternType
      }
    }
  });
}

function performResonanceAnalysis(philosophy: Record<string, number>, snapshot: any) {
  // Get user's dominant scores
  const uRest = philosophy['restoration'] || 0;
  const uGrow = philosophy['growth'] || 0;
  const uConn = philosophy['connection'] || 0;

  // Snapshot scores
  const cRest = snapshot.restorationScore;
  const cGrow = snapshot.growthScore;
  const cConn = snapshot.connectionScore;

  // Calculate average difference of key metrics
  const diff = (
    Math.abs(uRest - cRest) + 
    Math.abs(uGrow - cGrow) + 
    Math.abs(uConn - cConn)
  ) / 3;

  return {
    diff,
    resonanceScore: 1 - diff,
    dominantMatch: snapshot.dominantTheme?.toLowerCase() in philosophy
  };
}

function detectEmergingPattern(snapshots: any[]): ReflectionTheme | null {
  if (snapshots.length < 3) return null;

  const themes = snapshots.map(s => s.dominantTheme).filter(Boolean);
  const firstTheme = themes[0];
  
  // If the same theme persists for 3 out of 4 weeks
  const count = themes.filter(t => t === firstTheme).length;
  return count >= 3 ? firstTheme : null;
}