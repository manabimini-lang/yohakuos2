// ===================================================
// YOHAKU Life OS — Seasonal Reflection Engine
// ===================================================
//
// 週次・月次・季節・半年・年次の振り返りを生成。
// 「振り返り」を目的化せず、人生のリズムを静かに観察する。
//
// 設計原則:
// - 「成果」ではなく「質」を記述
// - データが少なくても「静かな期間でしたね」と受け止める
// - 過剰な評価・分析禁止
//

import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gemini";
import { SeasonalReflectionData, GoalReflectionData, getCurrentSeasonalPeriod, getPreviousSeasonalPeriod } from "./types";
import { SEASONAL_SYSTEM_PROMPT, DIRECTION_SYSTEM_PROMPT } from "./prompts";
import { getLifeTimelineStats } from "./timeline";
import { analyzeEnergyTrend } from "./energy";
import { getMeaningSignals } from "./meaning";

/**
 * 季節振り返りを生成
 */
export async function generateSeasonalReflection(
    userId: string,
    type: "weekly" | "monthly" | "seasonal" | "half_year" | "yearly"
): Promise<SeasonalReflectionData> {
    const now = new Date();
    const periods = getReflectionPeriod(type, now);

    // 1. データ収集
    const [stats, energyTrend, meanings] = await Promise.all([
        getLifeTimelineStats(userId, periods.startDate, periods.endDate),
        analyzeEnergyTrend(userId, Math.max(7, Math.ceil((now.getTime() - periods.startDate.getTime()) / (1000 * 60 * 60 * 24)))),
        getMeaningSignals(userId, 10, 0.2),
    ]);

    const periodLabel = getPeriodLabel(type);

    // データが少なすぎる場合はAIを使わずシンプルに返す
    if (stats.totalEntries < 3) {
        const endLabel = now.toLocaleDateString("ja-JP");
        return {
            period: periods.period,
            season: periods.season,
            year: now.getFullYear(),
            summary: `${periodLabel}（${endLabel}まで）は、静かな期間でした。`,
            themes: [],
            characteristics: ["特に目立ったアクティビティはありませんでした"],
            quietQuestions: ["この期間、心に残っていることはありますか？"],
            confidence: 0.3,
            startDate: periods.startDate,
            endDate: periods.endDate,
        };
    }

    const dataForPrompt = [
        `【期間】${periodLabel}（${periods.startDate.toLocaleDateString("ja-JP")} - ${periods.endDate.toLocaleDateString("ja-JP")}）`,
        "",
        "【アクティビティ統計】",
        `- 総エントリー数: ${stats.totalEntries}`,
        `- 1日平均: ${stats.dailyAverage}`,
        `- 内省: ${stats.byType.reflection}件`,
        `- 学び: ${stats.byType.learning}件`,
        `- 会話: ${stats.byType.conversation}件`,
        `- エネルギー記録: ${stats.byType.energy}件`,
        "",
        "【エネルギー傾向】",
        energyTrend.dominantState
            ? `- 主な状態: ${energyTrend.dominantState} (平均強度: ${energyTrend.averageIntensity}/10)`
            : "- エネルギー記録はありません",
        energyTrend.shiftIndication ? `- 変化: ${energyTrend.shiftIndication}` : "",
        "",
        "【意味シグナル】",
        ...meanings.map((s) => `- [${s.signalType}] ${s.description.slice(0, 100)}`),
    ].filter(Boolean).join("\n");

    const prompt = `以下のユーザーデータから、この期間の振り返りを生成してください。

${dataForPrompt}

以下のJSON形式で返してください:
{
  "summary": "期間全体のサマリー（3-5文）",
  "themes": ["テーマ1", "テーマ2"],
  "characteristics": ["特徴1", "特徴2"],
  "quietQuestions": ["次の期間への静かな問い1", "問い2"],
  "confidence": 0.5
}

注意:
- 断定しない。「〜かもしれません」「〜の兆しがあります」という表現を使う
- データが少ない場合も、無理に多くの情報を生成しない
- 「良かった/悪かった」の評価ではなく、事実と兆しを記述する
- 静かな問いは、答えを要求する質問ではない`;

    const { text } = await generateText(prompt, SEASONAL_SYSTEM_PROMPT);

    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON");
        const parsed = JSON.parse(jsonMatch[0]);

        // 結果をDBに保存
        const seasonalPeriod = getCurrentSeasonalPeriod();
        await prisma.seasonalSummary.upsert({
            where: {
                userId_period: { userId, period: periods.period },
            },
            update: {
                summary: parsed.summary || "",
                themes: parsed.themes || [],
                confidence: parsed.confidence || 0.4,
            },
            create: {
                userId,
                period: periods.period,
                season: periods.season,
                year: now.getFullYear(),
                summary: parsed.summary || "",
                themes: parsed.themes || [],
                confidence: parsed.confidence || 0.4,
                startDate: periods.startDate,
                endDate: periods.endDate,
            },
        });

        return {
            period: periods.period,
            season: periods.season,
            year: now.getFullYear(),
            summary: parsed.summary || "",
            themes: parsed.themes || [],
            characteristics: parsed.characteristics || [],
            quietQuestions: parsed.quietQuestions || [],
            confidence: parsed.confidence || 0.4,
            startDate: periods.startDate,
            endDate: periods.endDate,
        };
    } catch {
        return {
            period: periods.period,
            season: periods.season,
            year: now.getFullYear(),
            summary: "この期間の振り返りを生成できませんでした。データが不足している可能性があります。",
            themes: [],
            characteristics: [],
            quietQuestions: ["どんな期間でしたか？"],
            confidence: 0.2,
            startDate: periods.startDate,
            endDate: periods.endDate,
        };
    }
}

