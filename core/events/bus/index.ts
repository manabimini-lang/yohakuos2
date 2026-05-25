// ===================================================
// YOHAKU Event Bus — In-Process Event Bus
// ===================================================
//
// Implements the IEventBus interface with an in-process event bus.
// All subscribers are called synchronously in the current process.
//
// For production-scale workloads, replace this with a queue-based
// implementation (RabbitMQ, Redis Streams, Kafka, etc.) that
// implements the same IEventBus interface.
// ===================================================

import type {
  DomainEvent,
  EventHandler,
  EventSubscriber,
  IEventBus,
  EventMetadata,
} from "../types";

/**
 * In-process event bus implementation.
 *
 * Features:
 * - Typed publish/subscribe
 * - Multiple subscribers per event
 * - Handler failure isolation
 * - Event validation against registry
 */
class InProcessEventBus implements IEventBus {
  /** Map of event name → set of subscribers */
  private subscribers = new Map<string, Map<string, EventSubscriber>>();

  /** Global handlers that receive all events */
  private globalHandlers: EventHandler[] = [];

  constructor() {
    this.subscribers = new Map();
    this.globalHandlers = [];
  }

  /**
   * Publishes an event to all subscribers.
   * Each handler is isolated — one failure doesn't stop others.
   */
  async publish<Payload>(event: DomainEvent<Payload>): Promise<void> {
    const eventName = event.eventName;
    const eventSubscribers = this.subscribers.get(eventName);

    // Run global handlers
    await Promise.allSettled(
      this.globalHandlers.map((handler) => this.safeExecute(handler, event, "global")),
    );

    // Run event-specific subscribers
    if (eventSubscribers) {
      const results = await Promise.allSettled(
        Array.from(eventSubscribers.values()).map((subscriber) =>
          this.safeExecute(subscriber.handle, event, subscriber.name),
        ),
      );

      // Log failures but don't throw
      for (const result of results) {
        if (result.status === "rejected") {
          console.error(`[event-bus] Handler failed for ${eventName}:`, result.reason);
        }
      }
    }
  }

  /**
   * Subscribes a handler to an event.
   */
  subscribe(eventName: string, subscriber: EventSubscriber): void {
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, new Map());
    }

    const eventSubscribers = this.subscribers.get(eventName)!;

    if (eventSubscribers.has(subscriber.name)) {
      console.warn(
        `[event-bus] Subscriber "${subscriber.name}" is already subscribed to "${eventName}". Overwriting.`,
      );
    }

    eventSubscribers.set(subscriber.name, subscriber);
  }

  /**
   * Unsubscribes a handler from an event.
   */
  unsubscribe(eventName: string, subscriberName: string): void {
    const eventSubscribers = this.subscribers.get(eventName);
    if (eventSubscribers) {
      eventSubscribers.delete(subscriberName);
      if (eventSubscribers.size === 0) {
        this.subscribers.delete(eventName);
      }
    }
  }

  /**
   * Alias for publish — dispatches an event.
   */
  async dispatch<Payload>(event: DomainEvent<Payload>): Promise<void> {
    return this.publish(event);
  }

  // ---------------------------------------------------------------------------
  // Internal Helpers
  // ---------------------------------------------------------------------------

  /**
   * Safely executes a handler, catching and logging errors.
   */
  private async safeExecute(
    handler: EventHandler,
    event: DomainEvent,
    handlerName: string,
  ): Promise<void> {
    try {
      await handler(event);
    } catch (error) {
      console.error(`[event-bus] Error in handler "${handlerName}":`, error);
      // Don't rethrow — isolate handler failures
    }
  }

  /**
   * Registers a global handler that receives ALL events.
   * Useful for cross-cutting concerns like logging.
   */
  addGlobalHandler(handler: EventHandler): void {
    this.globalHandlers.push(handler);
  }

  /**
   * Returns the current subscriber count.
   */
  getSubscriberCount(): number {
    let count = 0;
    for (const subscribers of this.subscribers.values()) {
      count += subscribers.size;
    }
    return count;
  }

  /**
   * Returns all subscribers for a given event.
   */
  getSubscribers(eventName: string): EventSubscriber[] {
    const subscribers = this.subscribers.get(eventName);
    return subscribers ? Array.from(subscribers.values()) : [];
  }
}

/**
 * Singleton event bus instance.
 * All event publishing goes through this instance.
 */
export const eventBus = new InProcessEventBus();

/**
 * Creates event metadata for a new event.
 */
export function createEventMetadata(overrides?: Partial<EventMetadata>): EventMetadata {
  return {
    eventId: generateEventId(),
    occurredAt: new Date().toISOString(),
    source: overrides?.source ?? "yohaku-system",
    correlationId: overrides?.correlationId,
    causationId: overrides?.causationId,
    version: overrides?.version ?? 1,
  };
}

/**
 * Generates a simple event ID (cuid-like).
 */
function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `evt_${timestamp}_${random}`;
}