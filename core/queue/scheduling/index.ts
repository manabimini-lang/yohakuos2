// ===================================================
// YOHAKU Queue & Worker — Job Scheduling
// ===================================================
//
// Schedules recurring jobs and manages cron-like schedules.
// ===================================================

import { PrismaQueueProvider } from "../providers/prisma";

/**
 * Scheduled job definition.
 */
type ScheduledJob = {
  jobType: string;
  description: string;
  cronExpression: string; // Not parsed yet — for future use
  intervalMs: number;
  payload?: Record<string, unknown>;
};

/**
 * Built-in scheduled jobs.
 */
const SCHEDULED_JOBS: ScheduledJob[] = [
  {
    jobType: "analytics.daily_aggregation",
    description: "Daily analytics aggregation at midnight",
    cronExpression: "0 0 * * *",
    intervalMs: 24 * 60 * 60 * 1000, // 24 hours
    payload: {},
  },
  {
    jobType: "maintenance.audit_cleanup",
    description: "Cleanup old audit logs weekly",
    cronExpression: "0 0 * * 0",
    intervalMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    payload: { retentionDays: 90 },
  },
  {
    jobType: "maintenance.state_cleanup",
    description: "Cleanup stale state transitions monthly",
    cronExpression: "0 0 1 * *",
    intervalMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    payload: { retentionDays: 365 },
  },
];

/**
 * Starts the scheduler loop.
 * Checks every minute if any scheduled jobs need to be enqueued.
 */
export async function startSchedulerLoop(
  provider: PrismaQueueProvider,
): Promise<void> {
  console.log("[queue/scheduler] Scheduler loop started");

  // Track last enqueue time per job type
  const lastEnqueued = new Map<string, number>();

  while (true) {
    const now = Date.now();

    for (const scheduled of SCHEDULED_JOBS) {
      const lastTime = lastEnqueued.get(scheduled.jobType) ?? 0;

      if (now - lastTime >= scheduled.intervalMs) {
        await provider.enqueue({
          jobType: scheduled.jobType,
          payload: {
            ...scheduled.payload,
            scheduledAt: new Date().toISOString(),
          },
        });
        lastEnqueued.set(scheduled.jobType, now);
        console.log(`[queue/scheduler] Enqueued: ${scheduled.jobType}`);
      }
    }

    await sleep(60_000); // Check every minute
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}