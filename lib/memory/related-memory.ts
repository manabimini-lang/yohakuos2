import { prisma } from "@/lib/prisma";
import { Redis } from "@upstash/redis";

// Define the ViewModel for Related Memory
export type RelatedMemoryViewModel = {
  id: string;
  title: string;
  thumbnailUrl?: string;
  reflectionPreview?: string;
  similarityScore: number;
  createdAt: string;
};

// Initialize Upstash Redis (if configured)
const hasRedisConfig = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = hasRedisConfig ? Redis.fromEnv() : null;

/**
 * Get related memories based on embedding cosine distance (pgvector)
 * @param contentId ID of the reference content
 * @param userId ID of the current user
 * @returns Top 5 related memories
 */
export async function getRelatedMemories(
  contentId: string,
  userId: string
): Promise<RelatedMemoryViewModel[]> {
  const CACHE_KEY = `related:${contentId}`;
  
  // 1. Try Cache
  if (redis) {
    try {
      const cached = await redis.get<RelatedMemoryViewModel[]>(CACHE_KEY);
      if (cached) {
        return cached;
      }
    } catch (e) {
      console.warn("Redis cache read failed:", e);
    }
  }

  // 2. Fetch target item embedding
  const currentItem = await prisma.contentItem.findUnique({
    where: { id: contentId },
    select: { embedding: true },
  });

  if (!currentItem) {
    return [];
  }

  // If no embedding yet, return empty
  // (In Prisma, unsupported types come back as raw values if we use queryRaw, but findUnique doesn't return Unsupported types properly,
  // so we actually must fetch embedding via queryRaw if we need it, OR we just do it in one SQL query)
  
  // 3. One SQL Query to find nearest neighbors
  // We compute cosine distance: embedding <=> (SELECT embedding FROM content_items WHERE id = ...)
  // Note: Prisma raw query parameters must be used carefully.
  try {
    const rawResults = await prisma.$queryRaw<any[]>`
      SELECT 
        id, 
        title, 
        url, 
        file_name as "fileName",
        thumbnail_url as "thumbnailUrl", 
        reflection, 
        created_at as "createdAt",
        1 - (embedding <=> (SELECT embedding FROM content_items WHERE id = ${contentId})) as "similarityScore"
      FROM content_items
      WHERE user_id = ${userId}
        AND id != ${contentId}
        AND embedding IS NOT NULL
        AND (SELECT embedding FROM content_items WHERE id = ${contentId}) IS NOT NULL
      ORDER BY embedding <=> (SELECT embedding FROM content_items WHERE id = ${contentId})
      LIMIT 5
    `;

    const viewModels: RelatedMemoryViewModel[] = rawResults.map((row) => ({
      id: row.id,
      title: row.title || row.url || row.fileName || "保存された記録",
      thumbnailUrl: row.thumbnailUrl || undefined,
      reflectionPreview: row.reflection ? row.reflection.slice(0, 60) : undefined,
      similarityScore: Number(row.similarityScore),
      createdAt: new Date(row.createdAt).toISOString(),
    }));

    // 4. Set Cache
    if (redis && viewModels.length > 0) {
      try {
        await redis.set(CACHE_KEY, viewModels, { ex: 60 * 60 * 24 }); // 24h TTL
      } catch (e) {
        console.warn("Redis cache write failed:", e);
      }
    }

    return viewModels;
  } catch (error) {
    console.error("Error fetching related memories:", error);
    return [];
  }
}
