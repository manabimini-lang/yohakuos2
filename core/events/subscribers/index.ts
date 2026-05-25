// ===================================================
// YOHAKU Event Bus — Custom Subscriber Registration
// ===================================================
//
// This is how external modules register their own subscribers.
// Each subscriber is a named handler that reacts to specific events.
//
// Example:
// ```ts
// import { registerSubscriber } from "@/core/events/subscribers";
//
// registerSubscriber("myHandler", {
//   name: "my-custom-handler",
//   description: "Does something on UserRegistered",
//   handle: async (event) => { ... }
// }, ["UserRegistered"]);
// ```
// ===================================================

import { eventBus } from "../bus";
import type { EventSubscriber } from "../types";

/**
 * Registers a custom subscriber for specific events.
 * This is the public API for adding event handlers.
 *
 * @param subscriber - The subscriber implementation
 * @param eventNames - List of events to subscribe to
 */
export function registerSubscriber(
  subscriber: EventSubscriber,
  eventNames: string[],
): void {
  for (const eventName of eventNames) {
    eventBus.subscribe(eventName, subscriber);
  }

  console.log(
    `[event-bus] Subscriber "${subscriber.name}" registered for events: ${eventNames.join(", ")}`,
  );
}

/**
 * Unregisters a subscriber from specific events.
 *
 * @param subscriberName - The name of the subscriber to unregister
 * @param eventNames - List of events to unsubscribe from
 */
export function unregisterSubscriber(
  subscriberName: string,
  eventNames: string[],
): void {
  for (const eventName of eventNames) {
    eventBus.unsubscribe(eventName, subscriberName);
  }

  console.log(
    `[event-bus] Subscriber "${subscriberName}" unregistered from events: ${eventNames.join(", ")}`,
  );
}

/**
 * Registers a callback-style handler for an event.
 * This is a simpler API for one-off handlers.
 *
 * @param eventName - The event to listen for
 * @param handlerName - A unique name for this handler
 * @param handler - The handler function
 */
export function on(
  eventName: string,
  handlerName: string,
  handler: (event: any) => Promise<void> | void,
): void {
  const subscriber: EventSubscriber = {
    name: handlerName,
    description: `Dynamic handler: ${handlerName}`,
    handle: handler,
  };

  eventBus.subscribe(eventName, subscriber);
}

/**
 * Removes a callback-style handler.
 *
 * @param eventName - The event to unsubscribe from
 * @param handlerName - The handler name to remove
 */
export function off(eventName: string, handlerName: string): void {
  eventBus.unsubscribe(eventName, handlerName);
}