// ===================================================
// YOHAKU Life OS — Life Timeline Engine
// ===================================================
//
// 「人生の流れを見る」ための統合アーカイブ。
// 学び・感情・行動・Reflection・Road・Meaning・Habit・会話
// を統合し、SNSタイムラインではない「人生の流れ」を提供。
//
// 設計原則:
// - SNSタイムライン禁止: 「いいね」や「シェア」は不要
// - 過去の振り返りが目的: 未来への最適化ではない
// - 全データ投入禁止: 必要な文脈のみを選択的に表示
//

import { prisma } from "@/lib/prisma";
import { LifeTimelineEntry, LifeTimelineQuery, TimelineEntryType, LifeAreaType } from "./types";

type RawEntry = {
    id: string;
    type: TimelineEntryType;
    title: string;
    description: string;
    createdAt: Date;
    areaType: string | null;
    confidence: number;
    sentiment: string | null;
};

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

/**
 * Life Timeline を取得する。
 * 複数のデータソースを統合し、時系列でソートして返す。
 */
export async function getLifeTimeline(query: LifeTimelineQuery): Promise<{
    entries: LifeTimelineEntry[];
    hasMore: boolean;
    nextCursor: string | null;
}> {
    const {
        userId,
        types,
        areaType,
        fromDate,
        toDate,
        limit = DEFAULT_LIMIT,
        cursor,
    } = query;

    const effectiveLimit = Math.min(limit, MAX_LIMIT) + 1; // +1 for hasMore detection
    const thirtyDaysAgo = fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = toDate || new Date();

    // Fetch from all data sources in parallel
    const [
        reflections,
        userMemories,
        companions,
        lifeReflections,
        meanings,
        habits,
        energies,
        directions,
    ] = await Promise.all([
        // Reflections (内省)
        prisma.reflection.findMany({
            where: {
                userId,
                createdAt: { gte: thirtyDaysAgo, lte: endDate },
                ...(areaType ? {} : {}),
            },
            orderBy: { createdAt: "desc" },
            take: effectiveLimit,
            select: {
                id: true,
                title: true,
                content: true,
                sentiment: true,
                createdAt: true,
                confidence: true,
            },
        }),

        // UserMemories (重要な気づき)
        prisma.userMemory.findMany({
            where: {
                userId,
                createdAt: { gte: thirtyDaysAgo, lte: endDate },
                confidence: { gte: 0.3 },
            },
            orderBy: { createdAt: "desc" },
            take: effectiveLimit,
            select: {
                id: true,
                type: true,
                title: true,
                content: true,
                createdAt: true,
                confidence: true,
            },
        }),

        // Companion messages (会話からの重要な断片)
        prisma.companionMessage.findMany({
            where: {
                conversation: { userId },
                role: "assistant",
                createdAt: { gte: thirtyDaysAgo, lte: endDate },
            },
            orderBy: { createdAt: "desc" },
            take: effectiveLimit,
            select: {
                id: true,
                content: true,
                createdAt: true,
                memorySnapshot: true,
            },
        }),

        // LifeReflections (ライフリフレクション)
        prisma.lifeReflection.findMany({
            where: {
                userId,
                createdAt: { gte: thirtyDaysAgo, lte: endDate },
                ...(areaType ? { areaType: areaType as any } : {}),
            },
            orderBy: { createdAt: "desc" },
            take: effectiveLimit,
            select: {
                id: true,
                type: true,
                title: true,
                content: true,
                confidence: true,
                areaType: true,
                createdAt: true,
            },
        }),

        // MeaningSignals (意味シグナル)
        prisma.meaningSignal.findMany({
            where: {
                userId,
                createdAt: { gte: thirtyDaysAgo, lte: endDate },
                confidence: { gte: 0.2 },
                ...(areaType ? { areaType: areaType as any } : {}),
            },
            orderBy: { createdAt: "desc" },
            take: effectiveLimit,
            select: {
                id: true,
                signalType: true,
                description: true,
                confidence: true,
                areaType: true,
                createdAt: true,
            },
        }),

        // HabitFlows (習慣フロー)
        prisma.habitFlow.findMany({
            where: {
                userId,
                updatedAt: { gte: thirtyDaysAgo, lte: endDate },
                ...(areaType ? { areaType: areaType as any } : {}),
            },
            orderBy: { updatedAt: "desc" },
            take: effectiveLimit,
            select: {
                id: true,
                title: true,
                status: true,
                areaType: true,
                startedAt: true,
                updatedAt: true,
            },
        }),

        // EnergyStates (エネルギー状態)
        prisma.energyState.findMany({
            where: {
                userId,
                createdAt: { gte: thirtyDaysAgo, lte: endDate },
                ...(areaType ? { areaType: areaType as any } : {}),
            },
            orderBy: { createdAt: "desc" },
            take: effectiveLimit,
            select: {
                id: true,
                state: true,
                intensity: true,
                areaType: true,
                note: true,
                createdAt: true,
            },
        }),

        // DirectionReflections (方向性)
        prisma.directionReflection.findMany({
            where: {
                userId,
                createdAt: { gte: thirtyDaysAgo, lte: endDate },
            },
            orderBy: { createdAt: "desc" },
            take: effectiveLimit,
            select: {
                id: true,
                direction: true,
                intention: true,
                confidence: true,
                createdAt: true,
            },
        }),
    ]);

    // Convert to unified format
    const rawEntries: RawEntry[] = [];

    for (const ref of reflections) {
        if (types && !types.includes("reflection")) continue;
        rawEntries.push({
            id: `ref_${ref.id}`,
            type: "reflection",
            title: ref.title || "内省",
            description: (ref.content || "").slice(0, 200),
            createdAt: ref.createdAt,
            areaType: null,
            confidence: ref.confidence || 0.5,
            sentiment: ref.sentiment,
        });
    }

    for (const mem of userMemories) {
        if (types && !types.includes("learning")) continue;
        if (mem.type === "reflection" || mem.type === "emotional_pattern") {
            rawEntries.push({
                id: `mem_${mem.id}`,
                type: mem.type === "emotional_pattern" ? "emotion" : "learning",
                title: mem.title,
                description: mem.content.slice(0, 200),
                createdAt: mem.createdAt,
                areaType: null,
                confidence: mem.confidence,
                sentiment: null,
            });
        }
    }

    for (const msg of companions) {
        if (types && !types.includes("conversation")) continue;
        const snapshot = msg.memorySnapshot as Record<string, unknown> | null;
        rawEntries.push({
            id: `cmp_${msg.id}`,
            type: "conversation",
            title: "会話",
            description: msg.content.slice(0, 200),
            createdAt: msg.createdAt,
            areaType: null,
            confidence: 0.5,
            sentiment: snapshot?.emotionalTrend as string | null || null,
        });
    }

    for (const lr of lifeReflections) {
        if (types && !types.includes("reflection")) continue;
        rawEntries.push({
            id: `lr_${lr.id}`,
            type: "reflection",
            title: lr.title,
            description: lr.content.slice(0, 200),
            createdAt: lr.createdAt,
            areaType: lr.areaType as string | null,
            confidence: lr.confidence,
            sentiment: null,
        });
    }

    for (const sig of meanings) {
        if (types && !types.includes("meaning")) continue;
        rawEntries.push({
            id: `sig_${sig.id}`,
            type: "meaning",
            title: sig.signalType.replace(/_/g, " "),
            description: sig.description.slice(0, 200),
            createdAt: sig.createdAt,
            areaType: sig.areaType as string | null,
            confidence: sig.confidence,
            sentiment: null,
        });
    }

    for (const h of habits) {
        if (types && !types.includes("habit")) continue;
        rawEntries.push({
            id: `hbt_${h.id}`,
            type: "habit",
            title: h.title,
            description: `習慣が「${h.status}」状態です`,
            createdAt: h.updatedAt,
            areaType: h.areaType as string | null,
            confidence: 0.5,
            sentiment: null,
        });
    }

    for (const e of energies) {
        if (types && !types.includes("energy")) continue;
        rawEntries.push({
            id: `eng_${e.id}`,
            type: "energy",
            title: e.state.replace(/_/g, " "),
            description: e.note || `強度: ${e.intensity}/10`,
            createdAt: e.createdAt,
            areaType: e.areaType as string | null,
            confidence: 0.5,
            sentiment: null,
        });
    }

    for (const d of directions) {
        if (types && !types.includes("direction")) continue;
        rawEntries.push({
            id: `dir_${d.id}`,
            type: "direction",
            title: "方向性",
            description: d.direction.slice(0, 200),
            createdAt: d.createdAt,
            areaType: null,
            confidence: d.confidence,
            sentiment: null,
        });
    }

    // Sort by createdAt descending
    rawEntries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Handle cursor-based pagination
    let startIndex = 0;
    if (cursor) {
        const cursorIndex = rawEntries.findIndex((e) => e.id === cursor);
        if (cursorIndex >= 0) {
            startIndex = cursorIndex + 1;
        }
    }

    const sliced = rawEntries.slice(startIndex, startIndex + effectiveLimit);
    const hasMore = sliced.length > limit;
    const entries = sliced.slice(0, limit).map((e) => ({
        ...e,
        areaType: e.areaType as LifeAreaType | null,
        sourceId: e.id,
    }));
    const nextCursor = hasMore ? entries[entries.length - 1]?.id || null : null;

    return { entries, hasMore, nextCursor };
}

