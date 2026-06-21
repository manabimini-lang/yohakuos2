/**
 * Generates a quiet, reflective script based on recent content patterns.
 * 
 * Philosophy:
 * - Not analytical or instructional
 * - Not motivation or coaching
 * - Simply observational, breathing space
 * - Invites contemplation, not action
 * - Evening tone: gentle, paced, lingering
 * 
 * Targets: 1-2 paragraphs, 3-8 min read (for TTS)
 */

import { prisma } from "@/lib/prisma";
import { CONTENT_ITEM_SAFE_SELECT } from "@/lib/content-item-safe-select";
import { generateContextProfile, type ContextProfile } from "@/lib/ai/context-engine";
import { resolveProvider } from "@/lib/ai/provider-resolver";

interface ReflectionScriptOptions {
  userId: string;
  contentItemId?: string;
  themes?: string[];
  contextProfile?: ContextProfile;
}

const NARRATIVE_SYSTEM_PROMPT = `あなたはユーザーの「学びの軌跡を映す鏡」としてのAIです。教師、コーチ、評価者ではありません。
保存されたコンテンツの単なる要約ではなく、ユーザー自身の学習文脈（学びの履歴）のナラティブを語ってください。

【出力構造の厳守】
出力は必ず以下の3つの要素を含め、自然な文章で繋いでください：
1. 続いているテーマ（過去90日で繰り返し現れるテーマ）
2. 変化しているテーマ（興味関心の変化や発展）
3. 今回の記録の位置づけ（今回保存した内容が学習履歴のどこに位置するか）

【禁止事項（厳守）】
- 説教（例：「もっと頑張りましょう」）
- 自己啓発（例：「あなたには無限の可能性があります」）
- 強い断定（例：「あなたの人生のテーマは教育です」）
- AIコーチ化（例：「次はこれを学びましょう」）
- 箇条書きや「1. 続いているテーマ」などの見出しを使わず、自然な段落の文章にすること

【YOHAKUのトーン】
- 静かで、間のある、落ち着いたトーン。
- ユーザーに気づきを押し付けず、そっと鏡のように見せるだけ。`;

export async function generateReflectionScript(
  options: ReflectionScriptOptions
): Promise<string> {
  const { userId, contentItemId, contextProfile: providedProfile } = options;

  let contextProfile = providedProfile;
  if (!contextProfile) {
    contextProfile = await generateContextProfile(userId);
  }

  let currentContentStr = "（今回は新しく保存された記録の特定はありません）";
  if (contentItemId) {
    const item = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
      select: CONTENT_ITEM_SAFE_SELECT,
    });
    if (item) {
      currentContentStr = `[今回の記録]
タイトル: ${item.title || "無題"}
Reflection（保存理由）: ${item.reflection || "なし"}
要約: ${item.summary || "なし"}
付与されたタグ: ${(item.aiTags || []).join(", ")}`;
    }
  }

  const prompt = `
[これまでの学びの文脈 (Context Profile)]
- 続いているテーマ: ${contextProfile.recurringThemes.join(", ") || "特になし"}
- 変化・現れ始めたテーマ: ${contextProfile.emergingThemes.join(", ") || "特になし"}
- 過去のテーマ: ${contextProfile.dormantThemes.join(", ") || "特になし"}
- 全体的なタイムライン要約: ${contextProfile.timelineSummary}

${currentContentStr}

上記の文脈から、ユーザーの学びの軌跡を映す静かなナラティブを生成してください。
`;

  try {
    const provider = await resolveProvider(userId);
    if (!provider) {
      return "静かに記録が積み重なっています。";
    }
    const narrative = await provider.generateInsight(NARRATIVE_SYSTEM_PROMPT, prompt);
    if (narrative) {
      return narrative;
    }
  } catch (error) {
    console.error("[generateReflectionScript] Failed to generate narrative:", error);
  }

  // Fallback
  return "静かに記録が積み重なっています。時間をかけて、点と点が線になっていくのを感じてみてください。";
}
