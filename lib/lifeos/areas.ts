// ===================================================
// YOHAKU Life OS — Life Areas Engine
// ===================================================
//
// 人生領域（Health, Learning, Work, Creativity, Relationships,
// Mind, Rest, Challenge）を管理する。
// Knowledge / Reflection / Memory を各領域へ紐づけ。
//
// 重要:
// - 「タスク管理化」しない
// - 領域は「人生の見取り図」であってTODOリストではない
//

import { prisma } from "@/lib/prisma";
import type { LifeAreaType } from "./types";
import { LifeAreaSummary, LifeAreaPayload } from "./types";

const LIFE_AREA_LABELS: Record<LifeAreaType, string> = {
    Health: "健康",
    Learning: "学び",
    Work: "仕事",
    Creativity: "創造",
    Relationships: "人間関係",
    Mind: "心",
    Rest: "休息",
    Challenge: "挑戦",
};

const LIFE_AREA_DESCRIPTIONS: Record<LifeAreaType, string> = {
    Health: "身体と心の健康状態",
    Learning: "知識・スキルの習得",
    Work: "仕事・キャリア",
    Creativity: "創造的な表現",
    Relationships: "人との繋がり",
    Mind: "内面の静けさ",
    Rest: "休憩と回復",
    Challenge: "新たな挑戦",
};

/**
 * 全LifeAreaを初期化（初回アクセス時）
 */
export async function initializeLifeAreas(userId: string): Promise<void> {
    const existing = await prisma.lifeArea.findMany({
        where: { userId },
        select: { type: true },
    });

    const existingTypes = new Set(existing.map((a) => a.type));
    const allTypes: LifeAreaType[] = ["Health", "Learning", "Work", "Creativity", "Relationships", "Mind", "Rest", "Challenge"];

    const toCreate = allTypes.filter((t) => !existingTypes.has(t as any));

    if (toCreate.length > 0) {
        await prisma.lifeArea.createMany({
            data: toCreate.map((type) => ({
                userId,
                type: type as any,
                title: LIFE_AREA_LABELS[type],
                description: LIFE_AREA_DESCRIPTIONS[type],
            })),
            skipDuplicates: true,
        });
    }
}

/**
 * LifeAreaのサマリーを取得
 */
export async function getLifeAreaSummaries(userId: string): Promise<LifeAreaSummary[]> {
    await initializeLifeAreas(userId);

    const areas = await prisma.lifeArea.findMany({
        where: { userId },
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 各領域のアクティビティを集計
    const summaries = await Promise.all(
        areas.map(async (area) => {
            const type = area.type as unknown as LifeAreaType;

            // 30日間のアクティビティ数をカウント
            const [reflectionCount, memoryCount, energyCount, meaningCount] = await Promise.all([
                prisma.lifeReflection.count({
                    where: { userId, areaType: type as any, createdAt: { gte: thirtyDaysAgo } },
                }),
                prisma.userMemory.count({
                    where: { userId, createdAt: { gte: thirtyDaysAgo } },
                }),
                prisma.energyState.count({
                    where: { userId, areaType: type as any, createdAt: { gte: thirtyDaysAgo } },
                }),
                prisma.meaningSignal.count({
                    where: { userId, areaType: type as any, createdAt: { gte: thirtyDaysAgo } },
                }),
            ]);

            const recentActivity = reflectionCount + memoryCount + energyCount + meaningCount;

            // エネルギー平均値
            const energyStates = await prisma.energyState.findMany({
                where: { userId, areaType: type as any },
                orderBy: { createdAt: "desc" },
                take: 10,
                select: { intensity: true },
            });
            const averageEnergy = energyStates.length > 0
                ? Math.round(energyStates.reduce((s, e) => s + e.intensity, 0) / energyStates.length)
                : null;

            // 最新の意味シグナル
            const recentSignals = await prisma.meaningSignal.findMany({
                where: { userId, areaType: type as any, confidence: { gte: 0.2 } },
                orderBy: { createdAt: "desc" },
                take: 3,
                select: {
                    id: true,
                    signalType: true,
                    description: true,
                    confidence: true,
                    areaType: true,
                    relatedMemoryIds: true,
                    createdAt: true,
                },
            });

            return {
                type,
                title: area.title,
                description: area.description,
                recentActivity,
                averageEnergy,
                recentSignals: recentSignals.map((s) => ({
                    id: s.id,
                    signalType: s.signalType as any,
                    description: s.description,
                    confidence: s.confidence,
                    areaType: s.areaType as unknown as LifeAreaType | null,
                    relatedMemoryIds: s.relatedMemoryIds,
                    createdAt: s.createdAt,
                })),
            };
        })
    );

    return summaries.sort((a, b) => b.recentActivity - a.recentActivity);
}

/**
 * 特定のLifeAreaの詳細情報を取得
 */
export async function getLifeAreaDetail(
    userId: string,
    areaType: LifeAreaType
): Promise<LifeAreaSummary | null> {
    const summaries = await getLifeAreaSummaries(userId);
    return summaries.find((s) => s.type === areaType) || null;
}

/**
 * LifeAreaの説明を更新
 */
export async function updateLifeArea(
    userId: string,
    type: LifeAreaType,
    data: Partial<LifeAreaPayload>
): Promise<void> {
    await prisma.lifeArea.updateMany({
        where: { userId, type: type as any },
        data: {
            ...(data.title ? { title: data.title } : {}),
            ...(data.description ? { description: data.description } : {}),
        },
    });
}