import { prisma } from "@/lib/prisma";
import { getDefaultProvider } from "@/lib/ai/provider";
import { CONTENT_ITEM_SAFE_SELECT } from "@/lib/content-item-safe-select";

const THEME_EXTRACTOR_SYSTEM_PROMPT = `あなたはユーザーの記録から、長期的なテーマや関心事を静かに抽出するAIです。
以下のルールを絶対厳守してください：
- 最大5つのテーマを抽出すること。
- 分析感を出さず、単なる「名詞」や「短いフレーズ」のリストとして出力すること（例: "学ぶこと", "整理と余白", "人との距離感"）。
- JSON配列のみを出力すること。例: ["テーマ1", "テーマ2"]
- 説教やアドバイスを含めないこと。`;

export async function generateMemorySnapshot(
  userId: string,
  periodDays: number = 30
) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const recentItems = await prisma.contentItem.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
        memoryState: "active",
      },
      select: CONTENT_ITEM_SAFE_SELECT,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    if (recentItems.length === 0) {
      return null;
    }

    // Prepare context for LLM
    const allTags = recentItems.flatMap((item) => item.aiTags);
    const uniqueTags = Array.from(new Set(allTags)).slice(0, 30); // limit to 30 unique tags
    const reflections = recentItems
      .map((item) => item.reflection)
      .filter(Boolean)
      .slice(0, 10); // limit to 10 reflections to avoid token overflow

    const userPrompt = `
過去${periodDays}日間の記録の断片：
タグ: ${uniqueTags.join(", ")}
振り返り: ${reflections.join(" / ")}
    `;

    const provider = getDefaultProvider();
    const rawResult = await provider.generateInsight(
      THEME_EXTRACTOR_SYSTEM_PROMPT,
      userPrompt
    );

    // Try to parse the result as JSON array
    let themes: string[] = [];
    try {
      const parsed = JSON.parse(rawResult);
      if (Array.isArray(parsed)) {
        themes = parsed;
      }
    } catch {
      // Fallback: extract list items if LLM didn't return clean JSON
      themes = rawResult
        .split("\n")
        .map((line) => line.replace(/^[-*•]\s*/, "").trim())
        .filter((line) => line.length > 0 && !line.startsWith("["));
    }

    if (themes.length === 0) return null;

    const periodLabel = `${periodDays}days-${new Date().toISOString().split("T")[0]}`;

    const snapshot = await prisma.memorySnapshot.create({
      data: {
        userId,
        period: periodLabel,
        themes: themes, // Prisma handles JSON conversion for string[]
        reflections: reflections, 
      },
    });

    return snapshot;
  } catch (error) {
    console.error("Failed to generate memory snapshot:", error);
    return null;
  }
}
