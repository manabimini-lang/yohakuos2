import { ContentItem } from "@prisma/client";

export function calculateMemoryScore(item: ContentItem) {
  const metadata = typeof item.metadata === "object" && item.metadata !== null ? item.metadata as Record<string, any> : {};
  const viewCount = typeof metadata.viewCount === "number" ? metadata.viewCount : 0;
  const clickCount = typeof metadata.clickCount === "number" ? metadata.clickCount : 0;

  // 1-1. VisualScore
  let visualScore = 0;
  let hasStrongThumbnail = false;

  const isYouTube = item.url?.includes("youtube.com") || item.url?.includes("youtu.be");
  const hasImage = !!item.thumbnailUrl || !!item.fileUrl;
  const isPdf = item.type === "pdf";

  if (isYouTube && hasImage) {
    visualScore += 40;
    hasStrongThumbnail = true;
  } else if (hasImage) {
    visualScore += 30; // OG image
    hasStrongThumbnail = true;
  } else if (item.domain) {
    visualScore += 10; // favicon only approximation
  }

  // 1-2. EmotionalScore
  let emotionalScore = 0;
  const hasReflection = !!item.reflection;
  
  const tagCount = Array.isArray(item.aiTags) ? item.aiTags.length : 0;
  emotionalScore += (tagCount * 2);

  let contentTypeWeight = 0;
  if (item.domain?.includes("note.com")) {
    contentTypeWeight = 15;
  } else if (isYouTube) {
    contentTypeWeight = 10;
  } else if (isPdf) {
    contentTypeWeight = 5;
  } else {
    // Default article weight
    contentTypeWeight = 8;
  }
  emotionalScore += contentTypeWeight;

  // New: ReflectionScore
  const reflectionScore = item.reflection?.length ? 30 : 0;

  // 1-3. TemporalScore
  const daysSinceCreated = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const temporalScore = Math.exp(-daysSinceCreated / 7) * 20;

  // 1-4. InteractionScore
  const interactionScore = (viewCount * 3) + (clickCount * 5);

  // 2. MemoryScore 最終式
  let memoryScore = visualScore + reflectionScore + emotionalScore + temporalScore + interactionScore;

  // 4. 補正ロジック
  // 4-1. 新規ブースト (isNew = 24時間以内と定義)
  const isNew = daysSinceCreated <= 1;
  if (isNew) {
    memoryScore += 15;
  }

  // 4-2. 埋もれ救済
  if (daysSinceCreated > 30 && emotionalScore > 20) {
    memoryScore += 10;
  }

  // 4-3. サムネイル強制優遇
  if (hasStrongThumbnail) {
    memoryScore += 20;
  }

  // Reflectionを持つ記録を優先
  if (hasReflection) {
    memoryScore += 10;
  }

  return memoryScore;
}
