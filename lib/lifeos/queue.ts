// ===================================================
// YOHAKU Life OS — Queue / Async Job Definitions
// ===================================================
//
// AIJob Queue へ以下を追加:
// - seasonal_reflection
// - life_balance_analysis
// - meaning_extraction
// - conversation_compression
// - emotional_cooldown_update
//

import { registerJobHandler, enqueueJob } from "@/lib/memory/queue";

/**
 * 全Life OSジョブハンドラを登録
 */
export function registerLifeOSJobHandlers(): void {
    // seasonal_reflection
    registerJobHandler("seasonal_reflection", async (job) => {
        const { generateSeasonalReflection } = await import("./seasonal");
        const { prisma } = await import("@/lib/prisma");

        const { type } = job.input as { type: "weekly" | "monthly" | "seasonal" | "half_year" | "yearly" };
        const reflection = await generateSeasonalReflection(job.userId, type);

        // Save as life reflection
        await prisma.lifeReflection.create({
            data: {
                userId: job.userId,
                type: type as any,
                title: `${type}振り返り`,
                content: reflection.summary,
                confidence: reflection.confidence,
                sourceIds: [],
            },
        });

        // Check if seasonal - save to seasonal summary
        if (type === "seasonal") {
            await prisma.seasonalSummary.upsert({
                where: {
                    userId_period: { userId: job.userId, period: reflection.period },
                },
                update: {
                    summary: reflection.summary,
                    themes: reflection.themes,
                    confidence: reflection.confidence,
                },
                create: {
                    userId: job.userId,
                    period: reflection.period,
                    season: reflection.season,
                    year: reflection.year,
                    summary: reflection.summary,
                    themes: reflection.themes,
                    confidence: reflection.confidence,
                    startDate: reflection.startDate,
                    endDate: reflection.endDate,
                },
            });
        }

        await prisma.aIJob.update({
            where: { id: job.id },
            data: {
                output: {
                    period: reflection.period,
                    confidence: reflection.confidence,
                    themes: reflection.themes.length,
                },
            },
        });
    });

    // life_balance_analysis
    registerJobHandler("life_balance_analysis", async (job) => {
        const { analyzeLifeBalance } = await import("./balance");
        const { prisma } = await import("@/lib/prisma");

        const analysis = await analyzeLifeBalance(job.userId);

        await prisma.aIJob.update({
            where: { id: job.id },
            data: {
                output: {
                    signalCount: analysis.signals.length,
                    hasOverload: analysis.learningOverload !== null,
                    hasExhaustion: analysis.exhaustionTendency !== null,
                    confidence: analysis.confidence,
                },
            },
        });
    });

    // meaning_extraction
    registerJobHandler("meaning_extraction", async (job) => {
        const { extractMeaningSignals } = await import("./meaning");
        const { prisma } = await import("@/lib/prisma");

        const analysis = await extractMeaningSignals(job.userId);

        await prisma.aIJob.update({
            where: { id: job.id },
            data: {
                output: {
                    signalCount: analysis.signals.length,
                    patterns: analysis.patterns,
                    confidence: analysis.confidence,
                },
            },
        });
    });

    // conversation_compression
    registerJobHandler("conversation_compression", async (job) => {
        const { compressConversation } = await import("./conversation-compression");
        const { prisma } = await import("@/lib/prisma");

        const { conversationId } = job.input as { conversationId: string };
        const summaries = await compressConversation(conversationId);

        await prisma.aIJob.update({
            where: { id: job.id },
            data: {
                output: {
                    summaryCount: summaries.length,
                    summaryTypes: summaries.map((s) => s.summaryType),
                },
            },
        });
    });

    // emotional_cooldown_update
    registerJobHandler("emotional_cooldown_update", async (job) => {
        const { createEmotionalCooldown } = await import("./boundary");
        const { prisma } = await import("@/lib/prisma");

        const { cooldownType, intensity, durationHours } = job.input as {
            cooldownType: "emotional_overload" | "anxiety_repetition" | "reflection_cooldown";
            intensity: number;
            durationHours: number;
        };

        await createEmotionalCooldown(job.userId, cooldownType, intensity, durationHours);

        await prisma.aIJob.update({
            where: { id: job.id },
            data: {
                output: {
                    cooldownType,
                    intensity,
                    durationHours,
                },
            },
        });
    });
}

export { enqueueJob };