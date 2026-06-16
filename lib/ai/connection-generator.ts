import { ContentItem, ContextType } from "@prisma/client";
import { generateJSON } from "./gemini";
import { parseContext } from "./parsers";

export interface AIConnectionJudgment {
  targetId: string;
  related: boolean;
  reason: string;
  contextType: ContextType; // YOHAKU v1: Context Engine が抽出する文脈タイプ
}

// AIからのレスポンスを文字列として受け取るための型
interface RawAIConnectionJudgment {
  targetId: string;
  related: boolean;
  reason: string;
  contextType: string;
}

/**
 * 文字列間の簡易的な類似度（共有単語数ベース）
 */
function calculateStringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const setA = new Set(a.split(/[\s,，、。.]+/).filter(s => s.length > 1));
  const setB = new Set(b.split(/[\s,，、。.]+/).filter(s => s.length > 1));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * タグの一致率
 */
function calculateTagSimilarity(tagsA: string[], tagsB: string[]): number {
  if (tagsA.length === 0 || tagsB.length === 0) return 0;
  const setA = new Set(tagsA);
  const setB = new Set(tagsB);
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

/**
 * Step 4: 候補の絞り込み (100件 -> 20件)
 */
export function filterCandidates(current: ContentItem, candidates: ContentItem[]): ContentItem[] {
  const scored = candidates.map(c => {
    const tagSim = calculateTagSimilarity(current.aiTags, c.aiTags);
    const sumSim = calculateStringSimilarity(current.summary || "", c.summary || "");
    const ctxSim = calculateStringSimilarity(current.savedContext || "", c.savedContext || "");
    
    // 仮の初期スコアでソート用に算出
    const initialScore = tagSim * 0.3 + sumSim * 0.5 + ctxSim * 0.2;
    return { item: c, score: initialScore };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(s => s.item);
}

/**
 * Step 5: AI判定
 */
export async function getAIConnectionJudgments(
  current: ContentItem,
  candidates: ContentItem[],
  userId: string
): Promise<AIConnectionJudgment[]> {
  if (candidates.length === 0) return [];

  const prompt = `以下の記録と関連が強い記録を候補リストから探してください。

目的:
後から見返した時に学びや思考の流れを思い出せるようにすること。タグの一致だけでなく、内容の関連性を重視してください。

【対象の記録】
タイトル: ${current.title}
要約: ${current.summary || "なし"}
保存時の理由: ${current.savedContext || "なし"}
タグ: ${current.aiTags.join(", ")}

【候補リスト】
${candidates.map((c) => `ID: ${c.id}\nタイトル: ${c.title}\n要約: ${c.summary || "なし"}`).join("\n---")}

文脈候補 (Enum値で回答): LEARNING, CONTINUITY, CHALLENGE, CREATION, EXPLORATION, HEALTH, FAMILY, WORK, SHARING, REFLECTION

出力: 以下の形式のJSON配列のみ。学習の流れや思考の関連性を優先して判定してください。理由は50文字以内。
[{ "targetId": "ID", "related": boolean, "reason": "理由", "contextType": "Enum値のいずれか1つ" }]
`;

  const systemInstruction = "あなたは YOHAKU OS の AI です。学びのつながりを再発見する手助けをします。文脈タイプ（contextType）は必ず指定された大文字の英単語（Enum値）で回答してください。";

  try {
    const result = await generateJSON<RawAIConnectionJudgment[]>(prompt, systemInstruction, { userId });
    
    return (result.data || [])
      .filter(j => j.related)
      .map(j => ({
        targetId: j.targetId,
        related: j.related,
        reason: j.reason,
        contextType: parseContext(j.contextType),
      }));
  } catch (error) {
    console.error("[getAIConnectionJudgments] error:", error);
    return [];
  }
}

/**
 * Step 6: システム側での最終スコア算出
 */
export function calculateFinalScore(current: ContentItem, target: ContentItem): number {
  const tagSimilarity = calculateTagSimilarity(current.aiTags, target.aiTags);
  const summarySimilarity = calculateStringSimilarity(current.summary || "", target.summary || "");
  const contextSimilarity = calculateStringSimilarity(current.savedContext || "", target.savedContext || "");

  // Step 5: (tagSimilarity * 0.3) + (summarySimilarity * 0.5) + (contextSimilarity * 0.2)
  return (
    tagSimilarity * 0.3 +
    summarySimilarity * 0.5 +
    contextSimilarity * 0.2
  );
}