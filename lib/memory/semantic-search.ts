import { prisma } from "@/lib/prisma";

export interface SimilarContentResult {
  id: string;
  title: string | null;
  summary: string | null;
  similarityScore: number;
}

/**
 * Sprint E-3B: Semantic Search Service
 * Uses pgvector cosine similarity to find related memories.
 */
export async function findSimilarContent(
  userId: string,
  embedding: number[],
  options: { limit?: number; excludeId?: string; threshold?: number } = {}
): Promise<SimilarContentResult[]> {
  const { 
    limit = Number(process.env.MEMORY_LINK_LIMIT ?? 5), // Configurable limit
    excludeId, 
    threshold = Number(process.env.MEMORY_LINK_THRESHOLD ?? 0.75) // Configurable threshold
  } = options;

  const vectorString = `[${embedding.join(",")}]`;
  
  const results = excludeId
    ? await prisma.$queryRaw<any[]>`
        SELECT
          id,
          title,
          summary,
          (1 - (embedding <=> ${vectorString}::vector)) as "similarityScore"
        FROM content_items
        WHERE user_id = ${userId}
          AND memory_state = 'active'
          AND embedding IS NOT NULL
          AND id != ${excludeId}
          AND (1 - (embedding <=> ${vectorString}::vector)) >= ${threshold}
        ORDER BY "similarityScore" DESC
        LIMIT ${limit}
      `
    : await prisma.$queryRaw<any[]>`
        SELECT
          id,
          title,
          summary,
          (1 - (embedding <=> ${vectorString}::vector)) as "similarityScore"
        FROM content_items
        WHERE user_id = ${userId}
          AND memory_state = 'active'
          AND embedding IS NOT NULL
          AND (1 - (embedding <=> ${vectorString}::vector)) >= ${threshold}
        ORDER BY "similarityScore" DESC
        LIMIT ${limit}
      `;

  return results.map((r: { id: string; title: string | null; summary: string | null; similarityScore: number | string }) => ({
    id: r.id,
    title: r.title,
    summary: r.summary,
    similarityScore: Number(r.similarityScore)
  }));
}
