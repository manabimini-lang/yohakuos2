// ===================================================
// YOHAKU Workers — Registration
// ===================================================
//
// All workers are registered here.
// Call registerAllWorkers() at application startup.
// ===================================================

import { registerWorker } from "@/core/queue/workers";
import { aiSummaryWorker } from "./ai-summary.worker";
import { moderationScanWorker } from "./moderation-scan.worker";
import { analyticsWorker } from "./analytics.worker";
import { emailNotificationWorker, pushNotificationWorker } from "./notification.worker";
import { safetyAnalysisWorker, riskAggregationWorker, escalationWorker } from "./safety";

/**
 * Registers all workers with the queue system.
 */
export function registerAllWorkers(): void {
  registerWorker(aiSummaryWorker);
  registerWorker(moderationScanWorker);
  registerWorker(analyticsWorker);
  registerWorker(emailNotificationWorker);
  registerWorker(pushNotificationWorker);
  
  // Register safety workers
  registerWorker(safetyAnalysisWorker);
  registerWorker(riskAggregationWorker);
  registerWorker(escalationWorker);

  console.log("[workers] All workers registered");
}