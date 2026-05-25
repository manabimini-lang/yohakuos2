// ===================================================
// YOHAKU Event Bus — Built-in Event Handlers
// ===================================================
//
// These handlers are automatically registered when the system starts.
// Each handler subscribes to specific events and performs its domain logic.
// ===================================================

import { eventBus } from "../bus";
import { audit } from "@/services/audit";
import type { DomainEvent, EventSubscriber } from "../types";

// ---------------------------------------------------------------------------
// Audit Handler
// ---------------------------------------------------------------------------

/**
 * Records audit events for domain events.
 * This is the bridge between the event bus and the audit system.
 */
const auditHandler: EventSubscriber = {
  name: "audit",
  description: "Records audit events for domain events",
  handle: async (event: DomainEvent) => {
    const severity = getSeverityFromEvent(event.eventName);

    await audit.log({
      actorId: (event.payload as any)?.userId ?? null,
      category: mapEventToAuditCategory(event.eventName, event.aggregateType),
      action: `event.${event.eventName}`,
      targetType: event.aggregateType,
      targetId: event.aggregateId,
      severity,
      metadata: {
        eventId: event.metadata.eventId,
        eventName: event.eventName,
        payload: event.payload,
      },
    });
  },
};

function getSeverityFromEvent(eventName: string): "info" | "warning" | "error" {
  if (eventName.includes("Failed") || eventName.includes("Deleted") || eventName.includes("Cancelled")) {
    return "warning";
  }
  if (eventName.includes("ActionTaken")) {
    return "warning"; // Moderation actions are always at least warning
  }
  return "info";
}

function mapEventToAuditCategory(
  eventName: string,
  aggregateType: string,
): "auth" | "moderation" | "billing" | "ai" | "admin" | "security" | "user_management" {
  if (eventName.startsWith("User") && (eventName === "UserLoggedIn" || eventName === "UserLoggedOut")) {
    return "auth";
  }
  if (aggregateType === "moderation") return "moderation";
  if (aggregateType === "subscription") return "billing";
  if (eventName.startsWith("AI")) return "ai";
  if (aggregateType === "user") return "user_management";
  return "admin";
}

// ---------------------------------------------------------------------------
// Analytics Handler
// ---------------------------------------------------------------------------

/**
 * Placeholder for analytics event tracking.
 * Will be replaced with actual analytics service integration.
 */
const analyticsHandler: EventSubscriber = {
  name: "analytics",
  description: "Tracks events for analytics",
  handle: async (event: DomainEvent) => {
    // Future: Send to analytics service
    // e.g., await analytics.track(event.eventName, event.payload);
  },
};

// ---------------------------------------------------------------------------
// Notification Handler
// ---------------------------------------------------------------------------

/**
 * Placeholder for notification events.
 * Will dispatch to email, push, or in-app notifications.
 */
const notificationHandler: EventSubscriber = {
  name: "notification",
  description: "Dispatches notifications for events",
  handle: async (event: DomainEvent) => {
    // Future: Send notifications
    // e.g., await notificationService.send(event);
  },
};

// ---------------------------------------------------------------------------
// Moderation Handler
// ---------------------------------------------------------------------------

/**
 * Placeholder for moderation workflow triggers.
 */
const moderationHandler: EventSubscriber = {
  name: "moderation",
  description: "Triggers moderation workflows",
  handle: async (event: DomainEvent) => {
    // Future: Auto-moderation workflows
    // e.g., await moderationService.processEvent(event);
  },
};

// ---------------------------------------------------------------------------
// AI Handler
// ---------------------------------------------------------------------------

/**
 * Placeholder for AI event processing.
 * AI Agents will subscribe to events here in the future.
 */
const aiHandler: EventSubscriber = {
  name: "ai",
  description: "Processes events for AI agents",
  handle: async (event: DomainEvent) => {
    // Future: AI agent event processing
    // e.g., await aiOrchestrator.processEvent(event);
  },
};

// ---------------------------------------------------------------------------
// Handler Registration
// ---------------------------------------------------------------------------

/**
 * Map of handler name → subscriber for all built-in handlers.
 */
const BUILT_IN_HANDLERS: Record<string, EventSubscriber> = {
  audit: auditHandler,
  analytics: analyticsHandler,
  notification: notificationHandler,
  moderation: moderationHandler,
  ai: aiHandler,
};

/**
 * Registers all built-in event handlers with the event bus.
 * Called once at application startup.
 */
export function registerBuiltInHandlers(): void {
  // These handlers are registered globally — they listen to ALL events
  const globalHandlers = ["audit", "analytics"];
  const handlerMap: Record<string, EventSubscriber> = {
    audit: auditHandler,
    analytics: analyticsHandler,
  };

  for (const name of globalHandlers) {
    const handler = handlerMap[name];
    if (handler) {
      (eventBus as any).addGlobalHandler?.(handler.handle);
    }
  }

  console.log("[event-bus] Built-in handlers registered");
}

/**
 * Registers a specific handler for a specific event.
 * Used for targeted subscriptions.
 */
export function registerHandlerForEvent(
  eventName: string,
  handlerName: string,
): void {
  const handler = BUILT_IN_HANDLERS[handlerName];
  if (!handler) {
    console.warn(`[event-bus] Unknown handler: ${handlerName}`);
    return;
  }

  eventBus.subscribe(eventName, handler);
  console.log(`[event-bus] Handler "${handlerName}" subscribed to "${eventName}"`);
}

/**
 * Registers all built-in handlers for their default events.
 * This subscribes each handler to the events they should process.
 */
export function registerAllDefaultSubscriptions(): void {
  const defaultSubscriptions: Record<string, string[]> = {
    audit: [
      "UserRegistered",
      "UserLoggedIn",
      "UserLoggedOut",
      "UserDeleted",
      "SubscriptionCreated",
      "SubscriptionCancelled",
      "ContentPublished",
      "ReportCreated",
      "ModerationActionTaken",
      "AIJobCompleted",
      "AIJobFailed",
      "StateChanged",
    ],
    notification: [
      "UserRegistered",
      "UserDeleted",
      "SubscriptionCreated",
      "SubscriptionCancelled",
      "ContentPublished",
      "ReportCreated",
      "AIJobFailed",
    ],
    moderation: ["ReportCreated", "ModerationActionTaken"],
    ai: ["ReflectionCreated", "MemoryCreated"],
  };

  for (const [handlerName, eventNames] of Object.entries(defaultSubscriptions)) {
    for (const eventName of eventNames) {
      registerHandlerForEvent(eventName, handlerName);
    }
  }
}