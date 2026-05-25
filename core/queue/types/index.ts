// ===================================================
// YOHAKU Queue & Worker — Type Definitions
// ===================================================

/**
 * Job statuses in the job lifecycle.
 */
export type JobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "retrying"
  | "dead_letter";

/**
 * Core job model — every job in the system follows this shape.
 */
export type Job = {
  id: string;
  jobType: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  priority: number;
  retryCount: number;
  maxRetries: number;
  scheduledAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Input for enqueuing a new job.
 */
export type EnqueueJobInput = {
  jobType: string;
  payload: Record<string, unknown>;
  priority?: number;
  maxRetries?: number;
  scheduledAt?: Date;
};

/**
 * Worker function signature.
 * Receives a job and returns a result or throws on error.
 */
export type WorkerFn<TInput = unknown, TOutput = unknown> = (
  job: Job,
) => Promise<TOutput>;

/**
 * Worker definition — maps a jobType to a handler.
 */
export type WorkerDefinition = {
  /** The job type this worker handles */
  jobType: string;
  /** Human-readable name */
  name: string;
  /** Description of what this worker does */
  description: string;
  /** The handler function */
  handle: WorkerFn;
  /** Max retries for jobs handled by this worker */
  maxRetries?: number;
  /** Concurrency limit for this worker */
  concurrency?: number;
};

/**
 * Queue provider interface.
 * Allows swapping the underlying queue implementation.
 */
export interface IQueueProvider {
  enqueue(input: EnqueueJobInput): Promise<Job>;
  dequeue(jobTypes?: string[]): Promise<Job | null>;
  complete(jobId: string): Promise<void>;
  fail(jobId: string, error: string): Promise<void>;
  retry(jobId: string): Promise<void>;
  deadLetter(jobId: string, error: string): Promise<void>;
  getJob(jobId: string): Promise<Job | null>;
  getPendingCount(jobType?: string): Promise<number>;
  getFailedCount(): Promise<number>;
  getDeadLetterCount(): Promise<number>;
}

/**
 * Job registry entry.
 */
export type JobRegistryEntry = {
  jobType: string;
  description: string;
  version: number;
  maxRetries: number;
  concurrency: number;
};

/**
 * Queue health information.
 */
export type QueueHealth = {
  totalJobs: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  retrying: number;
  deadLetter: number;
  byJobType: Record<string, number>;
};

// ---------------------------------------------------------------------------
// Known Job Types
// ---------------------------------------------------------------------------

export const JOB_TYPES = {
  // AI Jobs
  AI_SUMMARY: "ai.summary",
  AI_REFLECTION: "ai.reflection",
  AI_MEMORY_EXTRACTION: "ai.memory_extraction",
  AI_MODERATION_SCAN: "ai.moderation_scan",

  // Moderation Jobs
  MODERATION_AUTO_REVIEW: "moderation.auto_review",
  MODERATION_CONTENT_SCAN: "moderation.content_scan",

  // Analytics Jobs
  ANALYTICS_DAILY_AGGREGATION: "analytics.daily_aggregation",
  ANALYTICS_WEEKLY_REPORT: "analytics.weekly_report",

  // Notification Jobs
  NOTIFICATION_EMAIL: "notification.email",
  NOTIFICATION_PUSH: "notification.push",

  // Maintenance Jobs
  MAINTENANCE_AUDIT_CLEANUP: "maintenance.audit_cleanup",
  MAINTENANCE_STATE_CLEANUP: "maintenance.state_cleanup",

  // User Jobs
  USER_WELCOME_EMAIL: "user.welcome_email",
  USER_DATA_EXPORT: "user.data_export",

  // Safety Jobs
  SAFETY_ANALYSIS: "safety.analysis",
  SAFETY_AGGREGATION: "safety.aggregation",
  SAFETY_ESCALATION: "safety.escalation",
} as const;