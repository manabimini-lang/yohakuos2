// ===================================================
// YOHAKU Life OS — Energy Tracking Engine
// ===================================================
//
// 感情ではなく「人生エネルギー」を扱う。
// 診断禁止: 状態の観察と記述に徹する。
//
// エネルギー状態:
// - calm_focus: 静かな集中
// - exhaustion: 疲弊
// - recovery: 回復
// - curiosity: 好奇心
// - instability: 不安定
// - groundedness: 地に足がついた状態
//

import { prisma } from "@/lib/prisma";
import type { EnergyStateType, LifeAreaType } from "./types";
import { EnergyStateInfo, EnergyTrend } from "./types";

/**
 * 新しいエネルギー状態を記録
 */
export async function recordEnergyState(
    userId: string,
    data: {
        state: EnergyStateType;
        intensity: number;
        note?: string;
        areaType?: LifeAreaType;
        sourceReflectionId?: string;
    }
): Promise<EnergyStateInfo> {
    const created = await prisma.energyState.create({
        data: {
            userId,
            state: data.state as any,
            intensity: Math.max(1, Math.min(10, data.intensity)),
            note: data.note || null,
            areaType: (data.areaType as any) || null,
            sourceReflectionId: data.sourceReflectionId || null,
        },
    });

    return {
        id: created.id,
        state: created.state as EnergyStateType,
        intensity: created.intensity,
        areaType: created.areaType as LifeAreaType | null,
        note: created.note,
        createdAt: created.createdAt,
    };
}

/**
 * 直近のエネルギー状態一覧を取得
 */
export async function getRecentEnergyStates(
    userId: string,
    days: number = 14,
    limit: number = 30
): Promise<EnergyStateInfo[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const states = await prisma.energyState.findMany({
        where: {
            userId,
            createdAt: { gte: since },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
            id: true,
            state: true,
            intensity: true,
            areaType: true,
            note: true,
            createdAt: true,
        },
    });

    return states.map((s) => ({
        id: s.id,
        state: s.state as EnergyStateType,
        intensity: s.intensity,
        areaType: s.areaType as LifeAreaType | null,
        note: s.note,
        createdAt: s.createdAt,
    }));
}

/**
 * エネルギートレンドを分析
 */
export async function analyzeEnergyTrend(
    userId: string,
    days: number = 14
): Promise<EnergyTrend> {
    const recentStates = await getRecentEnergyStates(userId, days);

    if (recentStates.length === 0) {
        return {
            recentStates: [],
            averageIntensity: 0,
            dominantState: null,
            shiftIndication: null,
            confidence: 0,
        };
    }

    const averageIntensity = Math.round(
        recentStates.reduce((sum, s) => sum + s.intensity, 0) / recentStates.length
    );

    // 最も多い状態を特定
    const stateCounts: Record<string, number> = {};
    for (const s of recentStates) {
        stateCounts[s.state] = (stateCounts[s.state] || 0) + 1;
    }
    const dominantState = Object.entries(stateCounts).sort(
        (a, b) => b[1] - a[1]
    )[0]?.[0] as EnergyStateType | null;

    // 変化の兆しを検出（直近3件とそれ以前を比較）
    let shiftIndication: string | null = null;
    if (recentStates.length >= 6) {
        const recent = recentStates.slice(0, 3);
        const older = recentStates.slice(3, 6);
        const recentAvg =
            recent.reduce((s, e) => s + e.intensity, 0) / recent.length;
        const olderAvg =
            older.reduce((s, e) => s + e.intensity, 0) / older.length;

        if (recentAvg > olderAvg + 1) {
            shiftIndication = "エネルギーが上昇傾向かもしれません";
        } else if (recentAvg < olderAvg - 1) {
            shiftIndication = "エネルギーが下降傾向かもしれません";
        }

        // 状態の変化もチェック
        const recentStatesSet = new Set(recent.map((s) => s.state));
        const olderStatesSet = new Set(older.map((s) => s.state));
        if (recentStatesSet.size < olderStatesSet.size) {
            shiftIndication = shiftIndication
                ? `${shiftIndication}。状態の幅が狭まっています`
                : "エネルギー状態が収束傾向かもしれません";
        }
    }

    const confidence = Math.min(0.8, recentStates.length * 0.05);

    return {
        recentStates,
        averageIntensity,
        dominantState,
        shiftIndication,
        confidence,
    };
}

/**
 * 特定の期間のエネルギーサマリーを取得
 */
export async function getEnergySummary(
    userId: string,
    fromDate: Date,
    toDate: Date
): Promise<{
    totalEntries: number;
    dominantStates: Array<{ state: EnergyStateType; count: number }>;
    averageIntensity: number;
}> {
    const states = await prisma.energyState.findMany({
        where: {
            userId,
            createdAt: { gte: fromDate, lte: toDate },
        },
        select: {
            state: true,
            intensity: true,
        },
    });

    const stateCounts: Record<string, number> = {};
    let totalIntensity = 0;

    for (const s of states) {
        stateCounts[s.state] = (stateCounts[s.state] || 0) + 1;
        totalIntensity += s.intensity;
    }

    const dominantStates = Object.entries(stateCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([state, count]) => ({
            state: state as EnergyStateType,
            count,
        }));

    return {
        totalEntries: states.length,
        dominantStates,
        averageIntensity: states.length > 0
            ? Math.round(totalIntensity / states.length)
            : 0,
    };
}