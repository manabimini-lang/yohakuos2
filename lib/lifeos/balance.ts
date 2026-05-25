// ===================================================
// YOHAKU Life OS — Life Balance Engine
// ===================================================
//
// AIが学習過多・感情停滞・疲弊傾向・不均衡を
// gentle に分析する。断定禁止。
//
// 設計原則:
// - 「診断」ではなく「兆し」として提示
// - 完璧なバランスを押し付けない
// - 「今の状態も一つの在り方」と受け止める
//

import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gemini";
import { LifeBalanceAnalysis, LifeBalanceSignal } from "./types";
import { BALANCE_SYSTEM_PROMPT } from "./prompts";

/**
 * ライフバランス分析を実行
 */
export async function analyzeLifeBalance(userId: string): Promise<LifeBalanceAnalysis> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 1. データ収集
    const [energyStates, lifeReflections, meanings, habits] = await Promise.all([
        prisma.energyState.findMany({
            where: { userId, createdAt: { gte: thirtyDaysAgo } },
            select: { state: true, intensity: true, areaType: true },
        }),
        prisma.lifeReflection.findMany({
            where: { userId, createdAt: { gte: thirtyDaysAgo } },
            select: { type: true, content: true, areaType: true },
        }),
        prisma.meaningSignal.findMany({
            where: { userId, createdAt: { gte: thirtyDaysAgo } },
            select: { signalType: true, description: true, confidence: true },
        }),
        prisma.habitFlow.findMany({
            where: { userId },
            select: { status: true, intensity: true, areaType: true },
        }),
    ]);

    const dataPoints = energyStates.length + lifeReflections.length;
    if (dataPoints < 5) {
        return {
            analysis: "バランスを分析するには十分なデータがまだありません。",
            signals: [],
            learningOverload: null,
            emotionalStagnation: null,
            exhaustionTendency: null,
            imbalanceScore: null,
            confidence: 0.1,
            gentleSuggestions: ["日々の記録を続けると、徐々にバランスが見えてきます。"],
        };
    }

    // 2. データから基礎指標を計算
    const exhaustionCount = energyStates.filter((e) => e.state === "exhaustion").length;
    const instabilityCount = energyStates.filter((e) => e.state === "instability").length;
    const calmFocusCount = energyStates.filter((e) => e.state === "calm_focus").length;
    const recoveryCount = energyStates.filter((e) => e.state === "recovery").length;

    const totalEnergy = energyStates.length;
    const exhaustionRatio = totalEnergy > 0 ? exhaustionCount / totalEnergy : 0;
    const instabilityRatio = totalEnergy > 0 ? instabilityCount / totalEnergy : 0;

    // 学習領域のアクティビティ比率
    const learningReflections = lifeReflections.filter((r) => r.areaType === "Learning").length;
    const restReflections = lifeReflections.filter((r) => r.areaType === "Rest").length;
    const totalReflections = lifeReflections.length;
    const learningRatio = totalReflections > 0 ? learningReflections / totalReflections : 0;
    const restRatio = totalReflections > 0 ? restReflections / totalReflections : 0;

    // 3. データをAIに渡して分析
    const dataForPrompt = [
        "【エネルギー状態分布（30日）】",
        `- 総記録数: ${totalEnergy}`,
        `- calm_focus: ${calmFocusCount}回`,
        `- exhaustion: ${exhaustionCount}回`,
        `- recovery: ${recoveryCount}回`,
        `- instability: ${instabilityCount}回`,
        `- 疲弊比率: ${(exhaustionRatio * 100).toFixed(0)}%`,
        "",
        "【内省分布】",
        `- 学習領域の内省: ${learningRatio > 0 ? (learningRatio * 100).toFixed(0) : 0}%`,
        `- 休息領域の内省: ${restRatio > 0 ? (restRatio * 100).toFixed(0) : 0}%`,
        `- 総内省数: ${totalReflections}`,
        "",
        "【習慣の状態】",
        `- アクティブ: ${habits.filter((h) => h.status === "active").length}`,
        `- 自然消滅: ${habits.filter((h) => h.status === "naturally_ended").length}`,
        "",
        "【意味シグナル】",
        ...meanings.map((m) => `- [${m.signalType}] ${m.description.slice(0, 100)}`),
    ].join("\n");

    const prompt = `以下のユーザーデータから、人生のバランス状態を穏やかに分析してください。

${dataForPrompt}

以下のJSON形式で返してください。注意：全て「兆し」として表現し、断定は禁止です。
{
  "analysis": "全体的なバランス分析（3-5文）",
  "signals": [
    {
      "type": "exhaustion | learning_overload | emotional_stagnation | imbalance | recovery",
      "description": "兆しの説明",
      "intensity": 0.5
    }
  ],
  "learningOverload": null,
  "emotionalStagnation": null,
  "exhaustionTendency": null,
  "imbalanceScore": null,
  "confidence": 0.5,
  "gentleSuggestions": ["静かな提案1", "提案2"]
}

数値（learningOverload, emotionalStagnation, exhaustionTendency, imbalanceScore）は
0.0-1.0の範囲で。データ不足の場合はnull。
gentleSuggestionsは「〜してみてもいいかもしれません」というトーンで。`;

    const { text } = await generateText(prompt, BALANCE_SYSTEM_PROMPT);

    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON");
        const parsed = JSON.parse(jsonMatch[0]);

        // 保存
        await prisma.lifeBalance.create({
            data: {
                userId,
                analysis: parsed.analysis || "",
                signals: parsed.signals || [],
                confidence: parsed.confidence || 0.3,
            },
        });

        return {
            analysis: parsed.analysis || "十分な分析データがありません。",
            signals: (parsed.signals || []).map((s: any) => ({
                type: s.type,
                description: s.description,
                intensity: Math.max(0, Math.min(1, s.intensity || 0.3)),
            })),
            learningOverload: parsed.learningOverload !== null
                ? Math.max(0, Math.min(1, parsed.learningOverload))
                : null,
            emotionalStagnation: parsed.emotionalStagnation !== null
                ? Math.max(0, Math.min(1, parsed.emotionalStagnation))
                : null,
            exhaustionTendency: parsed.exhaustionTendency !== null
                ? Math.max(0, Math.min(1, parsed.exhaustionTendency))
                : null,
            imbalanceScore: parsed.imbalanceScore !== null
                ? Math.max(0, Math.min(1, parsed.imbalanceScore))
                : null,
            confidence: parsed.confidence || 0.3,
            gentleSuggestions: parsed.gentleSuggestions || [],
        };
    } catch {
        // 自身のヒューリスティック分析にフォールバック
        return heuristicBalanceAnalysis(
            exhaustionRatio, instabilityRatio, learningRatio, restRatio, totalEnergy
        );
    }
}

