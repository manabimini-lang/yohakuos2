/**
 * YOHAKU AI Provider Abstraction Layer
 *
 * YOHAKUのAI機能は「意味抽出API」として設計されています。
 * 会話・チャット中心ではなく、静かな知識の整理補助として機能します。
 *
 * 将来的な差し替え（OpenAI、Claude、BYOK、LocalLLM）を見据え、
 * すべてのAI呼び出しはこのインターフェースを通じて行うこと。
 */

// ===================================================
// AI Provider Interface
// ===================================================

export interface SummarizeOptions {
  maxChars?: number; // Default: 120
  language?: "ja" | "en"; // Default: "ja"
}

export interface SummarizeResult {
  summary: string;
  suggestedTitle: string;
}

export interface TagOptions {
  maxTags?: number; // Default: 5
  minTags?: number; // Default: 3
}

export type ContentItemType =
  | "youtube"
  | "instagram"
  | "x"
  | "note"
  | "article"
  | "pdf"
  | "image"
  | "website";

// Memory Object Metadata structure
export interface MemoryMetadata {
  title?: string;
  description?: string;
  siteName?: string;
  thumbnailUrl?: string | null;
  author?: string;
  publishedAt?: string;
  duration?: string | null; // For YouTube, nullable for future API
  videoId?: string; // For YouTube
  channelName?: string; // For YouTube
  isReel?: boolean; // For Instagram
  tweetText?: string; // For X
  pageCount?: number; // For PDF
}

// Future Expansion Interfaces (Phase 7+)
export interface MemoryExpansion {
  hoverPreview?: string; // URL to a small preview video or GIF
  livePreview?: boolean; // If true, can be rendered as an iframe
  aiSummaryOverlay?: string; // Content summarized by AI to overlay
  memoryConnections?: string[]; // IDs of related memories
}

export interface AIProvider {
  /**
   * 短文要約（最大120文字）
   * トーン：落ち着いた、誇張しない、知的
   */
  summarize(text: string, options?: SummarizeOptions): Promise<SummarizeResult>;

  /**
   * タグ生成（3〜5個）
   * 淡色のPill UIで表示するための控えめなタグ
   */
  generateTags(text: string, options?: TagOptions): Promise<string[]>;

  /**
   * コンテンツ種類判定
   * URLや本文からコンテンツの種類を推定する
   */
  classify(text: string, url?: string): Promise<ContentItemType>;

  /**
   * テキスト埋め込みベクトル生成
   * 将来の類似検索・人生テーマ分析に使用
   */
  embed(text: string): Promise<number[]>;

  /**
   * インサイト生成 (Phase 3 Memory Layer)
   * コーチング感や分析感を出さず、「静かな再発見」を促す文章を生成する
   */
  generateInsight(systemPrompt: string, userPrompt: string): Promise<string>;

  /**
   * プロバイダー識別情報
   */
  readonly name: string;
  readonly embeddingModel: string;
  readonly embeddingDimensions: number;
  readonly version: string;
}

// ===================================================
// Provider Registry
// ===================================================

let defaultProvider: AIProvider | null = null;

export function setDefaultProvider(provider: AIProvider) {
  defaultProvider = provider;
}

export function getDefaultProvider(): AIProvider {
  if (!defaultProvider) {
    throw new Error(
      "AI Provider not initialized. Call setDefaultProvider() first."
    );
  }
  return defaultProvider;
}
