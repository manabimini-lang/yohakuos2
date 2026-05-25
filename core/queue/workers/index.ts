// ===================================================
// YOHAKU Queue & Worker — Worker Registry & Runner
// ===================================================
//
// Workers are registered here and run via the worker runner.
// Each worker handles a specific job type.
// ===================================================

import type { Job, WorkerDefinition } from "../types";
import { PrismaQueueProvider } from "../providers/prisma";

// ---------------------------------------------------------------------------
// Worker Registry
// ---------------------------------------------------------------------------

const workers = new Map<string, WorkerDefinition>();

/**
 * Registers a worker for a specific job type.
 */
export function registerWorker(worker: WorkerDefinition): void {
  if (workers.has(worker.jobType)) {
    console.warn(`[queue] Worker already registered for "${worker.jobType}". Overwriting.`);
  }
  workers.set(worker.jobType, worker);
  console.log(`[queue] Worker registered: ${worker.name} (${worker.jobType})`);
}

/**
 * Gets a worker for a job type.
 */
export function getWorker(jobType: string): WorkerDefinition | undefined {
  return workers.get(jobType);
}

/**
 * Gets all registered workers.
 */
export function getAllWorkers(): WorkerDefinition[] {
  return Array.from(workers.values());
}

/**
 * Checks if a worker is registered for a job type.
 */
export function hasWorker(jobType: string): boolean {
  return workers.has(jobType);
}

// ---------------------------------------------------------------------------
// Worker Runner
// ---------------------------------------------------------------------------

/**
 * Runs a single job through its registered worker.
 *
 * 1. Gets the worker for the job type
 * 2. Executes the worker handler
 * 3. Marks as completed or failed
 */
export async function runJob(
  job: Job,
  provider: PrismaQueueProvider,
): Promise<void> {
  const worker = getWorker(job.jobType);

  if (!worker) {
    console.warn(`[queue] No worker registered for job type: ${job.jobType}`);
    await provider.fail(job.id, `No worker registered for: ${job.jobType}`);
    return;
  }

  try {
    await worker.handle(job);
    await provider.complete(job.id);
    console.log(`[queue] Job completed: ${job.jobType} (${job.id.slice(0, 8)})`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[queue] Job failed: ${job.jobType} (${job.id.slice(0, 8)}): ${errorMessage}`);
    await provider.fail(job.id, errorMessage);
  }
}

/**
 * Processes the next available job from the queue.
 * Returns true if a job was processed, false if queue is empty.
 */
export async function processNextJob(
  provider: PrismaQueueProvider,
  jobTypes?: string[],
): Promise<boolean> {
  const job = await provider.dequeue(jobTypes);

  if (!job) {
    return false;
  }

  await runJob(job, provider);
  return true;
}

/**
 * Continuously processes jobs from the queue.
 * Runs in a loop with a configurable interval.
 *
 * @param provider - The queue provider
 * @param options - Polling options
 */
export async function startWorkerLoop(
  provider: PrismaQueueProvider,
  options: {
    jobTypes?: string[];
    intervalMs?: number;
    maxConsecutive?: number;
  } = {},
): Promise<void> {
  const intervalMs = options.intervalMs ?? 1000; // 1 second
  const maxConsecutive = options.maxConsecutive ?? 10;
  let consecutive = 0;

  console.log(`[queue] Worker loop started (interval: ${intervalMs}ms)`);

  while (true) {
    const processed = await processNextJob(provider, options.jobTypes);

    if (processed) {
      consecutive++;
      if (consecutive >= maxConsecutive) {
        // Yield to event loop to prevent blocking
        consecutive = 0;
        await sleep(intervalMs);
      }
    } else {
      consecutive = 0;
      await sleep(intervalMs);
    }
  }
}

/**
 * Processes all pending jobs once (non-looping).
 * Useful for one-off processing or webhook-triggered processing.
 */
export async function processAllPendingJobs(
  provider: PrismaQueueProvider,
  jobTypes?: string[],
): Promise<number> {
  let count = 0;
  let processed = true;

  while (processed) {
    processed = await processNextJob(provider, jobTypes);
    if (processed) count++;
  }

  return count;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}