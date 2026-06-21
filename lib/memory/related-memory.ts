import { prisma } from "@/lib/prisma";
import { CONTENT_ITEM_SAFE_SELECT } from "@/lib/content-item-safe-select";

export interface RelatedMemoryViewModel {
  id: string;
  title: string;
  thumbnailUrl?: string;
  reflectionPreview?: string;
  similarityScore: number;
  createdAt: string;
}

export async function getRelatedMemories(
  contentId: string,
  userId: string,
  limit: number = 3
): Promise<RelatedMemoryViewModel[]> {
  try {
    // Attempt semantic vector search if pgvector is enabled and embedding exists
    const related: any[] = await prisma.$queryRaw`
      SELECT 
        id, 
        title, 
        thumbnail_url, 
        reflection, 
        created_at,
        1 - (embedding <=> (SELECT embedding FROM content_items WHERE id = ${contentId})) as similarity
      FROM content_items
      WHERE user_id = ${userId}
        AND id != ${contentId}
        AND embedding IS NOT NULL
        AND (SELECT embedding FROM content_items WHERE id = ${contentId}) IS NOT NULL
      ORDER BY embedding <=> (SELECT embedding FROM content_items WHERE id = ${contentId})
      LIMIT ${limit};
    `;

    if (related.length > 0) {
      return related.map(item => ({
        id: item.id,
        title: item.title || "保存された記録",
        thumbnailUrl: item.thumbnail_url || undefined,
        reflectionPreview: item.reflection ? item.reflection.slice(0, 60) : undefined,
        similarityScore: item.similarity * 100, // roughly 0-100 scale
        createdAt: item.created_at.toISOString()
      }));
    }
  } catch (err) {
    console.error("[getRelatedMemories] Vector search failed, falling back:", err);
  }

  // Fallback heuristic if vector search fails or embeddings are missing
  const current = await prisma.contentItem.findUnique({
    where: { id: contentId },
    select: CONTENT_ITEM_SAFE_SELECT,
  });

  if (!current) return [];

  const candidates = await prisma.contentItem.findMany({
    where: { userId, id: { not: current.id } },
    select: CONTENT_ITEM_SAFE_SELECT,
    take: 50,
  });

  const currentDate = new Date(current.createdAt).getTime();
  const currentTags = new Set(current.aiTags || []);

  const scoredCandidates = candidates.map(candidate => {
    let score = 0;
    let tagScore = 0;
    if (currentTags.size && candidate.aiTags?.length) {
      const overlap = candidate.aiTags.filter(t => currentTags.has(t)).length;
      tagScore = (overlap / Math.max(current.aiTags.length, 1)) * 50;
    }
    score += tagScore;

    // Reflection context weighting
    if (current.reflection && candidate.reflection) {
      score += 25;
      score += (tagScore / 50) * 20;
    }

    const candidateDate = new Date(candidate.createdAt).getTime();
    const daysDiff = Math.abs(currentDate - candidateDate) / (1000 * 60 * 60 * 24);
    score += 20 * Math.exp(-daysDiff / 14); 

    return {
      id: candidate.id,
      title: candidate.title || candidate.url || candidate.fileName || "保存された記録",
      thumbnailUrl: candidate.thumbnailUrl || undefined,
      reflectionPreview: candidate.reflection ? candidate.reflection.slice(0, 60) : undefined,
      similarityScore: score,
      createdAt: candidate.createdAt.toISOString()
    };
  });

  return scoredCandidates
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);
}
