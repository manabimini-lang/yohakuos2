// ===================================================
// YOHAKU Life OS — Quiet Planning Layer
// ===================================================
//
// 計画を強制しない。
// 代わりに小さな次の一歩・静かな意図・任意の内省を提示。
//
// 設計原則:
// - タスク管理化禁止
// - すべて「任意」として提示
// - 「やらなくてもよい」選択肢を残す
//

import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gemini";
import { QuietPlanInfo, QuietPlanningSuggestion } from "./types";
import { QUIET_PLANNING_SYSTEM_PROMPT } from "./prompts";

/**
 * 静かな計画の提案を生成
 */
export async function generateQuietSuggestions(
    userId: string
): Promise<QuietPlanningSuggestion> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [recentReflections, recentMemories, activeHabits, recentEnergies] =
        await Promise.all([
            prisma.reflection.findMany({
                where: { userId, createdAt: { gte: thirtyDaysAgo } },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: { title: true, content: true },
            }),
            prisma.userMemory.findMany({
                where: { userId, confidence: { gte: 0.4 } },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: { type: true, title: true, content: true },
            }),
            prisma.habitFlow.findMany({
                where: { userId, status: "active" },
                orderBy: { startedAt: "desc" },
                take: 5,
                select: { title: true, intensity: true },
            }),
            prisma.energyState.findMany({
                where: { userId, createdAt: { gte: sevenDaysAgo(30) } },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: { state: true, note: true },
            }),
        ]);

    const dataPoints = recentReflections.length + recentMemories.length;
    if (dataPoints < 2) {
        return {
            smallNextSteps: ["今日は何か心に留まっていることはありますか？"],
            quietIntentions: ["何もしない時間も、大切な時間です。"],
            optionalReflections: ["よかったら、今日のことを少し書き留めてみてください。"],
        };
    }

    const dataForPrompt = [
        "【最近の内省】",
        ...recentReflections.map((r) => `- ${r.title || ""}: ${(r.content || "").slice(0, 100)}`),
        "",
        "【最近の気づき】",
        ...recentMemories.map((m) => `- [${m.type}] ${m.title}`),
        "",
        "【現在の習慣】",
        ...activeHabits.map((h) => `- ${h.title} (強度: ${h.intensity})`),
        "",
        "【エネルギー状態】",
        ...recentEnergies.map((e) => `- ${e.state}: ${e.note || ""}`),
    ].join("\n");

    const prompt = `以下のユーザーの状態を見て、静かな提案を生成してください。

${dataForPrompt}

以下のJSON形式で返してください。重要なのは「計画を強制しない」ことです。
{
  "smallNextSteps": ["小さな次の一歩（任意）", "例: 散歩がてら本を開いてみる"],
  "quietIntentions": ["静かな意図", "例: 今日は焦らず、自分のペースを大切にする"],
  "optionalReflections": ["任意の内省", "例: 今週、何か心に残ったことはありますか？"]
}

注意:
- 「すべき」「しなさい」は絶対に使わない
- すべて「任意」のニュアンスで
- 小さな提案であること（大きな計画変更を求めない）
- 生産性プレッシャーを与えない`;

    const { text } = await generateText(prompt, QUIET_PLANNING_SYSTEM_PROMPT);

    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON");
        const parsed = JSON.parse(jsonMatch[0]);

        return {
            smallNextSteps: parsed.smallNextSteps || [],
            quietIntentions: parsed.quietIntentions || [],
            optionalReflections: parsed.optionalReflections || [],
        };
    } catch {
        return {
            smallNextSteps: ["何か気になることがあれば、少しだけ触れてみてください。"],
            quietIntentions: ["今日という一日を、そのまま受け入れてみてください。"],
            optionalReflections: ["今日どんな気づきがありましたか？"],
        };
    }
}

/**
 * 静かな計画を保存
 */
export async function saveQuietPlan(
    userId: string,
    data: {
        intention: string;
        nextStep?: string;
        note?: string;
    }
): Promise<QuietPlanInfo> {
    const created = await prisma.quietPlan.create({
        data: {
            userId,
            intention: data.intention,
            nextStep: data.nextStep || null,
            note: data.note || null,
            isOptional: true,
        },
    });

    return {
        id: created.id,
        intention: created.intention,
        nextStep: created.nextStep,
        note: created.note,
        isOptional: created.isOptional,
        isCompleted: created.isCompleted,
        createdAt: created.createdAt,
        completedAt: created.completedAt,
    };
}

/**
 * 静かな計画一覧を取得
 */
export async function getQuietPlans(
    userId: string,
    includeCompleted: boolean = false
): Promise<QuietPlanInfo[]> {
    const where: any = { userId };
    if (!includeCompleted) where.isCompleted = false;

    const plans = await prisma.quietPlan.findMany({
        where,
        orderBy: [{ isCompleted: "asc" }, { createdAt: "desc" }],
        select: {
            id: true,
            intention: true,
            nextStep: true,
            note: true,
            isOptional: true,
            isCompleted: true,
            createdAt: true,
            completedAt: true,
        },
    });

    return plans.map((p) => ({
        id: p.id,
        intention: p.intention,
        nextStep: p.nextStep,
        note: p.note,
        isOptional: p.isOptional,
        isCompleted: p.isCompleted,
        createdAt: p.createdAt,
        completedAt: p.completedAt,
    }));
}

/**
 * 静かな計画を完了としてマーク
 */
export async function completeQuietPlan(planId: string): Promise<void> {
    await prisma.quietPlan.update({
        where: { id: planId },
        data: {
            isCompleted: true,
            completedAt: new Date(),
        },
    });
}

function sevenDaysAgo(days: number): Date {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}