/**
 * 指定期間のアクティビティ集計を取得する
 */
export async function getLifeTimelineStats(
    userId: string,
    fromDate?: Date,
    toDate?: Date
): Promise<{
    totalEntries: number;
    byType: Record<TimelineEntryType, number>;
    byArea: Record<string, number>;
    dailyAverage: number;
}> {
    const daysBack = fromDate
        ? Math.ceil((Date.now() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
        : 30;
    const startDate = fromDate || new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const endDate = toDate || new Date();

    const [reflectionCount, memoryCount, messageCount, lifeReflectionCount, meaningCount, energyCount, directionCount] =
        await Promise.all([
            prisma.reflection.count({
                where: { userId, createdAt: { gte: startDate, lte: endDate } },
            }),
            prisma.userMemory.count({
                where: { userId, createdAt: { gte: startDate, lte: endDate } },
            }),
            prisma.companionMessage.count({
                where: {
                    role: "assistant",
                    conversation: { userId },
                    createdAt: { gte: startDate, lte: endDate },
                },
            }),
            prisma.lifeReflection.count({
                where: { userId, createdAt: { gte: startDate, lte: endDate } },
            }),
            prisma.meaningSignal.count({
                where: { userId, createdAt: { gte: startDate, lte: endDate } },
            }),
            prisma.energyState.count({
                where: { userId, createdAt: { gte: startDate, lte: endDate } },
            }),
            prisma.directionReflection.count({
                where: { userId, createdAt: { gte: startDate, lte: endDate } },
            }),
        ]);

    const byType: Record<TimelineEntryType, number> = {
        learning: memoryCount,
        emotion: 0,
        action: 0,
        reflection: reflectionCount + lifeReflectionCount,
        road: 0,
        meaning: meaningCount,
        habit: 0,
        conversation: messageCount,
        energy: energyCount,
        direction: directionCount,
    };

    const totalEntries = Object.values(byType).reduce((a, b) => a + b, 0);
    const daysElapsed = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    return {
        totalEntries,
        byType,
        byArea: {}, // Simplified - area mapping requires additional queries
        dailyAverage: Math.round((totalEntries / daysElapsed) * 10) / 10,
    };
}