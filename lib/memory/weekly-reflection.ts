import { prisma } from "@/lib/prisma";
import { getDefaultProvider } from "@/lib/ai/provider";
import { CONTENT_ITEM_SAFE_SELECT } from "@/lib/content-item-safe-select";

const WEEKLY_REFLECTION_SYSTEM_PROMPT = `あなたはユーザーの1週間の記録を静かに見つめるAIです。
過去7日間の記録から、最近の関心や思考の傾向を「静かな気付き」として言語化してください。

以下のルールを絶対厳守すること：
- 最大80文字程度で短く簡潔に。
- 説教、自己改善の提案、分析感（「あなたは〜という傾向があります」）を出さない。
- ユーザーに直接語りかける「コーチング感」を排除する。
- ユーザーの心理状態を診断しない（「ストレスを感じているようです」は禁止）。
- 必ず「最近、『〇〇』という言葉が静かに増えているようです。」のような、事実ベースで控えめなトーンを維持する。

出力例:
- 「最近、『整理したい』という感覚を何度か残しているようです。」
- 「この1週間、『学ぶ』という言葉が静かに増えているようです。」
- 「最近の余白には、『人との距離感』についての思考が集まっています。」`;

export async function generateWeeklyReflection(userId: string) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const recentItems = await prisma.contentItem.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
        memoryState: "active",
      },
      select: CONTENT_ITEM_SAFE_SELECT,
      orderBy: { createdAt: "desc" },
    });

    if (recentItems.length < 3) {
      // Not enough data for a meaningful weekly reflection
      return null;
    }

    const allTags = recentItems.flatMap((item) => item.aiTags);
    const uniqueTags = Array.from(new Set(allTags));
    const reflections = recentItems.map((item) => item.reflection).filter(Boolean);

    const userPrompt = `
過去7日間の記録:
タグ: ${uniqueTags.join(", ")}
振り返り: ${reflections.join(" / ")}
`;

    const provider = getDefaultProvider();
    const reflection = await provider.generateInsight(
      WEEKLY_REFLECTION_SYSTEM_PROMPT,
      userPrompt
    );

    return reflection || null;
  } catch (error) {
    console.error("Failed to generate weekly reflection:", error);
    return null;
  }
}
