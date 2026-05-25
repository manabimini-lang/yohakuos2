// ===================================================
// YOHAKU Ambient — Quiet Presence System + Frequency Control
// ===================================================
//
// AIは常に喋らない。常に提案しない。常に最適化しない。
// 必要時のみ現れる。
//
// 出現条件:
// - reflection stagnation
// - emotional repetition
// - learning drift
// - seasonal timing
//
// Frequency Control:
// - 最低4時間インターバル
// - 1日最大3回
// - 低確度抑制
// - タイプ別クールダウン
//

import { prisma } from "@/lib/prisma";
import { PresenceDecision, FrequencyConfig, AmbientInsightType, DEFAULT_FREQUENCY_CONFIG } from "./types";

/**
 * AIが出現すべきか判定する（静かな出現制御）
 */
export async function shouldSurface(
    userId: string,
    type?: AmbientInsightType,
    config: FrequencyConfig = DEFAULT_FREQUENCY_CONFIG
): Promise<PresenceDecision> {
    const now = new Date();

    // 1. 全体的な頻度制限
    const recentInsights = await prisma.ambientInsight.findMany({
        where: {
            userId,
            surfacedAt: {
                gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // last 24h
            },
        },
        orderBy: { surfacedAt: "desc" },
        select: { surfacedAt: true, type: true, confidence: true },
    });

    // 最後の出現からの経過時間
    if (recentInsights.length > 0) {
        const lastSurfaced = recentInsights[0].surfacedAt;
        const hoursSinceLastSurface =
            (now.getTime() - lastSurfaced.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastSurface < config.minIntervalHours) {
            const nextAvailable = new Date(
                lastSurfaced.getTime() + config.minIntervalHours * 60 * 60 * 1000
            );
            return {
                shouldSurface: false,
                reason: `最低インターバル（${config.minIntervalHours}時間）に達していません`,
                suggestedType: null,
                nextAvailableAt: nextAvailable,
            };
        }
    }

    // 1日あたりの最大出現数
    if (recentInsights.length >= config.maxPerDay) {
        return {
            shouldSurface: false,
            reason: `1日の最大出現数（${config.maxPerDay}回）に達しました`,
            suggestedType: null,
            nextAvailableAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        };
    }

    // タイプ別クールダウン
    if (type) {
        const sameTypeRecent = recentInsights.find(
            (i) => i.type === type
        );
        if (sameTypeRecent) {
            const hoursSinceSameType =
                (now.getTime() - sameTypeRecent.surfacedAt.getTime()) / (1000 * 60 * 60);
            if (hoursSinceSameType < config.typeCooldownHours) {
                return {
                    shouldSurface: false,
                    reason: `同じタイプ（${type}）のクールダウン中です`,
                    suggestedType: null,
                    nextAvailableAt: new Date(
                        sameTypeRecent.surfacedAt.getTime() +
                        config.typeCooldownHours * 60 * 60 * 1000
                    ),
                };
            }
        }
    }

    // 2. Emotional Cooldown チェック（既存システムと連携）
    const activeCooldowns = await prisma.emotionalCooldown.findMany({
        where: { userId, expiresAt: { gt: now } },
        orderBy: { intensity: "desc" },
        take: 1,
    });

    if (activeCooldowns.length > 0 && activeCooldowns[0].intensity >= 5) {
        return {
            shouldSurface: false,
            reason: "感情的なクールダウン期間中です",
            suggestedType: null,
            nextAvailableAt: activeCooldowns[0].expiresAt,
        };
    }

    // 3. 出現条件のチェック（Quiet Presenceの条件）
    const conditions = await checkPresenceConditions(userId);

    if (!conditions.shouldAppear) {
        return {
            shouldSurface: false,
            reason: conditions.reason || "現在出現条件を満たしていません",
            suggestedType: null,
            nextAvailableAt: new Date(now.getTime() + 60 * 60 * 1000), // 1時間後に再チェック
        };
    }

    return {
        shouldSurface: true,
        reason: null,
        suggestedType: conditions.suggestedType,
        nextAvailableAt: null,
    };
}

/**
 * Quiet Presence の出現条件をチェック
 */
async function checkPresenceConditions(userId: string): Promise<{
    shouldAppear: boolean;
    reason: string | null;
    suggestedType: AmbientInsightType | null;
}> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const [recentReflections, recentEnergies, recentMeanings, recentLifeReflections] =
        await Promise.all([
            prisma.reflection.count({
                where: { userId, createdAt: { gte: threeDaysAgo } },
            }),
            prisma.energyState.findMany({
                where: { userId, createdAt: { gte: sevenDaysAgo } },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: { state: true },
            }),
            prisma.meaningSignal.findMany({
                where: { userId, confidence: { gte: 0.3 } },
                orderBy: { createdAt: "desc" },
                take: 3,
                select: { signalType: true, description: true },
            }),
            prisma.lifeReflection.count({
                where: { userId, createdAt: { gte: sevenDaysAgo } },
            }),
        ]);

    // 条件1: Reflection Stagnation（3日以上内省がない）
    if (recentReflections === 0 && recentLifeReflections === 0) {
        return {
            shouldAppear: true,
            reason: "内省の停滞を検出",
            suggestedType: "quiet_discovery",
        };
    }

    // 条件2: Emotional Repetition（同じ感情パターンが続く）
    if (recentEnergies.length >= 3) {
        const uniqueStates = new Set(recentEnergies.map((e) => e.state));
        if (uniqueStates.size <= 2 && recentEnergies.length >= 4) {
            return {
                shouldAppear: true,
                reason: "感情パターンの反復を検出",
                suggestedType: "theme_recurrence",
            };
        }
    }

    // 条件3: 意味シグナルの蓄積
    if (recentMeanings.length >= 2) {
        return {
            shouldAppear: true,
            reason: "意味シグナルの蓄積あり",
            suggestedType: "reflection_bridge",
        };
    }

    // 条件4: Seasonal timing（季節の変わり目は常に出現可能）
    const month = new Date().getMonth() + 1;
    const isSeasonTransition =
        month === 3 || month === 6 || month === 9 || month === 12;

    if (isSeasonTransition && recentLifeReflections > 0) {
        return {
            shouldAppear: true,
            reason: "季節の変わり目",
            suggestedType: "seasonal_echo",
        };
    }

    return {
        shouldAppear: false,
        reason: "現在出現条件を満たしていません",
        suggestedType: null,
    };
}

/**
 * 出現の記録を保存
 */
export async function recordSurface(
    userId: string,
    type: AmbientInsightType,
    title: string,
    content: string,
    sourceMemoryIds: string[] = [],
    confidence: number = 0.3
): Promise<void> {
    await prisma.ambientInsight.create({
        data: {
            userId,
            type,
            title,
            content,
            sourceMemoryIds,
            confidence,
            surfacedAt: new Date(),
        },
    });

    // Also add to slow feed
    await prisma.slowFeedEntry.create({
        data: {
            userId,
            entryType: type === "seasonal_echo" ? "seasonal_echo"
                : type === "memory_resonance" ? "resonance"
                    : "insight",
            title,
            content,
            sourceType: "ambient_insight",
            confidence,
            priority: Math.round(confidence * 5),
            surfacedAt: new Date(),
        },
    });
}

/**
 * インサイトを却下（dismiss）する
 */
export async function dismissInsight(insightId: string): Promise<void> {
    await prisma.ambientInsight.update({
        where: { id: insightId },
        data: { dismissedAt: new Date() },
    });
}