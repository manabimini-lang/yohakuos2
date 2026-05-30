"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
    enqueueInnerLandscapeGeneration,
    enqueueReturningQuestionsExtraction,
    enqueueResonanceWeatherGeneration,
} from "@/lib/life/queue-life-jobs";

/**
 * Enqueue Inner Landscape generation jobs.
 * Returns the number of active content items (to determine if user has enough data).
 */
export async function enqueueLandscapeGenerationAction(): Promise<{
    success: boolean;
    itemCount: number;
    error?: string;
}> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, itemCount: 0, error: "認証が必要です" };
    }

    const userId = session.user.id;

    // Check item count
    const itemCount = await prisma.contentItem.count({
        where: { userId, memoryState: "active" },
    });

    if (itemCount < 5) {
        return { success: false, itemCount, error: "データが少なすぎます" };
    }

    try {
        await Promise.all([
            enqueueInnerLandscapeGeneration(userId),
            enqueueReturningQuestionsExtraction(userId),
            enqueueResonanceWeatherGeneration(userId),
        ]);
        return { success: true, itemCount };
    } catch (err: any) {
        return { success: false, itemCount, error: err?.message || "エラーが発生しました" };
    }
}

/**
 * Get current user's content item count.
 */
export async function getLandscapeReadinessAction(): Promise<{
    itemCount: number;
    hasLandscape: boolean;
    hasPendingJob: boolean;
}> {
    const session = await auth();
    if (!session?.user?.id) {
        return { itemCount: 0, hasLandscape: false, hasPendingJob: false };
    }

    const userId = session.user.id;

    const [itemCount, landscape, pendingJob] = await Promise.all([
        prisma.contentItem.count({ where: { userId, memoryState: "active" } }),
        prisma.innerLandscape.findFirst({
            where: { userId },
            orderBy: { generatedAt: "desc" },
            select: { id: true },
        }),
        prisma.aIJob.findFirst({
            where: {
                userId,
                jobType: "generate_inner_landscape",
                status: { in: ["pending", "processing"] },
            },
            select: { id: true },
        }),
    ]);

    return {
        itemCount,
        hasLandscape: !!landscape,
        hasPendingJob: !!pendingJob,
    };
}
