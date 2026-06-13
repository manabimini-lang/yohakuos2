import { prisma } from "@/lib/prisma";
import { Redis } from "@upstash/redis";
import type { RelatedMemoryViewModel } from "./related-memory";

const hasRedisConfig = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = hasRedisConfig ? Redis.fromEnv() : null;

export async function getContextMemories(
  userId: string,
  themes: string[]
): Promise<RelatedMemoryViewModel[]> {
  if (themes.length === 0) {
    return [];
  }

  const themesString = themes.join(" ");
  // We hash or just use the themes string for the cache key
  const CACHE_KEY = `context-memory:${userId}:${Buffer.from(themesString).toString('base64')}`;

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

  // 2. Dynamically import provider to get embedding
  let embeddingValues: number[] = [];
  try {
    const { resolveProvider } = await import("@/lib/ai/provider-resolver");
    const provider = await resolveProvider(userId);
    
    if (provider) {
      embeddingValues = await provider.embed(themesString);
    }
  } catch (e) {
    console.warn("Failed to get provider or generate embedding for context:", e);
  }

  if (embeddingValues.length === 0) {
    return [];
  }

  // 3. Find Context Memories (> 30 days old) using pgvector
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const vectorStr = `[${embeddingValues.join(",")}]`;

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
        1 - (embedding <=> ${vectorStr}::vector) as "similarityScore"
      FROM content_items
      WHERE user_id = ${userId}
        AND created_at < ${thirtyDaysAgo}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorStr}::vector
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
    console.error("Error fetching context memories:", error);
    return [];
  }
}
