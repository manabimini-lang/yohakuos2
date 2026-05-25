// ===================================================
// YOHAKU Event Bus — Event Service
// ===================================================
//
// High-level event service that provides a clean public API
// for publishing events, managing subscribers, and initialization.
// ===================================================

import { eventBus } from "@/core/events/bus";
import {
  registerBuiltInHandlers,
  registerAllDefaultSubscriptions,
} from "@/core/events/handlers";
import { registerSubscriber, unregisterSubscriber, on, off } from "@/core/events/subscribers";
import { getAllEventNames, getEventRegistryEntry } from "@/core/events/types/registry";
import type {
  DomainEvent,
  EventSubscriber,
  EventMetadata,
  IEventBus,
} from "@/core/events/types";

// Re-export publisher functions
export {
  publishUserRegistered,
  publishUserLoggedIn,
  publishUserLoggedOut,
  publishUserProfileUpdated,
  publishUserDeleted,
  publishSubscriptionCreated,
  publishSubscriptionCancelled,
  publishContentCreated,
  publishContentPublished,
  publishReportCreated,
  publishModerationActionTaken,
  publishAIJobCompleted,
  publishAIJobFailed,
  publishStateChanged,
  publishReflectionCreated,
  publishMemoryCreated,
} from "@/core/events/publishers";

// Re-export types
export type { DomainEvent, EventSubscriber, EventMetadata, IEventBus } from "@/core/events/types";

/**
 * Event service — public API for all event operations.
 */
export const events = {
  /** Publish a domain event */
  publish: <Payload>(event: DomainEvent<Payload>) => eventBus.publish(event),

  /** Subscribe a handler to an event */
  subscribe: (eventName: string, subscriber: EventSubscriber) =>
    eventBus.subscribe(eventName, subscriber),

  /** Unsubscribe a handler from an event */
  unsubscribe: (eventName: string, subscriberName: string) =>
    eventBus.unsubscribe(eventName, subscriberName),

  /** Register a subscriber for multiple events */
  register: registerSubscriber,

  /** Unregister a subscriber from multiple events */
  unregister: unregisterSubscriber,

  /** Listen for an event (simple callback API) */
  on,

  /** Stop listening for an event */
  off,

  /** Get all registered event names */
  getEvents: getAllEventNames,

  /** Get registry entry for an event */
  getEventInfo: getEventRegistryEntry,

  /** Initialize the event system */
  initialize: () => {
    registerBuiltInHandlers();
    registerAllDefaultSubscriptions();
    console.log("[event-bus] System initialized");
  },
};