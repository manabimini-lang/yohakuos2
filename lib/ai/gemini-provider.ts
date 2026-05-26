import { generateJSON, generateText } from "./gemini";
import type {
  AIProvider,
  ContentItemType,
  SummarizeOptions,
  TagOptions,
} from "./provider";

// ===================================================
// YOHAKU Gemini Provider
// ===================================================
// "意味をそっと整える存在" として実装。
// 派手な生成AIではなく、静かな知識整理補助として機能します。
// ===================================================

const PROVIDER_NAME = "gemini";
const EMBEDDING_MODEL = "text-embedding-004";
const EMBEDDING_DIMENSIONS = 768;
const PROVIDER_VERSION = "1.0";

// Summarize system prompt — 落ち着いたトーン、煽り禁止
const SUMMARIZE_SYSTEM = `あなたは静かな知識整理の補助AIです。
以下のルールを厳守してください：

- 最大120文字で要約する
- 断定的、感情的な表現を避ける
- YouTube的な煽り表現（「衝撃」「神回」「必見」等）を使わない
- 知的で落ち着いたトーンで記述する
- 日本語で出力する
- 要約のみを出力し、余計な説明を加えない`;

// Tagger system prompt
const TAGGER_SYSTEM = `あなたは静かな知識整理の補助AIです。
テキストから3〜5個のタグを抽出してください。

ルール：
- 3〜5個のタグを抽出する
- タグはシンプルで汎用的なキーワード（#AI #思考整理 #哲学 等）
- 日本語を優先するが、英語固有名詞はそのまま使う
- 煽り的・感情的なタグは使わない
- JSON配列のみを出力する: ["タグ1", "タグ2", "タグ3"]`;

// Classifier system prompt
const CLASSIFIER_SYSTEM = `URLとテキストからコンテンツの種類を1つ選んでください。

種類（必ずこの中から選ぶ）:
- youtube
- note
- article
- pdf
- x_post
- instagram
- other

JSONのみ出力: {"type": "article"}`;

export class GeminiProvider implements AIProvider {
  readonly name = PROVIDER_NAME;
  readonly embeddingModel = EMBEDDING_MODEL;
  readonly embeddingDimensions = EMBEDDING_DIMENSIONS;
  readonly version = PROVIDER_VERSION;

  private userId?: string;

  constructor(userId?: string) {
    this.userId = userId;
  }

  async summarize(text: string, options?: SummarizeOptions): Promise<string> {
    const maxChars = options?.maxChars ?? 120;
    const prompt = `以下のテキストを最大${maxChars}文字で要約してください：\n\n${text.slice(0, 3000)}`;

    try {
      const result = await generateText(prompt, SUMMARIZE_SYSTEM, this.userId);
      return result.text.trim().slice(0, maxChars);
    } catch (error) {
      console.error("[GeminiProvider.summarize] error:", error);
      return "";
    }
  }

  async generateTags(text: string, options?: TagOptions): Promise<string[]> {
    const maxTags = options?.maxTags ?? 5;
    const minTags = options?.minTags ?? 3;
    const prompt = `以下のテキストから${minTags}〜${maxTags}個のタグを抽出してください：\n\n${text.slice(0, 2000)}`;

    try {
      const result = await generateJSON<string[]>(
        prompt,
        TAGGER_SYSTEM,
        this.userId
      );
      const tags = Array.isArray(result.data) ? result.data : [];
      return tags.slice(0, maxTags);
    } catch (error) {
      console.error("[GeminiProvider.generateTags] error:", error);
      return [];
    }
  }

  async classify(text: string, url?: string): Promise<ContentItemType> {
    // URL-based classification first (fast path — no AI needed)
    if (url) {
      const urlLower = url.toLowerCase();
      if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be"))
        return "youtube";
      if (urlLower.includes("note.com")) return "note";
      if (urlLower.includes("twitter.com") || urlLower.includes("x.com"))
        return "x_post";
      if (urlLower.includes("instagram.com")) return "instagram";
    }

    // AI-based classification for ambiguous cases
    const prompt = `URL: ${url ?? "不明"}\n\nテキスト:\n${text.slice(0, 1000)}`;

    try {
      const result = await generateJSON<{ type: ContentItemType }>(
        prompt,
        CLASSIFIER_SYSTEM,
        this.userId
      );
      return result.data?.type ?? "other";
    } catch (error) {
      console.error("[GeminiProvider.classify] error:", error);
      return "other";
    }
  }

  async embed(text: string): Promise<number[]> {
    // Gemini embedding via REST API (the @google/generative-ai SDK supports this)
    const apiKey =
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("[GeminiProvider.embed] No API key, skipping embedding");
      return [];
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: `models/${EMBEDDING_MODEL}`,
            content: {
              parts: [{ text: text.slice(0, 2048) }],
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status}`);
      }

      const data = await response.json();
      return data.embedding?.values ?? [];
    } catch (error) {
      console.error("[GeminiProvider.embed] error:", error);
      return [];
    }
  }

  async generateInsight(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const result = await generateText(userPrompt, systemPrompt, this.userId);
      return result.text.trim();
    } catch (error) {
      console.error("[GeminiProvider.generateInsight] error:", error);
      return "";
    }
  }
}

/**
 * Singleton factory for server-side usage.
 * Instantiated per-request with optional userId.
 */
export function createGeminiProvider(userId?: string): GeminiProvider {
  return new GeminiProvider(userId);
}
