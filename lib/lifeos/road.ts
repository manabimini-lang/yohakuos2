// ===================================================
// YOHAKU Life OS — Road Context Persistence
// ===================================================
//
// ユーザーの「道」（Road）の履歴と遷移を管理。
// どのRoadをいつ歩いていたか、いつ遷移したかを記録。
//

import { prisma } from "@/lib/prisma";

/**
 * 現在のRoadを記録/更新
 */
export async function recordCurrentRoad(
    userId: string,
    roadSlug: string,
    roadTitle: string,
    roadIcon?: string
): Promise<void> {
    // Check if there's an active road history
    const activeHistory = await prisma.roadHistory.findFirst({
        where: { userId, endedAt: null },
        orderBy: { startedAt: "desc" },
    });

    if (activeHistory) {
        if (activeHistory.roadSlug === roadSlug) {
            // Same road, no transition needed
            return;
        }

        // Record transition
        await prisma.roadTransition.create({
            data: {
                userId,
                fromRoad: activeHistory.roadSlug,
                toRoad: roadSlug,
                reflection: null,
            },
        });

        // End previous road
        await prisma.roadHistory.update({
            where: { id: activeHistory.id },
            data: { endedAt: new Date() },
        });
    }

    // Start new road
    await prisma.roadHistory.create({
        data: {
            userId,
            roadSlug,
            roadTitle,
            roadIcon: roadIcon || null,
            startedAt: new Date(),
        },
    });
}

/**
 * 過去のRoad履歴を取得
 */
export async function getRoadHistory(userId: string): Promise<{
    current: { slug: string; title: string; icon: string | null; startedAt: Date } | null;
    past: Array<{ slug: string; title: string; icon: string | null; startedAt: Date; endedAt: Date }>;
    transitions: Array<{ from: string; to: string; reflection: string | null; createdAt: Date }>;
}> {
    const [activeHistory, pastHistories, transitions] = await Promise.all([
        prisma.roadHistory.findFirst({
            where: { userId, endedAt: null },
            orderBy: { startedAt: "desc" },
            select: { roadSlug: true, roadTitle: true, roadIcon: true, startedAt: true },
        }),
        prisma.roadHistory.findMany({
            where: { userId, endedAt: { not: null } },
            orderBy: { startedAt: "desc" },
            take: 20,
            select: {
                roadSlug: true,
                roadTitle: true,
                roadIcon: true,
                startedAt: true,
                endedAt: true,
            },
        }),
        prisma.roadTransition.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 20,
            select: {
                fromRoad: true,
                toRoad: true,
                reflection: true,
                createdAt: true,
            },
        }),
    ]);

    return {
        current: activeHistory
            ? {
                slug: activeHistory.roadSlug,
                title: activeHistory.roadTitle,
                icon: activeHistory.roadIcon,
                startedAt: activeHistory.startedAt,
            }
            : null,
        past: pastHistories
            .filter((h): h is typeof h & { endedAt: Date } => h.endedAt !== null)
            .map((h) => ({
                slug: h.roadSlug,
                title: h.roadTitle,
                icon: h.roadIcon,
                startedAt: h.startedAt,
                endedAt: h.endedAt!,
            })),
        transitions: transitions.map((t) => ({
            from: t.fromRoad,
            to: t.toRoad,
            reflection: t.reflection,
            createdAt: t.createdAt,
        })),
    };
}

/**
 * Road遷移にリフレクションを追加
 */
export async function addTransitionReflection(
    transitionId: string,
    reflection: string
): Promise<void> {
    await prisma.roadTransition.update({
        where: { id: transitionId },
        data: { reflection },
    });
}

/**
 * Road滞在日数を計算
 */
export async function getRoadDuration(userId: string, roadSlug: string): Promise<number> {
    const histories = await prisma.roadHistory.findMany({
        where: { userId, roadSlug },
        select: { startedAt: true, endedAt: true },
    });

    let totalDays = 0;
    for (const h of histories) {
        const end = h.endedAt || new Date();
        totalDays += (end.getTime() - h.startedAt.getTime()) / (1000 * 60 * 60 * 24);
    }

    return Math.ceil(totalDays);
}