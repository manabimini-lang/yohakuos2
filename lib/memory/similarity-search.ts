import { prisma } from "@/lib/prisma";

export interface SimilarityResult {
  id: string;
  similarityScore: number;
}

export async function findSimilarContent(
  userId: string,
  embedding: number[],
  limit: number = 5,
  threshold: number = 0.72 // threshold 0.72 ~ 0.82 based on feedback
): Promise<SimilarityResult[]> {
  try {
    // Requires pgvector to be installed on the database
    // The `<=>` operator computes cosine distance (1 - cosine similarity).
    // Therefore, cosine similarity = 1 - (embedding <=> query_embedding)
    // We want similarity > threshold, which means distance < (1 - threshold)
    
    // We need to format the embedding array as a vector string for Postgres
    const vectorString = `[${embedding.join(",")}]`;
    const distanceThreshold = 1 - threshold;

    // We only select items that are active and belong to the user
    const results = await prisma.$queryRaw<SimilarityResult[]>`
      SELECT 
        id, 
        1 - (embedding <=> ${vectorString}::vector) AS "similarityScore"
      FROM content_items
      WHERE user_id = ${userId}
        AND embedding IS NOT NULL
        AND memory_state = 'active'
        AND (embedding <=> ${vectorString}::vector) < ${distanceThreshold}
      ORDER BY embedding <=> ${vectorString}::vector
      LIMIT ${limit};
    `;

    return results;
  } catch (error) {
    console.error("Similarity search failed:", error);
    return [];
  }
}
