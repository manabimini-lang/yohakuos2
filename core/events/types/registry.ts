// ===================================================
// YOHAKU Event Bus — Event Registry
// ===================================================
//
// The registry is the single source of truth for all domain events.
// Every event must be registered here with its metadata.
// This enables type-safe event publishing and documentation.
// ===================================================

import type { EventRegistryEntry } from "./index";

/**
 * Registry of all domain events in the system.
 * Each event has a description, aggregate type, version, and subscribers.
 */
export const EVENT_REGISTRY: EventRegistryEntry[] = [
  // ── Auth Events ──
  {
    eventName: "UserRegistered",
    description: "A new user has completed registration",
    aggregateType: "user",
    version: 1,
    subscribers: ["audit", "analytics", "notification"],
  },
  {
    eventName: "UserLoggedIn",
    description: "A user has logged in successfully",
    aggregateType: "user",
    version: 1,
    subscribers: ["audit", "analytics"],
  },
  {
    eventName: "UserLoggedOut",
    description: "A user has logged out",
    aggregateType: "user",
    version: 1,
    subscribers: ["audit"],
  },

  // ── User Events ──
  {
    eventName: "UserProfileUpdated",
    description: "A user has updated their profile",
    aggregateType: "user",
    version: 1,
    subscribers: ["audit"],
  },
  {
    eventName: "UserDeleted",
    description: "A user account has been deleted",
    aggregateType: "user",
    version: 1,
    subscribers: ["audit", "analytics", "notification"],
  },

  // ── Subscription Events ──
  {
    eventName: "SubscriptionCreated",
    description: "A subscription has been created",
    aggregateType: "subscription",
    version: 1,
    subscribers: ["audit", "analytics", "notification"],
  },
  {
    eventName: "SubscriptionCancelled",
    description: "A subscription has been cancelled",
    aggregateType: "subscription",
    version: 1,
    subscribers: ["audit", "analytics", "notification"],
  },

  // ── Content Events ──
  {
    eventName: "ContentCreated",
    description: "Content has been created",
    aggregateType: "content",
    version: 1,
    subscribers: ["audit", "analytics"],
  },
  {
    eventName: "ContentPublished",
    description: "Content has been published",
    aggregateType: "content",
    version: 1,
    subscribers: ["audit", "analytics", "notification"],
  },

  // ── Moderation Events ──
  {
    eventName: "ReportCreated",
    description: "A moderation report has been created",
    aggregateType: "moderation",
    version: 1,
    subscribers: ["audit", "moderation", "notification"],
  },
  {
    eventName: "ModerationActionTaken",
    description: "A moderation action has been taken",
    aggregateType: "moderation",
    version: 1,
    subscribers: ["audit", "moderation"],
  },

  // ── AI Events ──
  {
    eventName: "AIJobCompleted",
    description: "An AI job has completed successfully",
    aggregateType: "ai",
    version: 1,
    subscribers: ["audit", "analytics"],
  },
  {
    eventName: "AIJobFailed",
    description: "An AI job has failed",
    aggregateType: "ai",
    version: 1,
    subscribers: ["audit", "analytics", "notification"],
  },

  // ── State Events ──
  {
    eventName: "StateChanged",
    description: "An entity's state has changed",
    aggregateType: "state",
    version: 1,
    subscribers: ["audit", "analytics"],
  },

  // ── Reflection Events ──
  {
    eventName: "ReflectionCreated",
    description: "A reflection has been created",
    aggregateType: "reflection",
    version: 1,
    subscribers: ["analytics", "ai"],
  },

  // ── Memory Events ──
  {
    eventName: "MemoryCreated",
    description: "A memory has been created by AI",
    aggregateType: "memory",
    version: 1,
    subscribers: ["analytics"],
  },

  // ── Safety Events ──
  {
    eventName: "SafetyRiskDetected",
    description: "Risk was detected for an entity",
    aggregateType: "safety",
    version: 1,
    subscribers: ["audit", "notification", "analytics"],
  },
  {
    eventName: "SafetyReviewRequired",
    description: "Safety review is required by a moderator",
    aggregateType: "safety",
    version: 1,
    subscribers: ["audit", "notification"],
  },
  {
    eventName: "SafetyReviewResolved",
    description: "Safety review has been resolved by a moderator",
    aggregateType: "safety",
    version: 1,
    subscribers: ["audit", "state"],
  },
  {
    eventName: "SafetyRestricted",
    description: "Safety restrictions have been applied to a user",
    aggregateType: "safety",
    version: 1,
    subscribers: ["audit", "state", "notification"],
  },
];

/**
 * Gets a registry entry by event name.
 */
export function getEventRegistryEntry(eventName: string): EventRegistryEntry | undefined {
  return EVENT_REGISTRY.find((e) => e.eventName === eventName);
}

/**
 * Checks if an event is registered in the registry.
 */
export function isRegisteredEvent(eventName: string): boolean {
  return EVENT_REGISTRY.some((e) => e.eventName === eventName);
}

/**
 * Gets all registered event names.
 */
export function getAllEventNames(): string[] {
  return EVENT_REGISTRY.map((e) => e.eventName);
}

/**
 * Gets all events for a specific aggregate type.
 */
export function getEventsByAggregate(aggregateType: string): EventRegistryEntry[] {
  return EVENT_REGISTRY.filter((e) => e.aggregateType === aggregateType);
}