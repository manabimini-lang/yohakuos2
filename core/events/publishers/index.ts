// ===================================================
// YOHAKU Event Bus — Event Publishers
// ===================================================
//
// These are convenience functions for publishing typed domain events.
// They ensure consistent event structure and metadata.
//
// Domain services should use these functions to emit events.
// Never publish raw DomainEvent objects directly.
// ===================================================

import { eventBus, createEventMetadata } from "../bus";
import type {
  DomainEvent,
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
  SafetyRiskDetectedPayload,
  SafetyReviewRequiredPayload,
  SafetyReviewResolvedPayload,
  SafetyRestrictedPayload,
} from "../types";

// ---------------------------------------------------------------------------
// Auth Publishers
// ---------------------------------------------------------------------------

export async function publishUserRegistered(
  userId: string,
  email: string,
  method: "email" | "google" | "github",
): Promise<void> {
  const event: DomainEvent<UserRegisteredPayload> = {
    eventName: "UserRegistered",
    aggregateType: "user",
    aggregateId: userId,
    payload: { userId, email, method },
    metadata: createEventMetadata({ source: "auth" }),
  };
  await eventBus.publish(event);
}

export async function publishUserLoggedIn(
  userId: string,
  method: "email" | "google" | "github",
  ipAddress?: string,
): Promise<void> {
  const event: DomainEvent<UserLoggedInPayload> = {
    eventName: "UserLoggedIn",
    aggregateType: "user",
    aggregateId: userId,
    payload: { userId, method, ipAddress },
    metadata: createEventMetadata({ source: "auth" }),
  };
  await eventBus.publish(event);
}

export async function publishUserLoggedOut(userId: string): Promise<void> {
  const event: DomainEvent<UserLoggedOutPayload> = {
    eventName: "UserLoggedOut",
    aggregateType: "user",
    aggregateId: userId,
    payload: { userId },
    metadata: createEventMetadata({ source: "auth" }),
  };
  await eventBus.publish(event);
}

// ---------------------------------------------------------------------------
// User Publishers
// ---------------------------------------------------------------------------

export async function publishUserProfileUpdated(
  userId: string,
  changes: Record<string, unknown>,
): Promise<void> {
  const event: DomainEvent<UserProfileUpdatedPayload> = {
    eventName: "UserProfileUpdated",
    aggregateType: "user",
    aggregateId: userId,
    payload: { userId, changes },
    metadata: createEventMetadata({ source: "user" }),
  };
  await eventBus.publish(event);
}

export async function publishUserDeleted(
  userId: string,
  reason: string,
): Promise<void> {
  const event: DomainEvent<UserDeletedPayload> = {
    eventName: "UserDeleted",
    aggregateType: "user",
    aggregateId: userId,
    payload: { userId, reason },
    metadata: createEventMetadata({ source: "admin" }),
  };
  await eventBus.publish(event);
}

// ---------------------------------------------------------------------------
// Subscription Publishers
// ---------------------------------------------------------------------------

export async function publishSubscriptionCreated(
  userId: string,
  subscriptionId: string,
  plan: string,
): Promise<void> {
  const event: DomainEvent<SubscriptionCreatedPayload> = {
    eventName: "SubscriptionCreated",
    aggregateType: "subscription",
    aggregateId: subscriptionId,
    payload: { userId, subscriptionId, plan },
    metadata: createEventMetadata({ source: "billing" }),
  };
  await eventBus.publish(event);
}

export async function publishSubscriptionCancelled(
  userId: string,
  subscriptionId: string,
  reason?: string,
): Promise<void> {
  const event: DomainEvent<SubscriptionCancelledPayload> = {
    eventName: "SubscriptionCancelled",
    aggregateType: "subscription",
    aggregateId: subscriptionId,
    payload: { userId, subscriptionId, reason },
    metadata: createEventMetadata({ source: "billing" }),
  };
  await eventBus.publish(event);
}

// ---------------------------------------------------------------------------
// Content Publishers
// ---------------------------------------------------------------------------

export async function publishContentCreated(
  contentId: string,
  title: string,
  type: string,
  createdBy: string,
): Promise<void> {
  const event: DomainEvent<ContentCreatedPayload> = {
    eventName: "ContentCreated",
    aggregateType: "content",
    aggregateId: contentId,
    payload: { contentId, title, type, createdBy },
    metadata: createEventMetadata({ source: "content" }),
  };
  await eventBus.publish(event);
}

export async function publishContentPublished(
  contentId: string,
  slug: string,
): Promise<void> {
  const event: DomainEvent<ContentPublishedPayload> = {
    eventName: "ContentPublished",
    aggregateType: "content",
    aggregateId: contentId,
    payload: { contentId, slug },
    metadata: createEventMetadata({ source: "content" }),
  };
  await eventBus.publish(event);
}

// ---------------------------------------------------------------------------
// Moderation Publishers
// ---------------------------------------------------------------------------

export async function publishReportCreated(
  reportId: string,
  targetType: string,
  targetId: string,
  reason: string,
  reportedBy: string,
): Promise<void> {
  const event: DomainEvent<ReportCreatedPayload> = {
    eventName: "ReportCreated",
    aggregateType: "moderation",
    aggregateId: reportId,
    payload: { reportId, targetType, targetId, reason, reportedBy },
    metadata: createEventMetadata({ source: "moderation" }),
  };
  await eventBus.publish(event);
}

