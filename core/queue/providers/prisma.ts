// ===================================================
// YOHAKU Queue & Worker — Prisma Queue Provider
// ===================================================
//
// Database-backed queue using the AIJob model.
// Suitable for development, staging, and moderate workloads.
//
// For high-throughput production workloads, replace with:
// - Supabase Queue (using pgmq)
// - Redis / BullMQ
// - Google Cloud Tasks
// - RabbitMQ / Kafka
// ===================================================

import { prisma } from "@/lib/prisma";
import type { Job, EnqueueJobInput, IQueueProvider, JobStatus } from "../types";
import { getDefaultMaxRetries } from "../types/registry";

/**
 * Prisma-backed queue provider.
 * Jobs are stored in the AIJob table.
 */
export class PrismaQueueProvider implements IQueueProvider {
  /**
   * Enqueues a new job.
   */
  async enqueue(input: EnqueueJobInput): Promise<Job> {
    const maxRetries = input.maxRetries ?? getDefaultMaxRetries(input.jobType);

    const record = await prisma.aIJob.create({
      data: {
        jobType: input.jobType,
        userId: (input.payload as any)?.userId ?? "system",
        status: "pending",
        priority: input.priority ?? 0,
        input: input.payload as any,
        maxRetries,
        retryCount: 0,
      },
    });

    return mapJob(record);
  }

  /**
   * Dequeues the next pending job.
   */
  async dequeue(jobTypes?: string[]): Promise<Job | null> {
    const where: any = {
      status: "pending",
    };

    if (jobTypes && jobTypes.length > 0) {
      where.jobType = { in: jobTypes };
    }

    const record = await prisma.aIJob.findFirst({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    if (!record) return null;

    // Mark as running
    const updated = await prisma.aIJob.update({
      where: { id: record.id },
      data: {
        status: "processing",
        startedAt: new Date(),
      },
    });

    return mapJob(updated);
  }

  /**
   * Marks a job as completed.
   */
  async complete(jobId: string): Promise<void> {
    await prisma.aIJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });
  }

  /**
   * Marks a job as failed.
   */
  async fail(jobId: string, error: string): Promise<void> {
    const job = await prisma.aIJob.findUnique({ where: { id: jobId } });
    if (!job) return;

    const newRetryCount = job.retryCount + 1;

    if (newRetryCount < job.maxRetries) {
      await prisma.aIJob.update({
        where: { id: jobId },
        data: {
          status: "pending",
          retryCount: newRetryCount,
          lastError: error,
        },
      });
    } else {
      await prisma.aIJob.update({
        where: { id: jobId },
        data: {
          status: "failed",
          retryCount: newRetryCount,
          lastError: error,
        },
      });
    }
  }

  /**
   * Retries a failed job.
   */
  async retry(jobId: string): Promise<void> {
    await prisma.aIJob.update({
      where: { id: jobId },
      data: {
        status: "pending",
        retryCount: 0,
        lastError: null,
      },
    });
  }

  /**
   * Moves a job to dead letter queue.
   */
  async deadLetter(jobId: string, error: string): Promise<void> {
    await prisma.aIJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        lastError: error,
      },
    });
  }

  /**
   * Gets a job by ID.
   */
  async getJob(jobId: string): Promise<Job | null> {
    const record = await prisma.aIJob.findUnique({ where: { id: jobId } });
    return record ? mapJob(record) : null;
  }

  /**
   * Gets count of pending jobs.
   */
  async getPendingCount(jobType?: string): Promise<number> {
    const where: any = { status: "pending" };
    if (jobType) where.jobType = jobType;
    return prisma.aIJob.count({ where });
  }

  /**
   * Gets count of failed jobs.
   */
  async getFailedCount(): Promise<number> {
    return prisma.aIJob.count({ where: { status: "failed" } });
  }

  /**
   * Gets count of dead letter jobs.
   */
  async getDeadLetterCount(): Promise<number> {
    return prisma.aIJob.count({ where: { status: "failed" } });
  }

  /**
   * Gets health information.
   */
  async getHealth(): Promise<{
    pending: number;
    running: number;
    completed: number;
    failed: number;
    byJobType: Record<string, number>;
  }> {
    const [pending, running, completed, failed, byType] = await Promise.all([
      prisma.aIJob.count({ where: { status: "pending" } }),
      prisma.aIJob.count({ where: { status: "processing" } }),
      prisma.aIJob.count({ where: { status: "completed" } }),
      prisma.aIJob.count({ where: { status: "failed" } }),
      prisma.aIJob.groupBy({
        by: ["jobType"],
        _count: true,
      }),
    ]);

    return {
      pending,
      running,
      completed,
      failed,
      byJobType: Object.fromEntries(byType.map((j) => [j.jobType, j._count])),
    };
  }
}

/**
 * Maps a Prisma AIJob record to our Job type.
 */
function mapJob(record: any): Job {
  return {
    id: record.id,
    jobType: record.jobType,
    payload: record.input as Record<string, unknown>,
    status: mapStatus(record.status),
    priority: record.priority ?? 0,
    retryCount: record.retryCount ?? 0,
    maxRetries: record.maxRetries ?? 3,
    scheduledAt: null,
    startedAt: record.startedAt ?? null,
    completedAt: record.completedAt ?? null,
    failedAt: null,
    error: record.lastError ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Maps Prisma JobStatus enum to our JobStatus type.
 */
function mapStatus(status: string): JobStatus {
  switch (status) {
    case "pending":
      return "pending";
    case "processing":
      return "running";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    default:
      return "pending";
  }
}