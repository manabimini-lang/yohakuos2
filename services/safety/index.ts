// ===================================================
// YOHAKU Safety Engine — Safety Service
// ===================================================
//
// Public API for all safety operations.
// ===================================================

import { assessRisk, scoreToRiskLevel, needsEscalation } from "@/core/safety/scoring";
import { determineEscalation, getEscalationRule } from "@/core/safety/escalation";
import { evaluatePolicy, getActivePolicies } from "@/core/safety/policies";
import { addToReviewQueue, getPendingReviews, countPendingReviews, resolveReview, assignReview } from "@/core/safety/reviews";
import { applySafetyStateTransition, riskLevelToSafetyState } from "@/core/safety/states";
import { emitRiskDetected, emitReviewRequired, emitReviewResolved, emitSafetyRestricted } from "@/core/safety/events";
import { createSignal, SIGNAL_REGISTRY, isSignalSignificant } from "@/core/safety/signals";
import type { RiskLevel, RiskSignal, RiskAssessment, SafetyHealth } from "@/core/safety/types";

// Re-export types
export type { RiskLevel, RiskSignal, RiskAssessment, SafetyHealth, SafetyPolicy, ReviewItem } from "@/core/safety/types";

/**
 * Safety service — public API for all safety operations.
 */
export const safety = {
  /** Create a risk signal */
  createSignal,

  /** Assess risk for a user based on signals */
  assess: (userId: string, signals: RiskSignal[]) => assessRisk(userId, signals),

  /** Determine escalation action */
  escalate: (assessment: RiskAssessment, previousLevel?: RiskLevel) =>
    determineEscalation(assessment, previousLevel),

  /** Evaluate a policy for a signal */
  evaluatePolicy,

  /** Get active policies */
  getPolicies: getActivePolicies,

  /** Add to human review queue */
  addToReviewQueue: (userId: string, riskLevel: RiskLevel, riskScore: number, signals: RiskSignal[], assessmentId: string) =>
    addToReviewQueue(userId, riskLevel, riskScore, signals, assessmentId),

  /** Get pending reviews */
  getPendingReviews,

  /** Count pending reviews */
  countPendingReviews,

  /** Assign a review to a moderator */
  assignReview,

  /** Resolve a review */
  resolveReview,

  /** Apply safety state transition */
  applyStateTransition: (userId: string, riskLevel: RiskLevel, reason: string, actorId?: string) =>
    applySafetyStateTransition(userId, riskLevel, reason, actorId),

  /** Get escalation rule for risk level */
  getEscalationRule,

  /** Check if escalation is needed */
  needsEscalation,

  /** Emit safety events */
  emit: {
    riskDetected: emitRiskDetected,
    reviewRequired: emitReviewRequired,
    reviewResolved: emitReviewResolved,
    restricted: emitSafetyRestricted,
  },

  /** Get signal registry info */
  signalMeta: SIGNAL_REGISTRY,

  /** Run full safety pipeline: assess → escalate → review → state */
  runPipeline: async (
    userId: string,
    signals: RiskSignal[],
    previousRiskLevel?: RiskLevel,
    actorId?: string,
  ) => {
    // 1. Assess
    const assessment = assessRisk(userId, signals);

    // 2. Determine escalation
    const { action, rule, reason } = determineEscalation(assessment, previousRiskLevel);

    // 3. Emit risk detection event
    await emitRiskDetected(assessment);

    // 4. Apply state transition if needed
    if (assessment.riskLevel !== previousRiskLevel) {
      await applySafetyStateTransition(userId, assessment.riskLevel, reason, actorId);
    }

    // 5. Add to review queue if needed
    if (rule.requiresHumanReview) {
      const review = await addToReviewQueue(
        userId,
        assessment.riskLevel,
        assessment.riskScore,
        signals,
        `assessment_${Date.now()}`,
      );
      await emitReviewRequired(assessment);
      return { assessment, action, reason, review };
    }

    return { assessment, action, reason, review: null };
  },
};