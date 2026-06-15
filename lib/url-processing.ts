import { ContentItemType, MemoryMetadata } from "@/lib/ai/provider";

export function detectContentType(url: string): ContentItemType {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) return "youtube";
  if (lowerUrl.includes("instagram.com")) return "instagram";
  if (lowerUrl.includes("x.com") || lowerUrl.includes("twitter.com")) return "x";
  if (lowerUrl.includes("note.com")) return "note";
  if (lowerUrl.endsWith(".pdf")) return "pdf";
  if (lowerUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i)) return "image";
  return "website";
}

export function extractYouTubeId(url: string): string | undefined {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
  return match?.[1];
}

export async function generateMemoryMetadata(url: string, title?: string, description?: string): Promise<{
  title: string;
  description?: string;
  thumbnailUrl: string | null;
  contentType: ContentItemType;
  metadata: MemoryMetadata;
}> {
  const contentType = detectContentType(url);
  const metadata: MemoryMetadata = {
    title,
    description,
    siteName: "", 
    thumbnailUrl: null,
  };

  if (contentType === "youtube") {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      metadata.videoId = videoId;
      // YouTube の場合は規約に基づき特定のサムネイルURLを固定で保存
      metadata.thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      metadata.duration = null; 
    }
  }

  return {
    title: metadata.title || "Untitled Memory",
    description: metadata.description,
    thumbnailUrl: metadata.thumbnailUrl || null,
    contentType,
    metadata,
  };
}