import { prisma } from "@/lib/prisma";
import { KnowledgeStatus } from "@prisma/client";
import { generateReflectionPrompt } from "./reflection-generator";
import { findSimilarContent } from "./semantic-search";
import { getDefaultProvider } from "@/lib/ai/provider";

const RESURFACING_EXCLUSION_DAYS = 30;
const OLDER_THAN_DAYS = 14;
const SEMANTIC_CONNECTIVITY_THRESHOLD = 0.7; // Example threshold for "high semantic connectivity"

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
      surfacedAt: { gte: today },
      status: { not: "DISMISSED" },
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

  const candidates = await prisma.contentItem.findMany({
    where: {
      userId,
      status: KnowledgeStatus.PROCESSED,
      embedding: { not: null },
      createdAt: { lte: olderThanDate }, // Older than 14 days
      resurfacings: {
        none: {
          // Not resurfaced within the exclusion period
          surfacedAt: { gte: exclusionDate },
          status: { not: "DISMISSED" },
        },
      },
    },
    orderBy: { createdAt: "asc" }, // Prefer older items
    take: 50, // Fetch a reasonable number of candidates
  });

  if (candidates.length === 0) {
    console.log(`[RESURFACING_ENGINE] No eligible candidates for user ${userId}.`);
    return;
  }

  // Score candidates (simple scoring for now, can be expanded)
  const scoredCandidates = await Promise.all(candidates.map(async (item) => {
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
  scoredCandidates.sort((a, b) => b.score - a.score);
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
      contentItemId: selectedCandidate.item.id,
      reason: "daily_resurfacing",
      reflectionPrompt,
      status: "PENDING", // User needs to see it
      surfacedAt: new Date(),
    },
  });
  console.log(`[RESURFACING_ENGINE] Generated resurfacing for user ${userId}, item ${selectedCandidate.item.id}`);
}