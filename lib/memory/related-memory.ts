import { prisma } from "@/lib/prisma";
import { ContentItem } from "@prisma/client";

export interface RelatedMemoryViewModel {
  id: string;
  title: string;
  thumbnailUrl?: string;
  reflectionPreview?: string;
  similarityScore: number;
  createdAt: string;
}

/**
 * Calculates related memories for a given ContentItem.
 * Uses a heuristic mix (for Phase 1):
 * - Content Similarity (50%) -> Mocked using tags overlap
 * - Reflection Similarity (30%) -> Mocked using presence or tags
 * - Time Proximity (20%) -> Date distance
 * 
 * Future Phase 2 will replace the mock with actual `embedding <=> current_embed` via pgvector.
 */
export async function getRelatedMemories(
  contentId: string,
  userId: string,
  limit: number = 3
): Promise<RelatedMemoryViewModel[]> {
  const current = await prisma.contentItem.findUnique({
    where: { id: contentId }
  });

  if (!current) return [];

  // Fetch candidate pool (exclude current)
  // Optimization: fetch recent or random sample if DB is huge
  const candidates = await prisma.contentItem.findMany({
    where: {
      userId,
      id: { not: current.id }
    },
    take: 50,
  });

  const now = new Date().getTime();
  const currentDate = new Date(current.createdAt).getTime();
  const currentTags = new Set(current.aiTags || []);

  const scoredCandidates = candidates.map(candidate => {
    let score = 0;

    // 1. Content Similarity (50%)
    // Mock: Check aiTags overlap
    let tagScore = 0;
    if (currentTags.size && candidate.aiTags?.length) {
      const overlap = candidate.aiTags.filter(t => currentTags.has(t)).length;
      tagScore = (overlap / Math.max(current.aiTags.length, 1)) * 50;
    }
    score += tagScore;

    // 2. Reflection Similarity (30%)
    // Mock: If both have reflections, give base points. 
    // In actual implementation, this would be semantic similarity of reflections.
    if (current.reflection && candidate.reflection) {
      score += 15;
      // Add more if they share tags + both have reflection
      score += (tagScore / 50) * 15;
    }

    // 3. Time Proximity (20%)
    // Items created close to each other get higher score.
    const candidateDate = new Date(candidate.createdAt).getTime();
    const daysDiff = Math.abs(currentDate - candidateDate) / (1000 * 60 * 60 * 24);
    // Gaussian-like decay, max 20 pts for same day
    const timeScore = 20 * Math.exp(-daysDiff / 14); 
    score += timeScore;

    return {
      id: candidate.id,
      title: candidate.title || candidate.url || candidate.fileName || "保存された記録",
      thumbnailUrl: candidate.thumbnailUrl || undefined,
      reflectionPreview: candidate.reflection ? candidate.reflection.slice(0, 60) : undefined,
      similarityScore: score,
      createdAt: candidate.createdAt.toISOString()
    };
  });

  // Sort by score desc and take limit
  return scoredCandidates
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);
}
