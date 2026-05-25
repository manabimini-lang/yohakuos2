// ===================================================
// YOHAKU Operational State — Type Definitions
// ===================================================

/**
 * Entity types that have state machines.
 */
export type StateEntityType =
  | "user"
  | "moderation"
  | "subscription"
  | "safety";

// ---------------------------------------------------------------------------
// User Lifecycle States
// ---------------------------------------------------------------------------

export type UserState =
  | "visitor"
  | "registered"
  | "trial"
  | "active"
  | "at_risk"
  | "inactive"
  | "suspended"
  | "banned";

export const USER_STATES: UserState[] = [
  "visitor",
  "registered",
  "trial",
  "active",
  "at_risk",
  "inactive",
  "suspended",
  "banned",
];

// ---------------------------------------------------------------------------
// Moderation Lifecycle States
// ---------------------------------------------------------------------------

export type ModerationState =
  | "reported"
  | "reviewing"
  | "warning_issued"
  | "restricted"
  | "resolved"
  | "banned";

export const MODERATION_STATES: ModerationState[] = [
  "reported",
  "reviewing",
  "warning_issued",
  "restricted",
  "resolved",
  "banned",
];

// ---------------------------------------------------------------------------
// Subscription Lifecycle States
// ---------------------------------------------------------------------------

export type SubscriptionState =
  | "trial"
  | "active"
  | "grace_period"
  | "past_due"
  | "cancelled";

export const SUBSCRIPTION_STATES: SubscriptionState[] = [
  "trial",
  "active",
  "grace_period",
  "past_due",
  "cancelled",
];

// ---------------------------------------------------------------------------
// Safety Lifecycle States
// ---------------------------------------------------------------------------

export type SafetyState =
  | "safe"
  | "monitoring"
  | "review_required"
  | "restricted"
  | "escalated";

export const SAFETY_STATES: SafetyState[] = [
  "safe",
  "monitoring",
  "review_required",
  "restricted",
  "escalated",
];

// ---------------------------------------------------------------------------
// Union Type
// ---------------------------------------------------------------------------

export type EntityState =
  | UserState
  | ModerationState
  | SubscriptionState
  | SafetyState;

// ---------------------------------------------------------------------------
// Transition Record
// ---------------------------------------------------------------------------

/**
 * A recorded state transition (stored in the database).
 */
export type StateTransition = {
  id: string;
  entityType: StateEntityType;
  entityId: string;
  fromState: EntityState;
  toState: EntityState;
  reason: string;
  actorId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

/**
 * Input for requesting a state transition.
 */
export type TransitionRequest = {
  entityType: StateEntityType;
  entityId: string;
  toState: EntityState;
  reason: string;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Result of a transition operation.
 */
export type TransitionResult = {
  success: boolean;
  transition?: StateTransition;
  error?: string;
};

/**
 * Transition rule defines a valid state change.
 */
export type TransitionRule<T extends EntityState> = {
  from: T;
  to: T;
  requiredRole?: string; // Min role level needed
  requiredPermission?: string; // Permission needed
};

/**
 * State machine definition.
 */
export type StateMachine<T extends EntityState> = {
  entityType: StateEntityType;
  states: T[];
  initial: T;
  transitions: TransitionRule<T>[];
};