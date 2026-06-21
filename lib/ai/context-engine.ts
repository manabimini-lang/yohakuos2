import { prisma } from "@/lib/prisma";
import { CONTENT_ITEM_SAFE_SELECT } from "@/lib/content-item-safe-select";
import { resolveProvider } from "@/lib/ai/provider-resolver";

export type ContextProfile = {
  recurringThemes: string[];
  emergingThemes: string[];
  dormantThemes: string[];
  timelineSummary: string;
};

const CONTEXT_SYSTEM_PROMPT = `あなたはユーザーの学習・思考の文脈（Context）を読み解く伴走AIです。
以下のルールを厳守してください：
- ユーザーの過去90日間のテーマ遷移から、学びの流れを静かに言語化してください。
- 120文字〜200文字程度の短文で、落ち着いたトーンで記述してください。
- 説教、評価、自己啓発、結論づけを避け、「どのような関心が移り変わってきたか」「現在どこに向かおうとしているか」の観察結果のみを伝えてください。
- 形式: プレーンテキストのみ出力してください。`;

export async function generateContextProfile(userId: string): Promise<ContextProfile> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Fetch last 90 days content
  const items = await prisma.contentItem.findMany({
    where: {
      userId,
      createdAt: { gte: ninetyDaysAgo },
    },
    select: CONTENT_ITEM_SAFE_SELECT,
    orderBy: { createdAt: "asc" },
  });

  if (items.length === 0) {
    return {
      recurringThemes: [],
      emergingThemes: [],
      dormantThemes: [],
      timelineSummary: "まだ記録がありません。ここから静かに積み重なっていきます。",
    };
  }

  const recentItems = items.filter(item => new Date(item.createdAt) >= thirtyDaysAgo);
  const olderItems = items.filter(item => new Date(item.createdAt) < thirtyDaysAgo);

  const getTags = (contentList: any[]) => {
    const counts: Record<string, number> = {};
    contentList.forEach(item => {
      (item.aiTags || []).forEach((tag: string) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  };

  const recentTagsCounts = getTags(recentItems);
  const olderTagsCounts = getTags(olderItems);

  const recurringThemes: string[] = [];
  const emergingThemes: string[] = [];
  const dormantThemes: string[] = [];

  const allTagNames = Array.from(new Set([...Object.keys(recentTagsCounts), ...Object.keys(olderTagsCounts)]));

  for (const tag of allTagNames) {
    const recentCount = recentTagsCounts[tag] || 0;
    const olderCount = olderTagsCounts[tag] || 0;

    if (recentCount >= 2 && olderCount >= 2) {
      recurringThemes.push(tag);
    } else if (recentCount >= 2 && olderCount < 2) {
      emergingThemes.push(tag);
    } else if (recentCount === 0 && olderCount >= 2) {
      dormantThemes.push(tag);
    }
  }

  let timelineSummary = "記録が積み重なっています。";

  try {
    const provider = await resolveProvider(userId);
    if (provider) {
      const prompt = `
[抽出されたテーマ]
- 継続的なテーマ: ${recurringThemes.length > 0 ? recurringThemes.join(", ") : "特になし"}
- 最近現れたテーマ: ${emergingThemes.length > 0 ? emergingThemes.join(", ") : "特になし"}
- 過去に関心があったテーマ: ${dormantThemes.length > 0 ? dormantThemes.join(", ") : "特になし"}

[直近の記録の要約プレビュー]
${recentItems.slice(-5).map(item => `- ${item.title || "無題"}: ${item.reflection || item.summary || ""}`).join("\n")}

上記の情報から、ユーザーの学びの流れ（学習文脈）を静かに言語化してください。
      `;

      const generatedSummary = await provider.generateInsight(CONTEXT_SYSTEM_PROMPT, prompt);
      if (generatedSummary) {
        timelineSummary = generatedSummary;
      }
    }
  } catch (error) {
    console.error("[generateContextProfile] Failed to generate timeline summary:", error);
  }

  return {
    recurringThemes: recurringThemes.slice(0, 5),
    emergingThemes: emergingThemes.slice(0, 5),
    dormantThemes: dormantThemes.slice(0, 5),
    timelineSummary,
  };
}
