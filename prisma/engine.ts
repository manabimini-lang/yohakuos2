import { prisma } from "@/lib/prisma";
import { PhilosophyPatternType, FeedbackOutcome } from "@prisma/client";

/**
 * G-12.3: Philosophy Extraction Engine
 * Analyzes feedback and signals to derive user's core drivers.
 */
export async function analyzeUserPhilosophy(userId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 1. Gather all meaningful signals
  const [feedbacks, signals, memories] = await Promise.all([
    prisma.recommendationFeedback.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      include: { recommendation: true }
    }),
    prisma.lifeSignal.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } }
    }),
    prisma.userMemory.findMany({
      where: { userId, type: "value", confidence: { gte: 0.6 } }
    })
  ]);

  const scores: Record<PhilosophyPatternType, number> = {
    GROWTH: 0,
    RESTORATION: 0,
    CONNECTION: 0,
    EXPLORATION: 0,
    STABILITY: 0,
    CREATIVITY: 0
  };

  // 2. Map Feedback to Philosophy
  feedbacks.forEach(f => {
    const isSuccess = f.outcome === FeedbackOutcome.COMPLETED;
    const delta = isSuccess ? 0.05 : -0.03;
    
    switch (f.recommendation.recommendationType) {
      case 'LEARN': scores.GROWTH += delta; break;
      case 'REST': scores.RESTORATION += delta; break;
      case 'CONNECT': scores.CONNECTION += delta; break;
      case 'EXPLORE': scores.EXPLORATION += delta; break;
      case 'REFLECT': scores.STABILITY += delta; break;
      case 'CREATE': scores.CREATIVITY += delta; break;
    }
  });

  // 3. Map Signals (Evidence of life shifts)
  signals.forEach(s => {
    if (s.signalType === 'BURNOUT_RISK') scores.RESTORATION += 0.1;
    if (s.signalType === 'INTEREST_GROWTH') scores.EXPLORATION += 0.05;
    if (s.signalType === 'LEARNING_STREAK') scores.GROWTH += 0.08;
    
    // D-2.5: Connection between Community Echo and Philosophy
    if (s.signalType === 'COMMUNITY_INSPIRED') {
      // COMMUNITY_INSPIRED シグナルから momentId を抽出し、最新の共鳴数を取得する準備
      const momentId = (s.metadata as any)?.momentId;
      inspiredMomentIds.add(momentId);
    }
  });

  // COMMUNITY_INSPIRED の重み付け計算（理想案：Momentを参照）
  const inspiredMoments = await prisma.communityMoment.findMany({
    where: { id: { in: Array.from(inspiredMomentIds).filter(Boolean) as string[] } },
    select: { id: true, inspiredCount: true }
  });
  const momentCountMap = new Map(inspiredMoments.map(m => [m.id, m.inspiredCount]));

  signals.forEach(s => {
    if (s.signalType === 'COMMUNITY_INSPIRED') {
      const momentId = (s.metadata as any)?.momentId;
      const inspiredCount = momentCountMap.get(momentId) || (s.metadata as any)?.inspiredCount || 0;
      const delta = Math.min(0.1, (inspiredCount + 1) * 0.002); // Ensure base delta
      
      scores.CONNECTION += delta;
      scores.GROWTH += delta * 0.5;
    }
  });

  // 4. Update Patterns in DB
  const results = await Promise.all(
    Object.entries(scores).map(async ([type, delta]) => {
      if (delta === 0) return null;

      const existing = await prisma.philosophyPattern.findFirst({
        where: { userId, patternType: type as PhilosophyPatternType }
      });

      const newConfidence = Math.min(1.0, Math.max(0.1, (existing?.confidence ?? 0.5) + delta));

      return await prisma.philosophyPattern.upsert({
        where: { id: existing?.id ?? 'new' },
        create: {
          userId,
          patternType: type as PhilosophyPatternType,
          confidence: newConfidence,
          evidence: { lastDelta: delta, feedbackCount: feedbacks.length }
        },
        update: {
          confidence: newConfidence,
          evidence: { lastDelta: delta, feedbackCount: feedbacks.length }
        }
      });
    })
  );

  return results.filter(Boolean);
}

export async function getUserPhilosophyContext(userId: string) {
  const patterns = await prisma.philosophyPattern.findMany({
    where: { userId, confidence: { gte: 0.3 } },
    select: { patternType: true, confidence: true }
  });
  
  return Object.fromEntries(patterns.map(p => [p.patternType.toLowerCase(), p.confidence]));
}
