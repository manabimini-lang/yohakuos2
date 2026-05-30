import { prisma } from '../prisma';

type JobHandler = (job: { id: string; userId: string; input: any }) => Promise<void>;

const handlers = new Map<string, JobHandler>();

export function registerJobHandler(jobType: string, handler: JobHandler) {
    handlers.set(jobType, handler);
}

export async function enqueueJob(params: {
    userId: string;
    jobType: string;
    input: any;
    priority?: number;
}) {
    return prisma.aIJob.create({
        data: {
            userId: params.userId,
            jobType: params.jobType,
            input: params.input,
            priority: params.priority ?? 0,
            status: 'pending',
        },
    });
}

export async function processNextJob(): Promise<void> {
    // Transaction-based exclusive lock
    const job = await prisma.$transaction(async (tx) => {
        const next = await tx.aIJob.findFirst({
            where: { 
                status: 'pending',
                jobType: { in: Array.from(handlers.keys()) }
            },
            orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        });
        if (!next) return null;

        await tx.aIJob.update({
            where: { id: next.id },
            data: { status: 'processing', startedAt: new Date() },
        });
        return next;
    });

    if (!job) return;

    try {
        const handler = handlers.get(job.jobType);
        if (!handler) {
            throw new Error(`No handler registered for job type: ${job.jobType}`);
        }

        await handler({ id: job.id, userId: job.userId, input: job.input as any });

        await prisma.aIJob.update({
            where: { id: job.id },
            data: { status: 'completed', completedAt: new Date() },
        });
    } catch (error: any) {
        const currentJob = await prisma.aIJob.findUnique({ where: { id: job.id } });
        if (!currentJob) return;

        if (currentJob.retryCount < currentJob.maxRetries) {
            await prisma.aIJob.update({
                where: { id: job.id },
                data: {
                    status: 'pending',
                    retryCount: { increment: 1 },
                    lastError: error.message,
                },
            });
        } else {
            await prisma.aIJob.update({
                where: { id: job.id },
                data: { status: 'failed', lastError: error.message },
            });
        }
    }
}

export async function processQueueBatch(batchSize: number = 5): Promise<number> {
    let processed = 0;
    for (let i = 0; i < batchSize; i++) {
        await processNextJob();
        processed++;
    }
    return processed;
}