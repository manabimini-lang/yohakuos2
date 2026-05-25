import type { WorkerDefinition } from "@/core/queue/types";
import { state } from "@/services/state";
import {
  getAllSignals,
  performRiskAssessment,
  applySafetyStateTransition,
  initiateEscalationProcess,
  addReviewItemToQueue,
  publishRiskDetectedEvent,
  publishStateTransitionEvent,
} from "@/core/safety";
import type { RiskAssessment, SafetyState, RiskLevel } from "@/core/safety";

// ===================================================
// Safety Analysis Worker
// ===================================================

export const safetyAnalysisWorker: WorkerDefinition = {
  jobType: "safety.analysis",
  name: "Safety Analysis Worker",
  description: "Runs safety analysis on a user or AI response based on collected risk signals",
  maxRetries: 3,
  concurrency: 3,
  handle: async (job) => {
    const { entityType, entityId, userId, actorId } = job.payload as {
      entityType: "user" | "ai_response";
      entityId: string;
      userId?: string;
      actorId?: string;
    };

    console.log(`[worker:safety] Processing safety analysis for ${entityType} ${entityId}...`);

    try {
      // 1. シグナル収集
      const signals = await getAllSignals(entityType, entityId, userId);

      // 2. リスクスコアリング
      const assessment = await performRiskAssessment(entityType, entityId, signals);

      // 3. 状態遷移の適用
      const previousState = (await state.getCurrentState("safety", entityId)) as SafetyState ?? "safe";

      // Target state mapped from risk level
      let targetState: SafetyState = "safe";
      switch (assessment.riskLevel) {
        case "low":
          targetState = "safe";
          break;
        case "medium":
          targetState = "monitoring";
          break;
        case "high":
          targetState = "review_required";
          break;
        case "critical":
          targetState = "restricted";
          break;
      }

      await applySafetyStateTransition(entityId, assessment.riskLevel, "Safety analysis completed");

      // 4. イベント発行
      await publishRiskDetectedEvent(assessment);
      if (previousState !== targetState) {
        await publishStateTransitionEvent(entityType, entityId, previousState, targetState);
      }

      // 5. エスカレーションプロセス
      const escalationAction = await initiateEscalationProcess(assessment, targetState, actorId || "system");

      if (
        escalationAction === "review_queue" ||
        escalationAction === "moderator_escalation" ||
        escalationAction === "safety_restriction"
      ) {
        await addReviewItemToQueue(assessment, targetState);
      }

      console.log(`[worker:safety] Analysis completed for ${entityType} ${entityId}: ${assessment.riskLevel}`);
    } catch (error) {
      console.error(`[worker:safety] Error processing safety analysis for ${entityType} ${entityId}:`, error);
      throw error;
    }
  },
};

// ===================================================
// Risk Aggregation Worker
// ===================================================

export const riskAggregationWorker: WorkerDefinition = {
  jobType: "safety.aggregation",
  name: "Risk Aggregation Worker",
  description: "Aggregates risk signals over time to calculate trend patterns",
  maxRetries: 3,
  concurrency: 1,
  handle: async (job) => {
    const { entityType, entityId } = job.payload as {
      entityType: "user" | "ai_response";
      entityId: string;
    };
    console.log(`[worker:safety] Processing risk aggregation for ${entityType} ${entityId}...`);
    // Future: Aggregate historical signals in database
  },
};

// ===================================================
// Escalation Worker
// ===================================================

export const escalationWorker: WorkerDefinition = {
  jobType: "safety.escalation",
  name: "Escalation Worker",
  description: "Processes escalation triggers, sends notifications to slack/discord/email",
  maxRetries: 3,
  concurrency: 2,
  handle: async (job) => {
    const { escalationId } = job.payload as {
      escalationId: string;
    };
    console.log(`[worker:safety] Processing escalation triggers for ${escalationId}...`);
    // Future: Trigger external notification tools
  },
};
