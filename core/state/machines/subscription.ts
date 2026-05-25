// ===================================================
// YOHAKU Operational State — Subscription Lifecycle Machine
// ===================================================
//
// State machine for subscription/lifecycle from trial through
// active billing, payment issues, and cancellation.
// ===================================================

import type { StateMachine, TransitionRule, SubscriptionState } from "../types";

const transitions: TransitionRule<SubscriptionState>[] = [
  // Trial flow
  { from: "trial", to: "active" },
  { from: "trial", to: "cancelled" },

  // Active flow
  { from: "active", to: "grace_period" }, // Payment grace period
  { from: "active", to: "past_due" }, // Payment failed

  // Grace period
  { from: "grace_period", to: "active" }, // Payment resolved
  { from: "grace_period", to: "past_due" }, // Still unpaid
  { from: "grace_period", to: "cancelled" }, // User cancelled

  // Past due
  { from: "past_due", to: "active" }, // Payment resolved
  { from: "past_due", to: "grace_period" }, // Extended grace
  { from: "past_due", to: "cancelled" }, // Final cancellation

  // Cancelled is terminal
  // No transition out of cancelled
];

export const subscriptionMachine: StateMachine<SubscriptionState> = {
  entityType: "subscription",
  states: [
    "trial",
    "active",
    "grace_period",
    "past_due",
    "cancelled",
  ],
  initial: "trial",
  transitions,
};