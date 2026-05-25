// ===================================================
// YOHAKU Operational State — Safety Lifecycle Machine
// ===================================================
//
// State machine for safety monitoring from safe through
// monitoring, review, restriction, and escalation.
// ===================================================

import type { StateMachine, TransitionRule, SafetyState } from "../types";

const transitions: TransitionRule<SafetyState>[] = [
  // Safe → monitoring (triggered by suspicious activity detection)
  { from: "safe", to: "monitoring" },

  // Monitoring flow
  { from: "monitoring", to: "safe" }, // Cleared
  { from: "monitoring", to: "review_required" }, // Needs human review
  { from: "monitoring", to: "restricted" }, // Auto-restricted

  // Review required flow
  { from: "review_required", to: "safe" }, // Cleared after review
  { from: "review_required", to: "monitoring" }, // Continued monitoring
  { from: "review_required", to: "restricted" }, // Restricted after review
  { from: "review_required", to: "escalated" }, // Escalated for critical issues

  // Restricted flow
  { from: "restricted", to: "monitoring" }, // Conditions improved
  { from: "restricted", to: "safe" }, // Fully resolved
  { from: "restricted", to: "escalated" }, // Further escalation

  // Escalated is the most severe state
  // Can only be de-escalated with manual review
  { from: "escalated", to: "restricted" },
  { from: "escalated", to: "review_required" },
];

export const safetyMachine: StateMachine<SafetyState> = {
  entityType: "safety",
  states: [
    "safe",
    "monitoring",
    "review_required",
    "restricted",
    "escalated",
  ],
  initial: "safe",
  transitions,
};