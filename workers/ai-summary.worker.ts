// ===================================================
// YOHAKU Workers — AI Summary Worker
// ===================================================
//
// Generates AI summaries for content and reflections.
// Triggered by ContentCreated or ReflectionCreated events.
// ===================================================

import type { WorkerDefinition } from "@/core/queue/types";

export const aiSummaryWorker: WorkerDefinition = {
  jobType: "ai.summary",
  name: "AI Summary Worker",
  description: "Generates AI summaries for content and reflections",
  maxRetries: 3,
  concurrency: 2,
  handle: async (job) => {
    const { contentId, contentType } = job.payload as any;

    if (!contentId) {
      throw new Error("contentId is required");
    }

    // Future: Call AI service to generate summary
    // const summary = await aiService.generateSummary(contentId, contentType);

    console.log(`[worker:ai-summary] Generating summary for ${contentType}: ${contentId}`);
  },
};