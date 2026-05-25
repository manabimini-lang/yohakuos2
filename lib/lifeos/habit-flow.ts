// ===================================================
// YOHAKU Life OS — Habit Flow Layer
// ===================================================
//
// 「継続の流れ」を見るためのレイヤー。
// 習慣の継続・中断・再開・自然消滅を扱う。
//
// 重要:
// - habit tracker 化禁止
// - 「どのくらい続いているか」が目的
// - 「より多くやるべき」という圧力をかけない
//

import { prisma } from "@/lib/prisma";
import type { HabitFlowStatus, LifeAreaType } from "./types";
import { HabitFlowInfo, HabitFlowTrend } from "./types";

/**
 * ユーザーの習慣フロー一覧を取得
 */
export async function getHabitFlows(
    userId: string,
    status?: HabitFlowStatus
): Promise<HabitFlowInfo[]> {
    const where: any = { userId };
    if (status) where.status = status as any;

    const flows = await prisma.habitFlow.findMany({
        where,
        orderBy: [{ status: "asc" }, { startedAt: "desc" }],
        select: {
            id: true,
            title: true,
            category: true,
            status: true,
            intensity: true,
            areaType: true,
            startedAt: true,
            endedAt: true,
        },
    });

    return flows.map((f) => ({
        id: f.id,
        title: f.title,
        category: f.category,
        status: f.status as HabitFlowStatus,
        intensity: f.intensity,
        areaType: f.areaType as LifeAreaType | null,
        startedAt: f.startedAt,
        endedAt: f.endedAt,
        durationDays: Math.ceil(
            ((f.endedAt || new Date()).getTime() - f.startedAt.getTime()) /
            (1000 * 60 * 60 * 24)
        ),
    }));
}

/**
 * 習慣フローのトレンドを取得
 */
export async function getHabitFlowTrend(userId: string): Promise<HabitFlowTrend> {
    const allFlows = await getHabitFlows(userId);

    const active = allFlows.filter((f) => f.status === "active");
    const paused = allFlows.filter((f) => f.status === "paused");
    const naturallyEnded = allFlows.filter((f) => f.status === "naturally_ended");

    // 今週の変化を検出
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyChanges: string[] = [];

    const recentlyStarted = allFlows.filter(
        (f) => f.status === "active" && f.startedAt >= sevenDaysAgo
    );
    if (recentlyStarted.length > 0) {
        weeklyChanges.push(
            `${recentlyStarted.length}つの習慣が新しく始まりました`
        );
    }

    const recentlyEnded = allFlows.filter(
        (f) => f.endedAt && f.endedAt >= sevenDaysAgo
    );
    if (recentlyEnded.length > 0) {
        weeklyChanges.push(
            `${recentlyEnded.length}つの習慣が変化しました`
        );
    }

    return {
        active,
        paused,
        naturallyEnded,
        weeklyChanges,
    };
}

/**
 * 新しい習慣フローを開始
 */
export async function startHabitFlow(
    userId: string,
    data: {
        title: string;
        category?: string;
        intensity?: number;
        areaType?: LifeAreaType;
    }
): Promise<HabitFlowInfo> {
    const created = await prisma.habitFlow.create({
        data: {
            userId,
            title: data.title,
            category: data.category || null,
            intensity: data.intensity || 1,
            areaType: data.areaType || null,
            status: "active",
            startedAt: new Date(),
        },
    });

    return {
        id: created.id,
        title: created.title,
        category: created.category,
        status: created.status as HabitFlowStatus,
        intensity: created.intensity,
        areaType: created.areaType as LifeAreaType | null,
        startedAt: created.startedAt,
        endedAt: created.endedAt,
        durationDays: 1,
    };
}

/**
 * 習慣フローの状態を更新
 */
export async function updateHabitFlowStatus(
    habitFlowId: string,
    status: HabitFlowStatus
): Promise<void> {
    const data: any = { status };
    if (status === "completed" || status === "naturally_ended") {
        data.endedAt = new Date();
    }
    if (status === "active") {
        data.endedAt = null;
    }

    await prisma.habitFlow.update({
        where: { id: habitFlowId },
        data,
    });
}

/**
 * 習慣フローの強度を更新
 */
export async function updateHabitFlowIntensity(
    habitFlowId: string,
    intensity: number
): Promise<void> {
    const clamped = Math.max(1, Math.min(5, intensity));
    await prisma.habitFlow.update({
        where: { id: habitFlowId },
        data: { intensity: clamped },
    });
}

/**
 * 自然消滅した習慣を検出して更新
 * （30日以上更新がないactive習慣をnaturally_endedに）
 */
export async function detectNaturallyEndedHabits(userId: string): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.habitFlow.updateMany({
        where: {
            userId,
            status: "active",
            updatedAt: { lt: thirtyDaysAgo },
        },
        data: {
            status: "naturally_ended",
            endedAt: thirtyDaysAgo,
        },
    });

    return result.count;
}