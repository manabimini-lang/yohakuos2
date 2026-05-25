// ===================================================
// YOHAKU Safety Engine — Safety State Management
// ===================================================
//
// Bridges safety engine to the Operational State Foundation.
// Transitions safety state based on risk assessments.
// ===================================================

import { state } from "@/services/state";
import type { EntityState } from "@/core/state/types";
import type { RiskLevel, SafetyState } from "../types";

/**
 * Maps a risk level to the corresponding safety state.
 */
export function riskLevelToSafetyState(riskLevel: RiskLevel): SafetyState {
  switch (riskLevel) {
    case "low":
      return "safe";
    case "medium":
      return "monitoring";
    case "high":
      return "review_required";
    case "critical":
      return "escalated";
    default:
      return "safe";
  }
}

/**
 * Transitions a user's safety state based on risk assessment.
 * Returns the result of the state transition.
 */
export async function applySafetyStateTransition(
  userId: string,
  riskLevel: RiskLevel,
  reason: string,
  actorId?: string,
): Promise<{ success: boolean; error?: string }> {
  const currentState = await state.getCurrentState("safety", userId);
  const targetState = riskLevelToSafetyState(riskLevel);

  if (currentState === targetState) {
    return { success: true }; // Already in the correct state
  }

  const result = await state.transition(
    {
      entityType: "safety",
      entityId: userId,
      toState: targetState,
      reason,
      actorId: actorId ?? null,
      metadata: { source: "safety_engine" },
    },
    currentState ?? "safe",
    ["admin"],
    ["manage_system"],
  );

  return result;
}