/**
 * AIが失敗した場合のヒューリスティックフォールバック
 */
function heuristicBalanceAnalysis(
    exhaustionRatio: number,
    instabilityRatio: number,
    learningRatio: number,
    restRatio: number,
    dataPoints: number
): LifeBalanceAnalysis {
    const signals: LifeBalanceSignal[] = [];
    const suggestions: string[] = [];
    let imbalanceScore: number | null = null;

    // 疲弊傾向
    let exhaustionTendency: number | null = null;
    if (exhaustionRatio > 0.3) {
        exhaustionTendency = Math.min(1, exhaustionRatio);
        signals.push({
            type: "exhaustion",
            description: "疲弊の兆しが観察されます",
            intensity: exhaustionTendency,
        });
        suggestions.push("休息の時間を増やしてみてもいいかもしれません");
    }

    // 不安定性
    if (instabilityRatio > 0.2) {
        signals.push({
            type: "imbalance",
            description: "エネルギー状態に変動が見られます",
            intensity: instabilityRatio,
        });
    }

    // 学習過多
    let learningOverload: number | null = null;
    if (learningRatio > 0.5 && restRatio < 0.1) {
        learningOverload = Math.min(1, learningRatio);
        signals.push({
            type: "learning_overload",
            description: "学習への傾斜が強く、休息のバランスが少ないかもしれません",
            intensity: learningOverload,
        });
        suggestions.push("学びと休息のバランスを少し調整してみてもいいかもしれません");
    }

    // 総合不均衡
    const scores = [exhaustionTendency, learningOverload].filter((s) => s !== null) as number[];
    imbalanceScore = scores.length > 0
        ? Math.min(1, scores.reduce((s, v) => s + v, 0) / scores.length)
        : null;

    if (signals.length === 0) {
        signals.push({
            type: "recovery",
            description: "特に大きな不均衡の兆しは見られません",
            intensity: 0.1,
        });
    }

    if (suggestions.length === 0) {
        suggestions.push("今の状態を続けてみて、変化があればまた振り返ってみてください");
    }

    return {
        analysis: signals.length > 0
            ? `${signals.length}つのバランスシグナルが検出されました。`
            : "バランスに特に大きな偏りは見られません。",
        signals,
        learningOverload,
        emotionalStagnation: null,
        exhaustionTendency,
        imbalanceScore,
        confidence: Math.min(0.5, dataPoints * 0.01),
        gentleSuggestions: suggestions,
    };
}