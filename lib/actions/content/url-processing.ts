import { ContentItemType, MemoryMetadata } from "@/lib/ai/provider";

// URLからコンテンツタイプを判定
function detectType(url: string): ContentItemType {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) return "youtube";
  if (lowerUrl.includes("instagram.com")) return "instagram";
  if (lowerUrl.includes("x.com") || lowerUrl.includes("twitter.com")) return "x";
  if (lowerUrl.includes("note.com")) return "note";
  if (lowerUrl.endsWith(".pdf")) return "pdf";
  if (lowerUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i)) return "image";
  return "website";
}

// YouTube IDの抽出
function extractYouTubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
  return match?.[1];
}

export async function processUrlSave(url: string) {
  const contentType = detectType(url);
  
  // ここで本来は OGP Scraping を実行する（省略）
  // const ogp = await fetchOGP(url);

  const metadata: MemoryMetadata = {
    title: "取得したタイトル",
    description: "取得した概要",
    siteName: "取得したサイト名",
  };

  if (contentType === "youtube") {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      metadata.videoId = videoId;
      metadata.thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      metadata.duration = null; // 将来のAPI連携用
    }
  }

  // YouTubeの場合は専用サムネイルを優先
  const finalThumbnail = contentType === "youtube" 
    ? metadata.thumbnailUrl 
    : (metadata.thumbnailUrl || null);

  return {
    title: metadata.title,
    description: metadata.description,
    siteName: metadata.siteName,
    thumbnailUrl: finalThumbnail,
    contentType,
    metadata
  };
}