// ===================================================
// YOHAKU Operational State — Transition Engine
// ===================================================
//
// The transition engine is the single point for all state changes.
// It validates, records, and emits events for every transition.
//
// Flow:
// 1. requestTransition() — validates the request
// 2. validateTransition() — checks rules & permissions
// 3. applyTransition() — records in DB
// 4. emitTransitionEvents() — audit + notification hooks
// ===================================================

import { prisma } from "@/lib/prisma";
import { getMachine } from "../machines";
import { validateTransition } from "../guards";
import { emitTransitionEvents } from "../events";
import type {
  StateEntityType,
  EntityState,
  TransitionRequest,
  TransitionResult,
  StateTransition,
} from "../types";

// ---------------------------------------------------------------------------
// Main Transition Function
// ---------------------------------------------------------------------------

/**
 * Requests a state transition.
 *
 * 1. Finds the current state
 * 2. Validates the transition
 * 3. Records the transition
 * 4. Emits audit events
 *
 * @returns TransitionResult with success/failure
 */
export async function requestTransition(
  request: TransitionRequest,
  currentState: EntityState,
  userRoles: string[],
  userPermissions: string[],
): Promise<TransitionResult> {
  // Validate
  const error = validateTransition(request, currentState, userRoles, userPermissions);
  if (error) {
    return { success: false, error };
  }

  // Apply
  try {
    const transition = await applyTransition(request, currentState);
    return { success: true, transition };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Transition failed",
    };
  }
}

/**
 * Records a transition in the database and emits events.
 */
async function applyTransition(
  request: TransitionRequest,
  currentState: EntityState,
): Promise<StateTransition> {
  // Create the transition record (append-only)
  const record = await prisma.stateTransition.create({
    data: {
      entityType: request.entityType,
      entityId: request.entityId,
      fromState: currentState,
      toState: request.toState,
      reason: request.reason,
      actorId: request.actorId ?? null,
      metadata: (request.metadata ?? {}) as any,
    },
  });

  const transition: StateTransition = {
    id: record.id,
    entityType: record.entityType as StateEntityType,
    entityId: record.entityId,
    fromState: record.fromState as EntityState,
    toState: record.toState as EntityState,
    reason: record.reason,
    actorId: record.actorId,
    metadata: record.metadata as Record<string, unknown> | null,
    createdAt: record.createdAt,
  };

  // Emit events (non-blocking — fire and forget for performance)
  emitTransitionEvents(transition).catch((err) => {
    console.error("[state] Failed to emit transition events:", err);
  });

  return transition;
}

// ---------------------------------------------------------------------------
// Query Helpers
// ---------------------------------------------------------------------------

/**
 * Gets the full transition history for an entity.
 */
export async function getTransitionHistory(
  entityType: StateEntityType,
  entityId: string,
): Promise<StateTransition[]> {
  const records = await prisma.stateTransition.findMany({
    where: {
      entityType,
      entityId,
    },
    orderBy: { createdAt: "desc" },
  });

  return records.map((r) => ({
    id: r.id,
    entityType: r.entityType as StateEntityType,
    entityId: r.entityId,
    fromState: r.fromState as EntityState,
    toState: r.toState as EntityState,
    reason: r.reason,
    actorId: r.actorId,
    metadata: r.metadata as Record<string, unknown> | null,
    createdAt: r.createdAt,
  }));
}

/**
 * Gets the current state for an entity (last transition's toState).
 */
export async function getCurrentState(
  entityType: StateEntityType,
  entityId: string,
): Promise<EntityState | null> {
  const last = await prisma.stateTransition.findFirst({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
  });

  if (!last) {
    // Return initial state if no transitions exist
    const { getInitialState } = await import("../machines");
    return getInitialState(entityType);
  }

  return last.toState as EntityState;
}

/**
 * Gets a summary of states for admin dashboard.
 */
export async function getStateSummary(): Promise<
  Record<string, Record<string, number>>
> {
  const entityTypes: StateEntityType[] = [
    "user",
    "moderation",
    "subscription",
    "safety",
  ];

  const summary: Record<string, Record<string, number>> = {};

  for (const entityType of entityTypes) {
    // Get the latest transition for each entity by finding all
    // transitions and grouping by the most recent one per entityId
    const latestTransitions = await prisma.stateTransition.groupBy({
      by: ["entityId", "toState"],
      where: { entityType },
      _max: { createdAt: true },
    });

    // Count occurrences of each state (approximate, for dashboard)
    const stateCounts: Record<string, number> = {};
    for (const t of latestTransitions) {
      stateCounts[t.toState] = (stateCounts[t.toState] ?? 0) + 1;
    }

    summary[entityType] = stateCounts;
  }

  return summary;
}