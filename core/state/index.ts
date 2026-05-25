// ===================================================
// YOHAKU Operational State — Public API
// ===================================================
//
// Import from this file for all state management needs.
// ===================================================

// Types
export type {
  StateEntityType,
  EntityState,
  UserState,
  ModerationState,
  SubscriptionState,
  SafetyState,
  StateTransition,
  TransitionRequest,
  TransitionResult,
  TransitionRule,
  StateMachine,
} from "./types";

// Machines
export { getMachine, getInitialState, machines } from "./machines";

// Transitions
export {
  requestTransition,
  getTransitionHistory,
  getCurrentState,
  getStateSummary,
} from "./transitions";

// Guards
export {
  isValidTransition,
  hasRequiredPermissions,
  isDestructiveTransition,
  getValidTransitions,
} from "./guards";

// Events
export type { StateChangeEvent } from "./events";