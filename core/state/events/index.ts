// ===================================================
// YOHAKU Operational State — Event Integration
// ===================================================
//
// When a state transition occurs, this module:
// 1. Records an audit event
// 2. Returns a structured event object for notification hooks
// ===================================================

import { audit } from "@/services/audit";
import { logSuspiciousActivity } from "@/core/audit/events";
import type { StateEntityType, EntityState, StateTransition } from "../types";

/**
 * State change event emitted after a successful transition.
 */
export type StateChangeEvent = {
  type: "state.change";
  entityType: StateEntityType;
  entityId: string;
  fromState: EntityState;
  toState: EntityState;
  reason: string;
  actorId: string | null;
  transitionId: string;
  timestamp: Date;
};

/**
 * Records audit events for a state transition.
 */
export async function emitTransitionEvents(
  transition: StateTransition,
): Promise<StateChangeEvent> {
  const event: StateChangeEvent = {
    type: "state.change",
    entityType: transition.entityType,
    entityId: transition.entityId,
    fromState: transition.fromState as EntityState,
    toState: transition.toState as EntityState,
    reason: transition.reason,
    actorId: transition.actorId,
    transitionId: transition.id,
    timestamp: transition.createdAt,
  };

  // Record audit event
  await audit.log({
    actorId: transition.actorId ?? undefined,
    category: mapEntityTypeToAuditCategory(transition.entityType),
    action: `state.${transition.entityType}.${transition.fromState}_to_${transition.toState}`,
    targetType: transition.entityType,
    targetId: transition.entityId,
    severity:
      transition.toState === "banned" || transition.toState === "escalated"
        ? "error"
        : transition.toState === "suspended" || transition.toState === "restricted"
        ? "warning"
        : "info",
    metadata: {
      fromState: transition.fromState,
      toState: transition.toState,
      reason: transition.reason,
    },
  });

  // If it's a security-sensitive transition, log additional security event
  if (isSecuritySensitive(transition)) {
    await audit.log(
      logSuspiciousActivity(
        transition.actorId ?? "system",
        `Security-sensitive state transition: ${transition.entityType}.${transition.fromState} → ${transition.toState}`,
        null,
        {
          entityType: transition.entityType,
          entityId: transition.entityId,
          transitionId: transition.id,
        },
      ),
    );
  }

  return event;
}

/**
 * Maps entity types to audit categories.
 */
function mapEntityTypeToAuditCategory(
  entityType: StateEntityType,
): "auth" | "moderation" | "billing" | "admin" | "security" | "user_management" {
  switch (entityType) {
    case "user":
      return "user_management";
    case "moderation":
      return "moderation";
    case "subscription":
      return "billing";
    case "safety":
      return "security";
  }
}

/**
 * Determines if a transition is security-sensitive and should trigger
 * an additional security audit event.
 */
function isSecuritySensitive(transition: StateTransition): boolean {
  const sensitiveTargetStates: Record<string, string[]> = {
    user: ["banned"],
    moderation: ["banned"],
    subscription: ["cancelled"],
    safety: ["escalated"],
  };

  return (sensitiveTargetStates[transition.entityType] ?? []).includes(
    transition.toState,
  );
}