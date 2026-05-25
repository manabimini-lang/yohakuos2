// ===================================================
// YOHAKU Queue & Worker — Job Registry
// ===================================================
//
// The registry is the single source of truth for all job types.
// Every job type must be registered here.
// ===================================================

import type { JobRegistryEntry } from "./index";

export const JOB_REGISTRY: JobRegistryEntry[] = [
  // ── AI Jobs ──
  {
    jobType: "ai.summary",
    description: "Generate AI summary for content or reflection",
    version: 1,
    maxRetries: 3,
    concurrency: 2,
  },
  {
    jobType: "ai.reflection",
    description: "Process AI reflection generation",
    version: 1,
    maxRetries: 3,
    concurrency: 2,
  },
  {
    jobType: "ai.memory_extraction",
    description: "Extract memories from user input via AI",
    version: 1,
    maxRetries: 2,
    concurrency: 1,
  },
  {
    jobType: "ai.moderation_scan",
    description: "Scan content for moderation via AI",
    version: 1,
    maxRetries: 2,
    concurrency: 1,
  },

  // ── Moderation Jobs ──
  {
    jobType: "moderation.auto_review",
    description: "Auto-review reported content",
    version: 1,
    maxRetries: 3,
    concurrency: 3,
  },
  {
    jobType: "moderation.content_scan",
    description: "Scan content for policy violations",
    version: 1,
    maxRetries: 3,
    concurrency: 3,
  },

  // ── Analytics Jobs ──
  {
    jobType: "analytics.daily_aggregation",
    description: "Aggregate daily analytics data",
    version: 1,
    maxRetries: 3,
    concurrency: 1,
  },
  {
    jobType: "analytics.weekly_report",
    description: "Generate weekly analytics report",
    version: 1,
    maxRetries: 3,
    concurrency: 1,
  },

  // ── Notification Jobs ──
  {
    jobType: "notification.email",
    description: "Send an email notification",
    version: 1,
    maxRetries: 5,
    concurrency: 5,
  },
  {
    jobType: "notification.push",
    description: "Send a push notification",
    version: 1,
    maxRetries: 3,
    concurrency: 10,
  },

  // ── Maintenance Jobs ──
  {
    jobType: "maintenance.audit_cleanup",
    description: "Cleanup old audit logs",
    version: 1,
    maxRetries: 2,
    concurrency: 1,
  },
  {
    jobType: "maintenance.state_cleanup",
    description: "Cleanup stale state transitions",
    version: 1,
    maxRetries: 2,
    concurrency: 1,
  },

  // ── User Jobs ──
  {
    jobType: "user.welcome_email",
    description: "Send welcome email to new users",
    version: 1,
    maxRetries: 3,
    concurrency: 10,
  },
  {
    jobType: "user.data_export",
    description: "Export user data for download",
    version: 1,
    maxRetries: 2,
    concurrency: 1,
  },

  // ── Safety Jobs ──
  {
    jobType: "safety.analysis",
    description: "Analyze entity risk level based on signals",
    version: 1,
    maxRetries: 3,
    concurrency: 3,
  },
  {
    jobType: "safety.aggregation",
    description: "Aggregate risk signals and compute trend trends",
    version: 1,
    maxRetries: 3,
    concurrency: 1,
  },
  {
    jobType: "safety.escalation",
    description: "Process escalation workflows",
    version: 1,
    maxRetries: 3,
    concurrency: 2,
  },
];

/**
 * Gets a registry entry by job type.
 */
export function getJobRegistryEntry(jobType: string): JobRegistryEntry | undefined {
  return JOB_REGISTRY.find((j) => j.jobType === jobType);
}

/**
 * Gets default max retries for a job type.
 */
export function getDefaultMaxRetries(jobType: string): number {
  return getJobRegistryEntry(jobType)?.maxRetries ?? 3;
}

/**
 * Gets all registered job types.
 */
export function getAllJobTypes(): string[] {
  return JOB_REGISTRY.map((j) => j.jobType);
}