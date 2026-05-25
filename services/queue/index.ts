// ===================================================
// YOHAKU Queue & Worker — Queue Service
// ===================================================
//
// High-level queue service providing a clean public API.
// ===================================================

import { PrismaQueueProvider } from "@/core/queue/providers/prisma";
import { processAllPendingJobs, startWorkerLoop } from "@/core/queue/workers";
import {
  retryJob,
  retryAllFailedJobs,
  deadLetterExhaustedJobs,
  getDeadLetterJobs,
} from "@/core/queue/retry";
import { startSchedulerLoop } from "@/core/queue/scheduling";
import { registerAllWorkers } from "@/workers";
import { JOB_TYPES } from "@/core/queue/types";
import { getJobRegistryEntry, getAllJobTypes } from "@/core/queue/types/registry";
import type { EnqueueJobInput, Job, QueueHealth } from "@/core/queue/types";

// Re-export types
export type { EnqueueJobInput, Job, QueueHealth } from "@/core/queue/types";
export { JOB_TYPES } from "@/core/queue/types";

/**
 * Queue service — public API for all queue operations.
 */
export const queue = {
  /** Enqueue a new job */
  enqueue: async (input: EnqueueJobInput): Promise<Job> => {
    const provider = new PrismaQueueProvider();
    return provider.enqueue(input);
  },

  /** Get a job by ID */
  getJob: async (jobId: string): Promise<Job | null> => {
    const provider = new PrismaQueueProvider();
    return provider.getJob(jobId);
  },

  /** Retry a failed job */
  retry: async (jobId: string): Promise<void> => {
    const provider = new PrismaQueueProvider();
    await retryJob(jobId, provider);
  },

  /** Retry all failed jobs */
  retryAllFailed: async (): Promise<number> => {
    const provider = new PrismaQueueProvider();
    return retryAllFailedJobs(provider);
  },

  /** Get dead letter jobs */
  getDeadLetterJobs: async (): Promise<Job[]> => {
    return getDeadLetterJobs();
  },

  /** Get queue health statistics */
  getHealth: async (): Promise<QueueHealth> => {
    const provider = new PrismaQueueProvider();
    const health = await provider.getHealth();
    const totalPending = await provider.getPendingCount();

    return {
      ...health,
      totalJobs: health.pending + health.running + health.completed + health.failed,
      pending: health.pending,
      running: health.running,
      completed: health.completed,
      failed: health.failed,
      retrying: 0,
      deadLetter: 0,
      byJobType: health.byJobType,
    };
  },

  /** Get pending count for a specific job type */
  getPendingCount: async (jobType?: string): Promise<number> => {
    const provider = new PrismaQueueProvider();
    return provider.getPendingCount(jobType);
  },

  /** Get failed count */
  getFailedCount: async (): Promise<number> => {
    const provider = new PrismaQueueProvider();
    return provider.getFailedCount();
  },

  /** Process all pending jobs once */
  processAll: async (): Promise<number> => {
    const provider = new PrismaQueueProvider();
    return processAllPendingJobs(provider);
  },

  /** Get job registry info */
  getJobInfo: getJobRegistryEntry,

  /** Get all job types */
  getJobTypes: getAllJobTypes,

  /** Initialize the queue system */
  initialize: (): void => {
    registerAllWorkers();
    console.log("[queue] System initialized");
  },

  /** Start the worker loop (blocking) */
  startWorkerLoop: async (): Promise<void> => {
    const provider = new PrismaQueueProvider();
    await startWorkerLoop(provider);
  },

  /** Start the scheduler loop (blocking) */
  startSchedulerLoop: async (): Promise<void> => {
    const provider = new PrismaQueueProvider();
    await startSchedulerLoop(provider);
  },
};