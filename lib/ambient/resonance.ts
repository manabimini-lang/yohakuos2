// ===================================================
// YOHAKU Ambient — Memory Resonance Engine
// ===================================================
//
// 単なる関連カードではなく「人生の反復」を検出。
// - 毎年春に挑戦テーマが増える
// - 疲労時に同じ思考へ戻る
// - 特定の季節に同じ感情が現れる
//
// 断面禁止: あくまで「兆し」として提示
//

import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gemini";
import { ResonancePatternInfo, ResonancePatternType } from "./types";
import { RESONANCE_PROMPT } from "./prompts";

/**
 * レゾナンスパターンを検出する
 */
export async function detectResonancePatterns(
    userId: string
): Promise<ResonancePatternInfo[]> {
    // 1. 過去のデータを収集（長期: 90日〜1年）
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    const [seasonalReflections, energyByMonth, thematicMemories, existingPatterns] =
        await Promise.all([
            // 季節ごとのリフレクション
            prisma.seasonalSummary.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: 8,
                select: { period: true, summary: true, themes: true },
            }),
            // エネルギー状態の時系列
            prisma.energyState.findMany({
                where: { userId, createdAt: { gte: oneYearAgo } },
                orderBy: { createdAt: "asc" },
                select: { state: true, intensity: true, createdAt: true },
            }),
            // テーマ別の記憶
            prisma.meaningSignal.findMany({
                where: { userId, confidence: { gte: 0.2 } },
                orderBy: { createdAt: "desc" },
                take: 20,
                select: { signalType: true, description: true, createdAt: true },
            }),
            // 既存のパターン
            prisma.resonancePattern.findMany({
                where: { userId },
                orderBy: { lastObservedAt: "desc" },
                take: 5,
                select: { patternType: true, description: true, observedCount: true },
            }),
        ]);

    const dataPoints =
        seasonalReflections.length +
        energyByMonth.length +
        thematicMemories.length;

    if (dataPoints < 10) {
        return []; // Not enough data
    }

    // 2. 月別エネルギー集計
    const energyByMonthMap = aggregateEnergyByMonth(energyByMonth);

    // 3. 既存パターンとの重複チェック用
    const existingDescriptions = new Set(
        existingPatterns.map((p) => p.description.slice(0, 50))
    );

    // 4. AIによるパターン検出
    const dataForPrompt = [
        "【季節サマリー】",
        ...seasonalReflections.map(
            (s) => `- ${s.period}: ${s.summary.slice(0, 100)}`
        ),
        "",
        "【月別エネルギー分布】",
        ...Object.entries(energyByMonthMap)
            .slice(0, 12)
            .map(([month, states]) => {
                const dominant = getMostFrequent(states);
                return `- ${month}: 主に${dominant}`;
            }),
        "",
        "【テーマ別シグナル】",
        ...thematicMemories.map(
            (m) => `- [${m.signalType}] ${m.description.slice(0, 100)}`
        ),
        "",
        "【既存の検出パターン】",
        ...existingPatterns.map(
            (p) => `- ${p.patternType}: ${p.description.slice(0, 80)} (${p.observedCount}回)`
        ),
    ].join("\n");

    const prompt = `以下のユーザーデータから、人生の「反復パターン」を検出してください。

${dataForPrompt}

検出するパターン:
1. seasonal_recurrence: 季節ごとに繰り返すテーマや感情
2. emotional_cycle: 感情の循環パターン（例: 疲労→回復→疲労）
3. behavioral_loop: 行動パターンの反復
4. thematic_return: 同じテーマへの回帰
5. value_consistency: 価値観の一貫性

注意:
- 既存パターンと重複するものはスキップ
- データが少ない場合は無理に検出しない
- 運命論的な断定は禁止
- あくまで「兆し」として記述

以下のJSON形式で返してください:
{
  "patterns": [
    {
      "patternType": "seasonal_recurrence",
      "description": "気づいたパターンの説明（100文字以内）",
      "confidence": 0.4,
      "evidenceCount": 3
    }
  ]
}`;

    const { text } = await generateText(prompt, RESONANCE_PROMPT);

    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return [];
        const parsed = JSON.parse(jsonMatch[0]);

        const results: ResonancePatternInfo[] = [];
        for (const p of parsed.patterns || []) {
            const validTypes = [
                "seasonal_recurrence",
                "emotional_cycle",
                "behavioral_loop",
                "thematic_return",
                "value_consistency",
            ];
            if (!validTypes.includes(p.patternType)) continue;

            // Check for duplicates
            if (existingDescriptions.has(p.description.slice(0, 50))) continue;

            const now = new Date();
            const created = await prisma.resonancePattern.create({
                data: {
                    userId,
                    patternType: p.patternType,
                    description: p.description.slice(0, 500),
                    confidence: Math.max(0, Math.min(1, p.confidence || 0.3)),
                    sourceMemoryIds: [],
                    evidenceIds: [],
                    firstObservedAt: now,
                    observedCount: p.evidenceCount || 1,
                    lastObservedAt: now,
                },
            });

            results.push({
                id: created.id,
                patternType: created.patternType as ResonancePatternType,
                description: created.description,
                confidence: created.confidence,
                sourceMemoryIds: created.sourceMemoryIds,
                evidenceIds: created.evidenceIds,
                firstObservedAt: created.firstObservedAt,
                observedCount: created.observedCount,
                lastObservedAt: created.lastObservedAt,
                createdAt: created.createdAt,
            });
        }

        return results;
    } catch {
        return [];
    }
}