/**
 * 方向性リフレクション（Goal Reflectionの代わり）
 * TODO管理ではなく、方向性・意図・価値観・静かな願いを扱う
 */
export async function generateDirectionReflection(
    userId: string
): Promise<GoalReflectionData> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [recentMemories, recentReflections, recentEnergies, existingDirections] =
        await Promise.all([
            prisma.userMemory.findMany({
                where: { userId, confidence: { gte: 0.4 }, createdAt: { gte: thirtyDaysAgo } },
                orderBy: { createdAt: "desc" },
                take: 10,
                select: { type: true, title: true, content: true },
            }),
            prisma.reflection.findMany({
                where: { userId, createdAt: { gte: thirtyDaysAgo } },
                orderBy: { createdAt: "desc" },
                take: 10,
                select: { title: true, content: true },
            }),
            prisma.energyState.findMany({
                where: { userId, createdAt: { gte: thirtyDaysAgo } },
                orderBy: { createdAt: "desc" },
                take: 10,
                select: { state: true, note: true },
            }),
            prisma.directionReflection.findMany({
                where: { userId, period: "current" },
                orderBy: { createdAt: "desc" },
                take: 3,
                select: { direction: true, intention: true, values: true },
            }),
        ]);

    const dataPoints = recentMemories.length + recentReflections.length;
    if (dataPoints < 3) {
        return {
            direction: "",
            intention: "",
            values: [],
            quietWish: null,
            alignment: 0,
            confidence: 0.1,
        };
    }

    const dataForPrompt = [
        "【最近の気づき】",
        ...recentMemories.map((m) => `- [${m.type}] ${m.title}: ${m.content.slice(0, 100)}`),
        "",
        "【最近の内省】",
        ...recentReflections.map((r) => `- ${r.title || ""}: ${(r.content || "").slice(0, 100)}`),
        "",
        "【エネルギー状態】",
        ...recentEnergies.map((e) => `- ${e.state}: ${e.note || ""}`),
        "",
        "【既存の方向性】",
        ...existingDirections.map((d) => `- ${d.direction.slice(0, 100)}`),
    ].join("\n");

    const prompt = `以下のユーザーデータから、現在の人生の方向性を静かに考察してください。

${dataForPrompt}

以下のJSON形式で返してください。注意：断定禁止です。
{
  "direction": "現在の方向性（100文字以内）",
  "intention": "大切にしたい意図（100文字以内）",
  "values": ["価値観1", "価値観2"],
  "quietWish": "静かな願いがあれば（任意）",
  "alignment": 0.7,
  "confidence": 0.5
}

alignmentは「最近の行動と大切にしたい方向の一致度」を0.0-1.0で表します。
データが少ない場合は低めに設定してください。`;

    const { text } = await generateText(prompt, DIRECTION_SYSTEM_PROMPT);

    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON");
        const parsed = JSON.parse(jsonMatch[0]);

        const alignment = Math.max(0, Math.min(1, parsed.alignment || 0.5));

        // Save to DB
        await prisma.directionReflection.create({
            data: {
                userId,
                direction: parsed.direction || "",
                intention: parsed.intention || "",
                values: parsed.values || [],
                quietWish: parsed.quietWish || null,
                period: "current",
                confidence: parsed.confidence || 0.3,
            },
        });

        return {
            direction: parsed.direction || "",
            intention: parsed.intention || "",
            values: parsed.values || [],
            quietWish: parsed.quietWish || null,
            alignment,
            confidence: parsed.confidence || 0.3,
        };
    } catch {
        return {
            direction: "",
            intention: "",
            values: [],
            quietWish: null,
            alignment: 0,
            confidence: 0.1,
        };
    }
}

// ===================================================
// Helper Functions
// ===================================================

function getReflectionPeriod(
    type: "weekly" | "monthly" | "seasonal" | "half_year" | "yearly",
    now: Date
): { startDate: Date; endDate: Date; period: string; season: string } {
    const endDate = new Date(now);

    let startDate: Date;
    let period: string;
    let season: string;

    switch (type) {
        case "weekly":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            period = `weekly_${now.toISOString().slice(0, 10)}`;
            season = getSeasonName(now);
            break;
        case "monthly":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            period = `monthly_${now.getFullYear()}_${now.getMonth() + 1}`;
            season = getSeasonName(now);
            break;
        case "seasonal":
            const seasonal = getCurrentSeasonalPeriod();
            startDate = seasonal.startDate;
            period = seasonal.period;
            season = seasonal.season;
            break;
        case "half_year":
            const halfStart = now.getMonth() < 6 ? 0 : 6;
            startDate = new Date(now.getFullYear(), halfStart, 1);
            period = `half_${now.getFullYear()}_${halfStart === 0 ? "H1" : "H2"}`;
            season = "mixed";
            break;
        case "yearly":
            startDate = new Date(now.getFullYear(), 0, 1);
            period = `yearly_${now.getFullYear()}`;
            season = "mixed";
            break;
    }

    return { startDate, endDate, period, season: season || "mixed" };
}

function getPeriodLabel(type: "weekly" | "monthly" | "seasonal" | "half_year" | "yearly"): string {
    const labels = {
        weekly: "週次",
        monthly: "月次",
        seasonal: "季節",
        half_year: "半年",
        yearly: "年間",
    };
    return labels[type];
}

function getSeasonName(date: Date): string {
    const month = date.getMonth() + 1;
    if (month >= 3 && month <= 5) return "spring";
    if (month >= 6 && month <= 8) return "summer";
    if (month >= 9 && month <= 11) return "autumn";
    return "winter";
}