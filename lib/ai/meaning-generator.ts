import { generateJSON } from "./gemini";
import { ThemeType } from "@prisma/client";
import { parseTheme } from "./parsers";

export interface MeaningResult {
  summary: string;
  tags: string[];
  theme: ThemeType; // YOHAKU v1: Theme Engine が抽出する主要テーマ
}

/**
 * YOHAKU Meaning Generator
 * 記録の文脈を解析し、将来の自分への手がかりを生成します。
 */
export async function generateMeaning(params: {
  title: string;
  description?: string;
  contentType: string;
  metadata: any;
  userId: string;
}): Promise<MeaningResult> {
  // Step 3 & 8: プロンプトと文字数制約
  const prompt = `以下の記録を分析してください。
タイトル: ${params.title}
説明: ${params.description || "なし"}
種類: ${params.contentType}
メタデータ: ${JSON.stringify(params.metadata)}

目的:
後から見返した時に
思い出しやすい記録にすること。

候補テーマ (Enum値で回答): WORK, LEARNING, HEALTH, FAMILY, PARENTING, SIDEBUSINESS, CREATION, AI, ENGLISH, HOBBY, OTHER

出力:
{
  "summary": "50文字以内",
  "tags": "最大5個",
  "theme": "Enum値のいずれか1つ"
}
`;
  const systemInstruction = "あなたは YOHAKU OS の AI です。目的は読むことではなく、思い出すこと。絶対に長文要約せず、50文字以内で出力してください。テーマは必ず指定された大文字の英単語（Enum値）で回答してください。";

  try {
    const result = await generateJSON<MeaningResult>(
      prompt,
      systemInstruction,
      { userId: params.userId }
    );

    return {
      summary: result.data.summary.slice(0, 50),
      tags: result.data.tags.slice(0, 5),
      theme: parseTheme(result.data.theme),
    };
  } catch (error) {
    console.error("[generateMeaning] AI generation error:", error);
    throw error;
  }
}