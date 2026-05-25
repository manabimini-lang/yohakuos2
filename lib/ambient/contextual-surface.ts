import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gemini";
import { CalmRecommendation, SurfaceContext } from "./types";
import { CONTEXTUAL_SURFACE_PROMPT } from "./prompts";

export async function getSurfaceContext(userId: string): Promise<SurfaceContext> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [themes, energies, road, lastInsight] = await Promise.all([
        prisma.meaningSignal.findFirst({
            where: { userId, confidence: { gte: 0.3 } },
            orderBy: { createdAt: "desc" },
            select: { description: true },
        }),
        prisma.energyState.findMany({
            where: { userId, createdAt: { gte: sevenDaysAgo } },
            orderBy: { createdAt: "desc" },
            take: 3,
            select: { state: true },
        }),
        prisma.roadHistory.findFirst({
            where: { userId, endedAt: null },
            orderBy: { startedAt: "desc" },
            select: { roadTitle: true },
        }),
        prisma.ambientInsight.findFirst({
            where: { userId },
            orderBy: { surfacedAt: "desc" },
            select: { surfacedAt: true },
        }),
    ]);

    const month = new Date().getMonth() + 1;
    const season = month >= 3 && month <= 5 ? "spring" :
        month >= 6 && month <= 8 ? "summer" :
            month >= 9 && month <= 11 ? "autumn" : "winter";

    return {
        currentTheme: themes?.description?.slice(0, 100) || null,
        currentEmotion: energies[0]?.state || null,
        activeRoad: road?.roadTitle || null,
        currentSeason: season,
        recentReflections: energies.length,
        recentEnergies: energies.map((e) => e.state),
        lastInsightAt: lastInsight?.surfacedAt || null,
    };
}

export async function generateCalmRecommendations(
    userId: string,
    context: SurfaceContext
): Promise<CalmRecommendation[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [reflections, memories] = await Promise.all([
        prisma.reflection.findMany({
            where: { userId, createdAt: { gte: thirtyDaysAgo } },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { title: true, content: true },
        }),
        prisma.userMemory.findMany({
            where: { userId, confidence: { gte: 0.5 } },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { type: true, title: true, content: true },
        }),
    ]);

    if (reflections.length < 2) {
        return [{
            type: "space",
            title: "静かな余白",
            content: "何か心に浮かぶことがあれば、それが今日のテーマかもしれません。",
            sourceId: null,
            sourceType: null,
            confidence: 0.3,
        }];
    }

    const dataForPrompt = [
        "【現在の文脈】",
        `テーマ: ${context.currentTheme || "特に特定なし"}`,
        `エネルギー: ${context.currentEmotion || "不明"}`,
        `ロード: ${context.activeRoad || "なし"}`,
        `季節: ${context.currentSeason}`,
        "",
        "【最近の内省】",
        ...reflections.map((r) => `- ${r.title || ""}: ${(r.content || "").slice(0, 100)}`),
        "",
        "【重要な記憶】",
        ...memories.map((m) => `- [${m.type}] ${m.title}: ${m.content.slice(0, 80)}`),
    ].join("\n");

    const prompt = `以下のユーザーの現在の文脈と過去データから、静かな繋がりを提案してください。

${dataForPrompt}

以下のJSON形式で返してください:
{
  "recommendations": [
    {
      "type": "connection | space | question | reflection | echo",
      "title": "短いタイトル",
      "content": "静かな気づきや問い（100文字以内）",
      "sourceType": "reflection | memory | seasonal",
      "confidence": 0.5
    }
  ]
}

注意:
- 強制する提案はしない
- 「〜かもしれません」というトーン
- 最大3つまで`;

    const { text } = await generateText(prompt, CONTEXTUAL_SURFACE_PROMPT);

    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return [];
        const parsed = JSON.parse(jsonMatch[0]);
        return (parsed.recommendations || []).map((r: any) => ({
            type: r.type,
            title: r.title,
            content: r.content,
            sourceId: null,
            sourceType: r.sourceType || null,
            confidence: r.confidence || 0.3,
        }));
    } catch {
        return [];
    }
}