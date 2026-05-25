import {
  publishSafetyRiskDetected,
  publishSafetyReviewRequired,
  publishSafetyReviewResolved,
  publishSafetyRestricted,
  publishStateChanged,
} from "@/core/events";
import { ulid } from "ulid";
import type { RiskAssessment, HumanReview, SafetyState, Escalation, SafetyEventPayload } from "../types";

// ===================================================
// Safety Event Bus Integration (Real Event Bus)
// ===================================================

/**
 * Maps a risk level to safety state.
 */
function riskLevelToSafetyState(riskLevel: string): SafetyState {
  switch (riskLevel) {
    case "low":
      return "safe";
    case "medium":
      return "monitoring";
    case "high":
      return "review_required";
    case "critical":
      return "restricted";
    default:
      return "safe";
  }
}

/**
 * Emit risk detected event.
 */
export async function emitRiskDetected(assessment: RiskAssessment): Promise<void> {
  await publishSafetyRiskDetected(
    assessment.entityType,
    assessment.entityId,
    assessment.riskScore,
    assessment.riskLevel,
    assessment.reasons,
    assessment.signals,
  );
}

/**
 * Emit review required event.
 */
export async function emitReviewRequired(assessment: RiskAssessment): Promise<void> {
  await publishSafetyReviewRequired(
    ulid(),
    assessment.entityType,
    assessment.entityId,
    assessment.riskScore,
    riskLevelToSafetyState(assessment.riskLevel),
  );
}

/**
 * Emit review resolved event.
 */
export async function emitReviewResolved(review: HumanReview): Promise<void> {
  await publishSafetyReviewResolved(
    review.id,
    review.entityType,
    review.entityId,
    review.decision || "approved",
    review.reviewerId || "system",
    review.notes,
  );
}

/**
 * Emit safety restricted event.
 */
export async function emitSafetyRestricted(
  userId: string,
  reason: string,
  actorId?: string,
): Promise<void> {
  await publishSafetyRestricted(userId, reason, actorId || "system");
}

// ---------------------------------------------------------------------------
// Worker-compatible & Legacy Aliases
// ---------------------------------------------------------------------------

export async function publishRiskDetectedEvent(assessment: RiskAssessment): Promise<void> {
  await emitRiskDetected(assessment);
}

export async function publishStateTransitionEvent(
  entityType: "user" | "ai_response",
  entityId: string,
  oldState: SafetyState,
  newState: SafetyState,
): Promise<void> {
  // Use state domain event publisher
  await publishStateChanged(
    entityType === "user" ? "safety" : "safety_ai",
    entityId,
    oldState,
    newState,
    "Safety Engine State Transition",
    "system",
  );
}

export async function publishEscalationEvent(escalation: Escalation): Promise<void> {
  await publishSafetyReviewRequired(
    escalation.id,
    escalation.entityType,
    escalation.entityId,
    escalation.riskScore.score,
    escalation.currentSafetyState,
  );
}

export async function publishReviewActionEvent(review: HumanReview): Promise<void> {
  await emitReviewResolved(review);
}
