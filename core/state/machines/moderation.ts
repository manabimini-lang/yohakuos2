// ===================================================
// YOHAKU Operational State — Moderation Lifecycle Machine
// ===================================================
//
// State machine for content moderation from report through
// review, action, and resolution.
// ===================================================

import type { StateMachine, TransitionRule, ModerationState } from "../types";

const transitions: TransitionRule<ModerationState>[] = [
  // Report flow (starts with a report)
  { from: "reported", to: "reviewing", requiredPermission: "manage_reports" },
  { from: "reported", to: "resolved", requiredPermission: "manage_reports" }, // Dismiss

  // Review flow
  { from: "reviewing", to: "warning_issued", requiredPermission: "manage_reports" },
  { from: "reviewing", to: "restricted", requiredPermission: "manage_reports" },
  { from: "reviewing", to: "resolved", requiredPermission: "manage_reports" },
  { from: "reviewing", to: "banned", requiredPermission: "manage_reports" },

  // Warning issued
  { from: "warning_issued", to: "resolved", requiredPermission: "manage_reports" },
  { from: "warning_issued", to: "restricted", requiredPermission: "manage_reports" },
  { from: "warning_issued", to: "banned", requiredPermission: "manage_reports" },

  // Restricted
  { from: "restricted", to: "resolved", requiredPermission: "manage_reports" },
  { from: "restricted", to: "banned", requiredPermission: "manage_reports" },

  // Banned is terminal for the moderation context
  // Escalate back to review if decision was incorrect
  { from: "banned", to: "reviewing", requiredPermission: "manage_reports" },
];

export const moderationMachine: StateMachine<ModerationState> = {
  entityType: "moderation",
  states: [
    "reported",
    "reviewing",
    "warning_issued",
    "restricted",
    "resolved",
    "banned",
  ],
  initial: "reported",
  transitions,
};