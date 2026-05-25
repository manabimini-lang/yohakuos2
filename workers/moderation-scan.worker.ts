// ===================================================
// YOHAKU Workers — Moderation Scan Worker
// ===================================================
//
// Scans content for policy violations.
// Triggered by moderation.content_scan jobs.
// ===================================================

import type { WorkerDefinition } from "@/core/queue/types";

export const moderationScanWorker: WorkerDefinition = {
  jobType: "moderation.content_scan",
  name: "Moderation Scan Worker",
  description: "Scans content for policy violations",
  maxRetries: 3,
  concurrency: 3,
  handle: async (job) => {
    const { contentId, contentText } = job.payload as any;

    if (!contentId || !contentText) {
      throw new Error("contentId and contentText are required");
    }

    // Future: Run content through moderation pipeline
    // const result = await moderationService.scan(contentText);

    console.log(`[worker:moderation-scan] Scanning content: ${contentId}`);
  },
};