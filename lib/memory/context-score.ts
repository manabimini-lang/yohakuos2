import { ContentItem } from "@prisma/client";

/**
 * Calculates a Context Score (0-100) for a Memory.
 * Higher score means it's more relevant to the "Current Context".
 * 
 * Score elements:
 * 1. Time Decay (保存鮮度): Recency gives up to 30 points.
 * 2. View Frequency (閲覧頻度): View count + Recency of last view gives up to 20 points.
 * 3. Reflection Presence (Reflection有無): Having a reflection gives up to 30 points.
 * 4. Related Transitions (関連遷移): Currently mocked or derived from viewCount if high. up to 20 points.
 */
export function calculateContextScore(memory: ContentItem): number {
  let score = 0;
  const now = new Date().getTime();
  
  // 1. Time Decay (max 30)
  // Decay over 30 days
  const savedAt = new Date(memory.createdAt).getTime();
  const daysSinceSaved = (now - savedAt) / (1000 * 60 * 60 * 24);
  let timeScore = 30 * Math.exp(-daysSinceSaved / 7); // Half-life of ~5 days
  if (timeScore < 0) timeScore = 0;
  score += timeScore;

  // 2. View Frequency (max 20)
  // Base points on view count
  let viewScore = Math.min((memory.viewCount || 0) * 2, 10);
  
  // Bonus for recent view
  if (memory.lastViewedAt) {
    const lastViewed = new Date(memory.lastViewedAt).getTime();
    const daysSinceLastView = (now - lastViewed) / (1000 * 60 * 60 * 24);
    viewScore += Math.max(0, 10 * Math.exp(-daysSinceLastView / 3));
  }
  score += Math.min(viewScore, 20);

  // 3. Reflection Presence (max 30)
  if (memory.reflection && memory.reflection.trim().length > 0) {
    // Base 15 points for having any reflection
    let reflectionScore = 15;
    // Up to 15 more points for length (up to ~100 chars)
    reflectionScore += Math.min(15, (memory.reflection.length / 100) * 15);
    score += reflectionScore;
  }

  // 4. Related Transitions (max 20)
  // Currently we use a surrogate metric based on contextScore initialization
  // In the future this will be joined from MemoryRelation
  const transitionScore = Math.min((memory.viewCount || 0) * 1.5, 20);
  score += transitionScore;

  // Normalize to 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}