export async function publishModerationActionTaken(
  reportId: string,
  action: string,
  actorId: string,
): Promise<void> {
  const event: DomainEvent<ModerationActionTakenPayload> = {
    eventName: "ModerationActionTaken",
    aggregateType: "moderation",
    aggregateId: reportId,
    payload: { reportId, action, actorId },
    metadata: createEventMetadata({ source: "moderation" }),
  };
  await eventBus.publish(event);
}

// ---------------------------------------------------------------------------
// AI Publishers
// ---------------------------------------------------------------------------

export async function publishAIJobCompleted(
  jobId: string,
  jobType: string,
  userId: string,
  tokenUsed: number,
): Promise<void> {
  const event: DomainEvent<AIJobCompletedPayload> = {
    eventName: "AIJobCompleted",
    aggregateType: "ai",
    aggregateId: jobId,
    payload: { jobId, jobType, userId, tokenUsed },
    metadata: createEventMetadata({ source: "ai" }),
  };
  await eventBus.publish(event);
}

export async function publishAIJobFailed(
  jobId: string,
  jobType: string,
  userId: string,
  error: string,
): Promise<void> {
  const event: DomainEvent<AIJobFailedPayload> = {
    eventName: "AIJobFailed",
    aggregateType: "ai",
    aggregateId: jobId,
    payload: { jobId, jobType, userId, error },
    metadata: createEventMetadata({ source: "ai" }),
  };
  await eventBus.publish(event);
}

// ---------------------------------------------------------------------------
// State Publishers
// ---------------------------------------------------------------------------

export async function publishStateChanged(
  entityType: string,
  entityId: string,
  fromState: string,
  toState: string,
  reason: string,
  actorId?: string,
): Promise<void> {
  const event: DomainEvent<StateChangedPayload> = {
    eventName: "StateChanged",
    aggregateType: "state",
    aggregateId: `${entityType}:${entityId}`,
    payload: { entityType, entityId, fromState, toState, reason, actorId },
    metadata: createEventMetadata({ source: "state" }),
  };
  await eventBus.publish(event);
}

// ---------------------------------------------------------------------------
// Reflection & Memory Publishers
// ---------------------------------------------------------------------------

export async function publishReflectionCreated(
  reflectionId: string,
  userId: string,
  type: string,
): Promise<void> {
  const event: DomainEvent<ReflectionCreatedPayload> = {
    eventName: "ReflectionCreated",
    aggregateType: "reflection",
    aggregateId: reflectionId,
    payload: { reflectionId, userId, type },
    metadata: createEventMetadata({ source: "lifeos" }),
  };
  await eventBus.publish(event);
}

export async function publishMemoryCreated(
  memoryId: string,
  userId: string,
  type: string,
): Promise<void> {
  const event: DomainEvent<MemoryCreatedPayload> = {
    eventName: "MemoryCreated",
    aggregateType: "memory",
    aggregateId: memoryId,
    payload: { memoryId, userId, type },
    metadata: createEventMetadata({ source: "memory" }),
  };
  await eventBus.publish(event);
}

// ---------------------------------------------------------------------------
// Safety Publishers
// ---------------------------------------------------------------------------

export async function publishSafetyRiskDetected(
  entityType: "user" | "ai_response",
  entityId: string,
  riskScore: number,
  riskLevel: string,
  reasons: string[],
  signals: any[],
): Promise<void> {
  const event: DomainEvent<SafetyRiskDetectedPayload> = {
    eventName: "SafetyRiskDetected",
    aggregateType: "safety",
    aggregateId: entityId,
    payload: { entityType, entityId, riskScore, riskLevel, reasons, signals },
    metadata: createEventMetadata({ source: "safety" }),
  };
  await eventBus.publish(event);
}

export async function publishSafetyReviewRequired(
  reviewId: string,
  entityType: "user" | "ai_response",
  entityId: string,
  riskScore: number,
  suggestedState: string,
): Promise<void> {
  const event: DomainEvent<SafetyReviewRequiredPayload> = {
    eventName: "SafetyReviewRequired",
    aggregateType: "safety",
    aggregateId: reviewId,
    payload: { reviewId, entityType, entityId, riskScore, suggestedState },
    metadata: createEventMetadata({ source: "safety" }),
  };
  await eventBus.publish(event);
}

export async function publishSafetyReviewResolved(
  reviewId: string,
  entityType: "user" | "ai_response",
  entityId: string,
  decision: "approved" | "rejected" | "escalated",
  reviewerId: string,
  notes?: string,
): Promise<void> {
  const event: DomainEvent<SafetyReviewResolvedPayload> = {
    eventName: "SafetyReviewResolved",
    aggregateType: "safety",
    aggregateId: reviewId,
    payload: { reviewId, entityType, entityId, decision, notes, reviewerId },
    metadata: createEventMetadata({ source: "safety" }),
  };
  await eventBus.publish(event);
}

export async function publishSafetyRestricted(
  userId: string,
  reason: string,
  restrictedBy: string,
): Promise<void> {
  const event: DomainEvent<SafetyRestrictedPayload> = {
    eventName: "SafetyRestricted",
    aggregateType: "safety",
    aggregateId: userId,
    payload: { userId, reason, restrictedBy },
    metadata: createEventMetadata({ source: "safety" }),
  };
  await eventBus.publish(event);
}