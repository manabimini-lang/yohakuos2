import { generateJSON, generateText, getApiCredentials } from "./gemini";
import type {
  AIProvider,
  ContentItemType,
  SummarizeOptions,
  SummarizeResult,
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

// Summarize system prompt — 落ち着いたトーン、意味（なぜ残したか）を重視
const SUMMARIZE_SYSTEM = `あなたは静かな知識整理の補助AIです。
以下のルールを厳守してください：

- 最大120文字で要約する
- 単なるコンテンツの内容要約ではなく、「なぜユーザーがこれを残したか（Reflection）」の文脈を最優先に考慮した要約にすること
- 例：コンテンツが「AI教育の記事」で、Reflectionが「子ども向け学習設計に活かしたい」の場合、出力は「AI時代の学習設計や子どもの学び方を考えるための記録」とする
- 断定的、感情的な表現を避ける
- YouTube的な煽り表現（「衝撃」「神回」「必見」等）や、AI特有の仰々しい表現を使わない
- 知的で落ち着いたトーンで記述する
- 日本語で出力する
- JSONのみを出力する
- 形式は {"summary":"...","suggestedTitle":"..."} とする
- summary は要約のみ、suggestedTitle は短い題名候補とする`;

// Tagger system prompt
const TAGGER_SYSTEM = `あなたは静かな知識整理の補助AIです。
入力されたテキスト（Reflection、タイトル、本文）から3〜5個のタグを抽出してください。

ルール：
- 3〜5個のタグを抽出する
- 優先順位は「ユーザーの保存理由 (Reflection)」 > 「本文」 > 「タイトル」とする
- タグはシンプルで汎用的なキーワード（#AI #思考整理 #教育 等）
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
- image
- x
- instagram
- website

JSONのみ出力: {"type": "article"}`;

export class GeminiProvider implements AIProvider {
  readonly name = PROVIDER_NAME;
  readonly embeddingModel = EMBEDDING_MODEL;
  readonly embeddingDimensions = EMBEDDING_DIMENSIONS;
  readonly version = PROVIDER_VERSION;

  private userId?: string;
  private apiKey?: string;
  private customModel?: string;

  constructor(options?: string | { userId?: string; apiKey?: string; model?: string }) {
    if (typeof options === "string") {
      this.userId = options;
    } else if (options) {
      this.userId = options.userId;
      this.apiKey = options.apiKey;
      this.customModel = options.model;
    }
  }

  public getRequestOptions() {
    return {
      userId: this.userId,
      apiKey: this.apiKey,
      modelName: this.customModel,
    };
  }

  async summarize(text: string, options?: SummarizeOptions): Promise<SummarizeResult> {
    const maxChars = options?.maxChars ?? 120;
    const prompt = `以下のテキストを最大${maxChars}文字で要約してください。要約と題名候補を返してください。\n\n${text.slice(0, 3000)}`;

    try {
      const result = await generateJSON<{
        summary?: string;
        suggestedTitle?: string;
      }>(prompt, SUMMARIZE_SYSTEM, this.getRequestOptions());
      const summary = this.normalizeSummary(result.data?.summary ?? text, maxChars);
      const suggestedTitle = this.normalizeSuggestedTitle(
        result.data?.suggestedTitle ?? summary
      );
      return { summary, suggestedTitle };
    } catch (error) {
      console.error("[GeminiProvider.summarize] error:", error);
      return {
        summary: this.normalizeSummary(text, maxChars),
        suggestedTitle: this.normalizeSuggestedTitle(text),
      };
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
        this.getRequestOptions()
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
        return "x";
      if (urlLower.includes("instagram.com")) return "instagram";
    }

    // AI-based classification for ambiguous cases
    const prompt = `URL: ${url ?? "不明"}\n\nテキスト:\n${text.slice(0, 1000)}`;

    try {
      const result = await generateJSON<{ type: ContentItemType }>(
        prompt,
        CLASSIFIER_SYSTEM,
        this.getRequestOptions()
      );
      return result.data?.type ?? "website";
    } catch (error) {
      console.error("[GeminiProvider.classify] error:", error);
      return "website";
    }
  }

  async embed(text: string): Promise<number[]> {
    // Get credentials using the unified utility
    const creds = await getApiCredentials(this.getRequestOptions());
    const apiKey = creds.apiKey;

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
      const result = await generateText(userPrompt, systemPrompt, this.getRequestOptions());
      return result.text.trim();
    } catch (error) {
      console.error("[GeminiProvider.generateInsight] error:", error);
      return "";
    }
  }

  private normalizeSummary(text: string, maxChars: number): string {
    return text.trim().replace(/\s+/g, " ").slice(0, maxChars);
  }

  private normalizeSuggestedTitle(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 48);
  }
}

/**
 * Singleton factory for server-side usage.
 * Instantiated per-request with optional userId.
 */
export function createGeminiProvider(options?: string | { userId?: string; apiKey?: string; model?: string }): GeminiProvider {
  return new GeminiProvider(options);
}
