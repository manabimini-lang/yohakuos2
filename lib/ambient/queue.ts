import { registerJobHandler, enqueueJob } from "@/lib/memory/queue";

export function registerAmbientJobHandlers(): void {
    registerJobHandler("ambient_reflection", async (job) => {
        const { shouldSurface, recordSurface } = await import("./presence");
        const { generateCalmRecommendations, getSurfaceContext } = await import("./contextual-surface");
        const { prisma } = await import("@/lib/prisma");

        const decision = await shouldSurface(job.userId);
        if (!decision.shouldSurface) {
            await prisma.aIJob.update({
                where: { id: job.id },
                data: { output: { surfaced: false, reason: decision.reason } },
            });
            return;
        }

        const context = await getSurfaceContext(job.userId);
        const recommendations = await generateCalmRecommendations(job.userId, context);

        for (const rec of recommendations.slice(0, 2)) {
            await recordSurface(
                job.userId,
                "quiet_discovery",
                rec.title,
                rec.content,
                [],
                rec.confidence
            );
        }

        await prisma.aIJob.update({
            where: { id: job.id },
            data: { output: { surfaced: true, count: recommendations.length } },
        });
    });

    registerJobHandler("resonance_detection", async (job) => {
        const { detectResonancePatterns } = await import("./resonance");
        const { prisma } = await import("@/lib/prisma");

        const patterns = await detectResonancePatterns(job.userId);

        await prisma.aIJob.update({
            where: { id: job.id },
            data: { output: { patternsFound: patterns.length } },
        });
    });

    registerJobHandler("slow_feed_cleanup", async (job) => {
        const { clearOldFeedEntries } = await import("./slow-feed");
        const { prisma } = await import("@/lib/prisma");

        const deleted = await clearOldFeedEntries(job.userId);

        await prisma.aIJob.update({
            where: { id: job.id },
            data: { output: { deleted } },
        });
    });
}

export { enqueueJob };