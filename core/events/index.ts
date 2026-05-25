// ===================================================
// YOHAKU Event Bus — Public API
// ===================================================
//
// Import from this file for all event bus needs.
// ===================================================

// Types
export type {
  DomainEvent,
  EventMetadata,
  EventHandler,
  EventSubscriber,
  IEventBus,
  EventRegistryEntry,
  // Payload types
  UserRegisteredPayload,
  UserLoggedInPayload,
  UserLoggedOutPayload,
  UserProfileUpdatedPayload,
  UserDeletedPayload,
  SubscriptionCreatedPayload,
  SubscriptionCancelledPayload,
  ContentCreatedPayload,
  ContentPublishedPayload,
  ReportCreatedPayload,
  ModerationActionTakenPayload,
  AIJobCompletedPayload,
  AIJobFailedPayload,
  StateChangedPayload,
  ReflectionCreatedPayload,
  MemoryCreatedPayload,
} from "./types";

// Registry
export {
  EVENT_REGISTRY,
  getEventRegistryEntry,
  isRegisteredEvent,
  getAllEventNames,
  getEventsByAggregate,
} from "./types/registry";

// Bus
export { eventBus, createEventMetadata } from "./bus";

// Handlers
export {
  registerBuiltInHandlers,
  registerAllDefaultSubscriptions,
  registerHandlerForEvent,
} from "./handlers";

// Publishers
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
  publishSafetyRiskDetected,
  publishSafetyReviewRequired,
  publishSafetyReviewResolved,
  publishSafetyRestricted,
} from "./publishers";

// Subscribers
export { registerSubscriber, unregisterSubscriber, on, off } from "./subscribers";