/**
 * 既存のパターンを更新（同じパターンが再検出された場合）
 */
export async function updateResonancePattern(
    patternId: string,
    newEvidence: string[]
): Promise<void> {
    const pattern = await prisma.resonancePattern.findUnique({
        where: { id: patternId },
    });
    if (!pattern) return;

    const updatedEvidenceIds = [
        ...new Set([...pattern.evidenceIds, ...newEvidence]),
    ];

    await prisma.resonancePattern.update({
        where: { id: patternId },
        data: {
            observedCount: { increment: 1 },
            lastObservedAt: new Date(),
            evidenceIds: updatedEvidenceIds,
            confidence: Math.min(1, pattern.confidence + 0.05), // Increment confidence
        },
    });
}

/**
 * レゾナンスパターン一覧を取得
 */
export async function getResonancePatterns(
    userId: string,
    minConfidence: number = 0.2
): Promise<ResonancePatternInfo[]> {
    const patterns = await prisma.resonancePattern.findMany({
        where: { userId, confidence: { gte: minConfidence } },
        orderBy: [{ observedCount: "desc" }, { confidence: "desc" }],
        take: 20,
    });

    return patterns.map((p) => ({
        id: p.id,
        patternType: p.patternType as ResonancePatternType,
        description: p.description,
        confidence: p.confidence,
        sourceMemoryIds: p.sourceMemoryIds,
        evidenceIds: p.evidenceIds,
        firstObservedAt: p.firstObservedAt,
        observedCount: p.observedCount,
        lastObservedAt: p.lastObservedAt,
        createdAt: p.createdAt,
    }));
}

// ===================================================
// Helper Functions
// ===================================================

function aggregateEnergyByMonth(
    energies: Array<{ state: string; intensity: number; createdAt: Date }>
): Record<string, string[]> {
    const byMonth: Record<string, string[]> = {};
    for (const e of energies) {
        const key = `${e.createdAt.getFullYear()}-${String(e.createdAt.getMonth() + 1).padStart(2, "0")}`;
        if (!byMonth[key]) byMonth[key] = [];
        byMonth[key].push(e.state);
    }
    return byMonth;
}

function getMostFrequent(arr: string[]): string {
    const counts: Record<string, number> = {};
    for (const item of arr) {
        counts[item] = (counts[item] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";
}