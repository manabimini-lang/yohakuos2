// ===================================================
// YOHAKU Operational State — State Service
// ===================================================
//
// High-level service for state management operations.
// Wraps core state logic with domain-specific APIs.
// ===================================================

import { requestTransition, getTransitionHistory, getCurrentState, getStateSummary } from "@/core/state/transitions";
import { getValidTransitions } from "@/core/state/guards";
import { getInitialState, getMachine } from "@/core/state/machines";
import type {
  StateEntityType,
  EntityState,
  TransitionRequest,
  TransitionResult,
  StateTransition,
  StateMachine,
} from "@/core/state/types";

// Re-export types
export type {
  StateEntityType,
  EntityState,
  TransitionRequest,
  TransitionResult,
  StateTransition,
  StateMachine,
} from "@/core/state/types";

// Re-export state types
export type { UserState } from "@/core/state/types";
export type { ModerationState } from "@/core/state/types";
export type { SubscriptionState } from "@/core/state/types";
export type { SafetyState } from "@/core/state/types";

/**
 * State service — public API for all state operations.
 */
export const state = {
  // Transition operations
  transition: requestTransition,
  getHistory: getTransitionHistory,
  getCurrentState,
  getValidTransitions: (entityType: StateEntityType, currentState: EntityState) =>
    getValidTransitions(entityType, currentState),
  getInitialState: (entityType: StateEntityType) => getInitialState(entityType),
  getMachine: (entityType: StateEntityType) => getMachine(entityType),
  getSummary: getStateSummary,
};