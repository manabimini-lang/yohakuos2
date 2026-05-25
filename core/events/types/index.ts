// ===================================================
// YOHAKU Event Bus — Type Definitions
// ===================================================
//
// ALL events use past tense naming (e.g., UserRegistered).
// Events represent facts that have already occurred.
// ===================================================

/**
 * Standard event metadata attached to every event.
 */
export type EventMetadata = {
  /** Unique event identifier (UUID) */
  eventId: string;
  /** ISO 8601 timestamp when the event occurred */
  occurredAt: string;
  /** The source that published the event */
  source: string;
  /** Correlation ID for tracing related events */
  correlationId?: string;
  /** Causation ID — the event that caused this event */
  causationId?: string;
  /** Version of the event schema */
  version?: number;
};

/**
 * Base structure for all domain events.
 * Every event in the system follows this shape.
 */
export type DomainEvent<Payload = unknown> = {
  /** Event name in past tense (e.g., "UserRegistered") */
  eventName: string;
  /** Type of aggregate (e.g., "user", "subscription") */
  aggregateType: string;
  /** ID of the aggregate */
  aggregateId: string;
  /** Event payload */
  payload: Payload;
  /** Standard metadata */
  metadata: EventMetadata;
};

/**
 * Event handler function signature.
 * Receives a domain event and returns void (or promise).
 */
export type EventHandler<Payload = unknown> = (
  event: DomainEvent<Payload>,
) => Promise<void> | void;

/**
 * Event subscriber — a named group that can subscribe to events.
 */
export type EventSubscriber = {
  /** Unique subscriber name */
  name: string;
  /** Description of what this subscriber does */
  description: string;
  /** Handler function */
  handle: EventHandler;
};

/**
 * Event bus interface.
 * Defines the contract for all event bus implementations.
 */
export interface IEventBus {
  publish<Payload>(event: DomainEvent<Payload>): Promise<void>;
  subscribe(eventName: string, subscriber: EventSubscriber): void;
  unsubscribe(eventName: string, subscriberName: string): void;
  dispatch<Payload>(event: DomainEvent<Payload>): Promise<void>;
}

/**
 * Error handling strategy for handler failures.
 */
export type ErrorStrategy =
  | "isolate"   // Continue with other handlers
  | "stop"      // Stop processing remaining handlers
  | "retry";    // Retry the failed handler

/**
 * Event registry entry.
 */
export type EventRegistryEntry = {
  eventName: string;
  description: string;
  aggregateType: string;
  version: number;
  subscribers: string[];
};

// ---------------------------------------------------------------------------
// Concrete Domain Events (typed payloads)
// ---------------------------------------------------------------------------

// Auth Events
export type UserRegisteredPayload = {
  userId: string;
  email: string;
  method: "email" | "google" | "github";
};

export type UserLoggedInPayload = {
  userId: string;
  method: "email" | "google" | "github";
  ipAddress?: string;
};

export type UserLoggedOutPayload = {
  userId: string;
};

// User Events
export type UserProfileUpdatedPayload = {
  userId: string;
  changes: Record<string, unknown>;
};

export type UserDeletedPayload = {
  userId: string;
  reason: string;
};

// Subscription Events
export type SubscriptionCreatedPayload = {
  userId: string;
  subscriptionId: string;
  plan: string;
};

export type SubscriptionCancelledPayload = {
  userId: string;
  subscriptionId: string;
  reason?: string;
};

// Content Events
export type ContentCreatedPayload = {
  contentId: string;
  title: string;
  type: string;
  createdBy: string;
};

export type ContentPublishedPayload = {
  contentId: string;
  slug: string;
};

// Moderation Events
export type ReportCreatedPayload = {
  reportId: string;
  targetType: string;
  targetId: string;
  reason: string;
  reportedBy: string;
};

export type ModerationActionTakenPayload = {
  reportId: string;
  action: string;
  actorId: string;
};

// AI Events
export type AIJobCompletedPayload = {
  jobId: string;
  jobType: string;
  userId: string;
  tokenUsed: number;
};

export type AIJobFailedPayload = {
  jobId: string;
  jobType: string;
  userId: string;
  error: string;
};

// State Events
export type StateChangedPayload = {
  entityType: string;
  entityId: string;
  fromState: string;
  toState: string;
  reason: string;
  actorId?: string;
};

// Reflection Events
export type ReflectionCreatedPayload = {
  reflectionId: string;
  userId: string;
  type: string;
};

// Memory Events
export type MemoryCreatedPayload = {
  memoryId: string;
  userId: string;
  type: string;
};

// Safety Events
export type SafetyRiskDetectedPayload = {
  entityType: "user" | "ai_response";
  entityId: string;
  riskScore: number;
  riskLevel: string;
  reasons: string[];
  signals: any[];
};

export type SafetyReviewRequiredPayload = {
  reviewId: string;
  entityType: "user" | "ai_response";
  entityId: string;
  riskScore: number;
  suggestedState: string;
};

export type SafetyReviewResolvedPayload = {
  reviewId: string;
  entityType: "user" | "ai_response";
  entityId: string;
  decision: "approved" | "rejected" | "escalated";
  notes?: string;
  reviewerId: string;
};

export type SafetyRestrictedPayload = {
  userId: string;
  reason: string;
  restrictedBy: string;
};