// ===================================================
// YOHAKU Queue & Worker — Retry Mechanism
// ===================================================
//
// Handles retry scheduling, exponential backoff,
// and dead letter management for failed jobs.
// ===================================================

import { PrismaQueueProvider } from "../providers/prisma";
import type { Job } from "../types";

/**
 * Retries a failed job immediately.
 */
export async function retryJob(
  jobId: string,
  provider: PrismaQueueProvider,
): Promise<void> {
  await provider.retry(jobId);
  console.log(`[queue/retry] Job queued for retry: ${jobId.slice(0, 8)}`);
}

/**
 * Retries all failed jobs.
 */
export async function retryAllFailedJobs(
  provider: PrismaQueueProvider,
): Promise<number> {
  const { prisma } = await import("@/lib/prisma");
  const failedJobs = await prisma.aIJob.findMany({
    where: {
      status: "failed",
      retryCount: { lt: prisma.aIJob.fields.maxRetries },
    },
  });

  let count = 0;
  for (const job of failedJobs) {
    await provider.retry(job.id);
    count++;
  }

  console.log(`[queue/retry] Retried ${count} failed jobs`);
  return count;
}

/**
 * Moves all exhausted retry jobs to dead letter.
 * These are jobs that have exceeded maxRetries but are still in "pending" state.
 */
export async function deadLetterExhaustedJobs(
  provider: PrismaQueueProvider,
): Promise<number> {
  const { prisma } = await import("@/lib/prisma");
  const exhaustedJobs = await prisma.aIJob.findMany({
    where: {
      status: "pending",
      retryCount: { gte: prisma.aIJob.fields.maxRetries },
    },
  });

  let count = 0;
  for (const job of exhaustedJobs) {
    await provider.deadLetter(job.id, "Exceeded maximum retries");
    count++;
  }

  console.log(`[queue/dead-letter] Moved ${count} exhausted jobs to dead letter`);
  return count;
}

/**
 * Gets all dead letter jobs.
 */
export async function getDeadLetterJobs(): Promise<Job[]> {
  const { prisma } = await import("@/lib/prisma");
  const records = await prisma.aIJob.findMany({
    where: { status: "failed" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return records.map((r: any) => ({
    id: r.id,
    jobType: r.jobType,
    payload: r.input as Record<string, unknown>,
    status: "dead_letter" as const,
    priority: r.priority ?? 0,
    retryCount: r.retryCount ?? 0,
    maxRetries: r.maxRetries ?? 3,
    scheduledAt: r.scheduledAt ?? null,
    startedAt: r.startedAt ?? null,
    completedAt: r.completedAt ?? null,
    failedAt: r.failedAt ?? null,
    error: r.error ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}