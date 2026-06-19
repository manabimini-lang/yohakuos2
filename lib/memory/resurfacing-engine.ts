import { prisma } from "@/lib/prisma";
import { generateReflectionPrompt } from "./reflection-generator";
import { CONTENT_ITEM_SAFE_SELECT } from "@/lib/content-item-safe-select";

const RESURFACING_EXCLUSION_DAYS = 30;
const OLDER_THAN_DAYS = 14;

/**
 * Sprint E-4C: Resurfacing Selection Engine
 * Generates a daily memory resurfacing for a user.
 */
export async function generateDailyResurfacing(
  userId: string
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Count today's resurfacings. Exit if one already exists.
  const existingResurfacing = await prisma.memoryResurfacing.findFirst({
    where: {
      userId,
      createdAt: { gte: today },
      expiresAt: { gt: new Date() },
    },
  });

  if (existingResurfacing) {
    console.log(`[RESURFACING_ENGINE] User ${userId} already has a resurfacing for today.`);
    return;
  }

  // 2. Query candidate memories
  const exclusionDate = new Date();
  exclusionDate.setDate(today.getDate() - RESURFACING_EXCLUSION_DAYS);

  const olderThanDate = new Date();
  olderThanDate.setDate(today.getDate() - OLDER_THAN_DAYS);

  const candidateRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT ci.id
    FROM content_items ci
    WHERE ci.user_id = ${userId}
      AND ci.memory_state = 'active'
      AND ci.embedding IS NOT NULL
      AND ci.created_at <= ${olderThanDate}
      AND NOT EXISTS (
        SELECT 1
        FROM memory_resurfacings mr
        WHERE mr.source_content_id = ci.id
          AND mr.created_at >= ${exclusionDate}
          AND mr.expires_at > NOW()
      )
    ORDER BY ci.created_at ASC
    LIMIT 50
  `;

    const candidates = candidateRows.length
      ? await prisma.contentItem.findMany({
        where: { id: { in: candidateRows.map((row) => row.id) } },
        select: CONTENT_ITEM_SAFE_SELECT,
      })
      : [];

  if (candidates.length === 0) {
    console.log(`[RESURFACING_ENGINE] No eligible candidates for user ${userId}.`);
    return;
  }

  // Score candidates (simple scoring for now, can be expanded)
  const scoredCandidates = await Promise.all(candidates.map(async (item: any) => {
    // Simulate high semantic connectivity by checking for existing links
    const linkCount = await prisma.memoryLink.count({
      where: {
        OR: [{ sourceId: item.id }, { targetId: item.id }],
      },
    });

    // Score based on age, links, and randomness for serendipity
    const ageScore = (today.getTime() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365); // Years old
    const connectivityScore = Math.min(1, linkCount / 5); // Max 1.0 for 5+ links
    const randomScore = Math.random(); // Introduce serendipity

    return {
      item,
      score: ageScore * 0.4 + connectivityScore * 0.4 + randomScore * 0.2,
    };
  }));

  // Select one (randomize among top candidates)
  scoredCandidates.sort((a: any, b: any) => b.score - a.score);
  const topCandidates = scoredCandidates.slice(0, Math.min(5, scoredCandidates.length)); // Top 5
  const selectedCandidate = topCandidates[Math.floor(Math.random() * topCandidates.length)];

  if (!selectedCandidate) {
    console.log(`[RESURFACING_ENGINE] No candidate selected for user ${userId}.`);
    return;
  }

  // Generate reflection prompt
  const reflectionPrompt = await generateReflectionPrompt({
    title: selectedCandidate.item.title || undefined,
    summary: selectedCandidate.item.summary || undefined,
    reflection: selectedCandidate.item.reflection,
  });

  // Persist MemoryResurfacing record
  await prisma.memoryResurfacing.create({
    data: {
      userId,
      sourceContentId: selectedCandidate.item.id,
      message: reflectionPrompt,
      similarityScore: selectedCandidate.score,
      expiresAt: new Date(Date.now() + RESURFACING_EXCLUSION_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`[RESURFACING_ENGINE] Generated resurfacing for user ${userId}, item ${selectedCandidate.item.id}`);
}
