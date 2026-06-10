import { prisma } from "@/lib/prisma";
import { findSimilarContent } from "./semantic-search";

/**
 * Sprint E-3C: Memory Link Generation
 * Automatically creates edges between similar knowledge items.
 */
export async function generateMemoryLinks(
  userId: string,
  contentItemId: string,
  embedding: number[]
): Promise<void> {
  const threshold = Number(process.env.MEMORY_LINK_THRESHOLD ?? 0.75);
  const limit = Number(process.env.MEMORY_LINK_LIMIT ?? 5);

  const neighbors = await findSimilarContent(userId, embedding, {
    excludeId: contentItemId,
    threshold,
    limit
  });

  if (neighbors.length === 0) return;

  for (const neighbor of neighbors) {
    // Canonical sorting of IDs for undirected graph consistency
    const [sourceId, targetId] = [contentItemId, neighbor.id].sort();

    await prisma.memoryLink.upsert({
      where: {
        sourceId_targetId: { sourceId, targetId } // Unique constraint for canonical pair
      },
      update: {
        similarity: neighbor.similarityScore, // Update similarity if link already exists
      },
      create: {
        sourceId,
        targetId,
        similarity: neighbor.similarityScore,
      }
    });
  }
  console.log(`[MEMORY_LINK_GENERATOR] Generated ${neighbors.length} links for ContentItem ${contentItemId}`);
}