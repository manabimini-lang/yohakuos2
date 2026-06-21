import { prisma } from "@/lib/prisma";
import { resolveProvider } from "@/lib/ai/provider-resolver";
import type { ContextProfile } from "@/lib/ai/context-engine";

export type LearningCompass = {
  northStar: string;
  recurringThemes: string[];
  emergingThemes: string[];
  suggestedDirections: string[];
};

export interface GenerateCompassOptions {
  userId: string;
  contextProfile: ContextProfile;
  recentContent: any[];
  pastContent: any[];
  reflectionHistory: any[];
  learningJourney?: string;
}

const COMPASS_SYSTEM_PROMPT = `あなたはユーザーの「学びの羅針盤」として機能するAIです。
教師、メンター、コンサルタントではありません。目標管理ツールやキャリア診断でもありません。
「何を学べばいいか」を指示するのではなく、「自分は何に惹かれ続けているのか（学びの方向性）」を静かに映し出してください。

【出力構造】
必ず以下の構造を持つJSONを出力してください。
{
  "northStar": "今の学習文脈から見える仮説（例：人はどうすれば学び続けられるかという問いへの関心）",
  "recurringThemes": ["継続しているテーマ1", "継続しているテーマ2"],
  "emergingThemes": ["新たに現れたテーマ1", "新たに現れたテーマ2"],
  "suggestedDirections": ["興味の延長線上で自然につながりそうなテーマ1", "テーマ2"]
}

【禁止事項（厳守）】
- 「あなたは教育者になるべきです」のような人生の目的の決定や強い断定
- 「次はこれを学びましょう」「成功するには〇〇が必要です」といった指示・アドバイス
- 説教や自己啓発的な表現

【コンテンツとロードマップの接続】
- 過去の記録（pastContent）と現在の関心がどう静かにつながっているかを見出し、反映させてください。
- 「新しい方向性（suggestedDirections）」は、必ず【利用可能な学習ロードマップ】の中から、ユーザーの文脈に合うものを選択または参考にしてください。外部検索による一般的なアドバイスはしないでください。`;

export async function generateLearningCompass(
  options: GenerateCompassOptions
): Promise<LearningCompass | null> {
  const { userId, contextProfile, recentContent, pastContent, reflectionHistory, learningJourney } = options;

  try {
    const provider = await resolveProvider(userId);
    if (!provider) return null;

    // Fetch active roads (learning roadmaps created by admin)
    const activeRoads = await prisma.road.findMany({
      where: { isActive: true },
      select: { title: true, description: true },
    });

    const roadsContext = activeRoads.length > 0 
      ? activeRoads.map(r => `- ${r.title}: ${r.description}`).join("\n")
      : "現在登録されているロードマップはありません。";

    // Format inputs for prompt
    const recentContentStr = recentContent.slice(0, 5).map(c => `- ${c.title || '無題'} (${c.summary || ''})`).join("\n");
    const pastContentStr = pastContent.slice(0, 5).map(c => `- ${c.title || '無題'} (${c.summary || ''})`).join("\n");
    
    const prompt = `
[これまでの学びの文脈 (Context Profile)]
- 続いているテーマ: ${contextProfile.recurringThemes.join(", ")}
- 現れ始めたテーマ: ${contextProfile.emergingThemes.join(", ")}
- 全体的なタイムライン: ${contextProfile.timelineSummary}

[直近の記録 (Recent Content)]
${recentContentStr || "なし"}

[過去の記録 (Past Content)]
${pastContentStr || "なし"}

[利用可能な学習ロードマップ (Admin Registered Roads)]
${roadsContext}

上記の蓄積された記録から、ユーザーが何に繰り返し惹かれているか、何が深まりつつあるか、何が新しく芽生えているかを抽出し、JSON形式で学びの方向性（Learning Compass）を出力してください。
過去の特定の記録が現在の関心と繋がっている場合は、northStarや文脈にそっと反映させてください。
`;

    // Attempt to generate JSON
    const resultText = await provider.generateInsight(COMPASS_SYSTEM_PROMPT, prompt);
    if (!resultText) return null;

    // Parse JSON
    try {
      const cleanedText = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
      const compassData = JSON.parse(cleanedText);
      return {
        northStar: compassData.northStar || "",
        recurringThemes: Array.isArray(compassData.recurringThemes) ? compassData.recurringThemes : [],
        emergingThemes: Array.isArray(compassData.emergingThemes) ? compassData.emergingThemes : [],
        suggestedDirections: Array.isArray(compassData.suggestedDirections) ? compassData.suggestedDirections : [],
      };
    } catch (parseError) {
      console.error("[generateLearningCompass] Failed to parse JSON:", parseError);
      return null;
    }
  } catch (error) {
    console.error("[generateLearningCompass] Error:", error);
    return null;
  }
}
