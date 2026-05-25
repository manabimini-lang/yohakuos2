// ===================================================
// YOHAKU Operational State — Machine Registry
// ===================================================

import type { StateMachine, StateEntityType, EntityState } from "../types";
import { userMachine } from "./user";
import { moderationMachine } from "./moderation";
import { subscriptionMachine } from "./subscription";
import { safetyMachine } from "./safety";

/**
 * Registry of all state machines, keyed by entity type.
 */
export const machines: Record<StateEntityType, StateMachine<any>> = {
  user: userMachine,
  moderation: moderationMachine,
  subscription: subscriptionMachine,
  safety: safetyMachine,
};

/**
 * Gets the state machine for a given entity type.
 */
export function getMachine(entityType: StateEntityType): StateMachine<any> {
  const machine = machines[entityType];
  if (!machine) {
    throw new Error(`Unknown state machine: ${entityType}`);
  }
  return machine;
}

/**
 * Gets the initial state for an entity type.
 */
export function getInitialState(entityType: StateEntityType): EntityState {
  return getMachine(entityType).initial;
}