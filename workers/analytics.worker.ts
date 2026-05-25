// ===================================================
// YOHAKU Workers — Analytics Worker
// ===================================================
//
// Aggregates analytics data on a schedule.
// Triggered by analytics.daily_aggregation jobs.
// ===================================================

import type { WorkerDefinition } from "@/core/queue/types";

export const analyticsWorker: WorkerDefinition = {
  jobType: "analytics.daily_aggregation",
  name: "Analytics Daily Aggregation Worker",
  description: "Aggregates daily analytics data from events",
  maxRetries: 3,
  concurrency: 1,
  handle: async (job) => {
    const { date } = job.payload as any;

    // Future: Aggregate analytics for the given date
    // await analyticsService.aggregateDaily(date ?? new Date().toISOString().split("T")[0]);

    console.log(`[worker:analytics] Aggregating analytics for: ${date ?? "today"}`);
  },
};