// ===================================================
// YOHAKU Operational State — Transition Guards
// ===================================================
//
// Guards validate whether a transition is permitted.
// They check:
// 1. Is this a valid transition according to the state machine?
// 2. Does the actor have the required permissions?
// 3. Are there any business logic constraints?
//
// Invalid transitions (e.g., banned → active) are rejected here.
// ===================================================

import type {
  StateEntityType,
  EntityState,
  TransitionRequest,
} from "../types";
import { getMachine } from "../machines";

// ---------------------------------------------------------------------------
// Core Guards
// ---------------------------------------------------------------------------

/**
 * Checks if a transition is valid according to the state machine rules.
 */
export function isValidTransition(
  entityType: StateEntityType,
  currentState: EntityState,
  targetState: EntityState,
): boolean {
  const machine = getMachine(entityType);
  return machine.transitions.some(
    (t) => t.from === currentState && t.to === targetState,
  );
}

/**
 * Checks if the actor has the required role/permission for a transition.
 */
export function hasRequiredPermissions(
  entityType: StateEntityType,
  currentState: EntityState,
  targetState: EntityState,
  userRoles: string[],
  userPermissions: string[],
): boolean {
  const machine = getMachine(entityType);
  const rule = machine.transitions.find(
    (t) => t.from === currentState && t.to === targetState,
  );

  if (!rule) return false;

  // No permission required
  if (!rule.requiredPermission && !rule.requiredRole) return true;

  // Check permission
  if (rule.requiredPermission && !userPermissions.includes(rule.requiredPermission)) {
    return false;
  }

  // Check role
  if (rule.requiredRole && !userRoles.includes(rule.requiredRole)) {
    return false;
  }

  return true;
}

/**
 * Checks if a transition is a "destructive" action (requires elevated concern).
 */
export function isDestructiveTransition(
  entityType: StateEntityType,
  targetState: EntityState,
): boolean {
  const destructiveStates: Record<string, string[]> = {
    user: ["suspended", "banned"],
    moderation: ["banned", "restricted"],
    subscription: ["cancelled"],
    safety: ["restricted", "escalated"],
  };

  return (destructiveStates[entityType] ?? []).includes(targetState as string);
}

/**
 * Validates a complete transition request.
 * Returns an error message if invalid, null if valid.
 */
export function validateTransition(
  request: TransitionRequest,
  currentState: EntityState,
  userRoles: string[],
  userPermissions: string[],
): string | null {
  // Check if the transition is valid in the state machine
  if (!isValidTransition(request.entityType, currentState, request.toState)) {
    return `Invalid transition: ${currentState} → ${request.toState} is not allowed`;
  }

  // Check if the reason is provided for destructive transitions
  if (
    isDestructiveTransition(request.entityType, request.toState) &&
    !request.reason
  ) {
    return "A reason is required for destructive transitions";
  }

  // Check permissions
  if (
    !hasRequiredPermissions(
      request.entityType,
      currentState,
      request.toState,
      userRoles,
      userPermissions,
    )
  ) {
    return "You do not have permission to perform this transition";
  }

  return null;
}

/**
 * Gets all valid target states from a given current state.
 */
export function getValidTransitions(
  entityType: StateEntityType,
  currentState: EntityState,
): EntityState[] {
  const machine = getMachine(entityType);
  return machine.transitions
    .filter((t) => t.from === currentState)
    .map((t) => t.to);
}