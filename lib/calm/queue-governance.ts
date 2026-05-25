import { prisma } from "@/lib/prisma";
import { JobPriority, JOB_PRIORITY_MAP, DEFAULT_QUEUE_CONFIG } from "./types";
import { shouldExecuteJob } from "./cost";

export async function getPrioritizedJobs(userId?: string): Promise<any[]> {
    const where: any = { status: "pending" };
    if (userId) where.userId = userId;

    const jobs = await prisma.aIJob.findMany({
        where,
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        take: 50,
    });

    return jobs;
}

export async function shouldProcessJob(
    jobType: string,
    estimatedCost: number
): Promise<boolean> {
    const costCheck = await shouldExecuteJob(jobType, estimatedCost);
    if (!costCheck.execute) return false;

    const priority = JOB_PRIORITY_MAP[jobType] ?? JobPriority.LOW;
    const config = DEFAULT_QUEUE_CONFIG;

    if (priority <= JobPriority.LOW) {
        const recentJobs = await prisma.aIJob.count({
            where: {
                jobType,
                status: "completed",
                completedAt: { gte: new Date(Date.now() - config.lowPriorityIntervalMinutes * 60 * 1000) },
            },
        });

        if (recentJobs > 0) {
            return false;
        }
    }

    return true;
}

export async function getQueueHealth(): Promise<{
    pending: number;
    processing: number;
    failed: number;
    completed: number;
    stalledJobs: number;
}> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [pending, processing, failed, completed, stalledJobs] = await Promise.all([
        prisma.aIJob.count({ where: { status: "pending" } }),
        prisma.aIJob.count({ where: { status: "processing" } }),
        prisma.aIJob.count({ where: { status: "failed" } }),
        prisma.aIJob.count({ where: { status: "completed" } }),
        prisma.aIJob.count({
            where: {
                status: "processing",
                startedAt: { lt: oneHourAgo },
            },
        }),
    ]);

    return { pending, processing, failed, completed, stalledJobs };
}

export async function recoverStalledJobs(): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await prisma.aIJob.updateMany({
        where: {
            status: "processing",
            startedAt: { lt: oneHourAgo },
        },
        data: {
            status: "pending",
            error: "自動リカバリー: スタールジョブを再試行",
            retryCount: { increment: 1 },
        },
    });

    return result.count;
}