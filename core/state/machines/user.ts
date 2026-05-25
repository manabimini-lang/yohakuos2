// ===================================================
// YOHAKU Operational State — User Lifecycle Machine
// ===================================================
//
// State machine for the user lifecycle from visitor through
// registration, engagement, risk, suspension, and banning.
// ===================================================

import type { StateMachine, TransitionRule, UserState } from "../types";

const transitions: TransitionRule<UserState>[] = [
  // Registration flow
  { from: "visitor", to: "registered" },
  { from: "registered", to: "trial" },
  { from: "trial", to: "active" },

  // Engagement flow
  { from: "active", to: "at_risk", requiredPermission: "manage_users" },
  { from: "active", to: "inactive" },
  { from: "at_risk", to: "active" },
  { from: "at_risk", to: "inactive" },

  // Recovery flow
  { from: "inactive", to: "active" },
  { from: "inactive", to: "at_risk" },

  // Moderation flow (requires permission)
  { from: "registered", to: "suspended", requiredPermission: "manage_users" },
  { from: "trial", to: "suspended", requiredPermission: "manage_users" },
  { from: "active", to: "suspended", requiredPermission: "manage_users" },
  { from: "at_risk", to: "suspended", requiredPermission: "manage_users" },
  { from: "inactive", to: "suspended", requiredPermission: "manage_users" },

  // Ban flow (critical action, requires elevated permission)
  { from: "suspended", to: "banned", requiredPermission: "manage_users" },

  // Recovery from suspension (requires permission)
  { from: "suspended", to: "active", requiredPermission: "manage_users" },
  { from: "suspended", to: "at_risk", requiredPermission: "manage_users" },

  // Ban is terminal — no transitions out
];

export const userMachine: StateMachine<UserState> = {
  entityType: "user",
  states: [
    "visitor",
    "registered",
    "trial",
    "active",
    "at_risk",
    "inactive",
    "suspended",
    "banned",
  ],
  initial: "visitor",
  transitions,
};