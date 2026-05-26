import { prisma } from "@/lib/prisma";

export interface KnowledgeMatchResult {
  id: string;
  similarityScore: number;
}

export async function matchKnowledgeContent(
  embedding: number[],
  limit: number = 3,
  threshold: number = 0.75
): Promise<KnowledgeMatchResult[]> {
  try {
    const vectorString = `[${embedding.join(",")}]`;
    const distanceThreshold = 1 - threshold;

    const results = await prisma.$queryRaw<KnowledgeMatchResult[]>`
      SELECT 
        id, 
        1 - (embedding <=> ${vectorString}::vector) AS "similarityScore"
      FROM knowledge_contents
      WHERE is_published = true
        AND embedding IS NOT NULL
        AND (embedding <=> ${vectorString}::vector) < ${distanceThreshold}
      ORDER BY embedding <=> ${vectorString}::vector
      LIMIT ${limit};
    `;

    return results;
  } catch (error) {
    console.error("Knowledge matching failed:", error);
    return [];
  }
}

export async function createLearningSuggestion(
  userId: string,
  contentItemId: string | null,
  knowledgeContentId: string,
  similarityScore: number,
  reason: string | null = null
) {
  return prisma.learningSuggestion.create({
    data: {
      userId,
      contentItemId,
      knowledgeContentId,
      similarityScore,
      reason,
    },
  });
}
