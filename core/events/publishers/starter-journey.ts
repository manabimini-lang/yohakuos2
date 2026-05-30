// ===================================================
// YOHAKU Event Bus — Starter Journey Publishers
// ===================================================

import { eventBus, createEventMetadata } from "../bus";
import type { DomainEvent } from "../types";

export async function publishStarterJourneyStarted(
  userId: string,
  expiresAt: Date,
): Promise<void> {
  const event: DomainEvent<any> = {
    eventName: "StarterJourneyStarted",
    aggregateType: "starter_journey",
    aggregateId: userId,
    payload: { userId, expiresAt },
    metadata: createEventMetadata({ source: "ai" }),
  };
  await eventBus.publish(event);
}

export async function publishStarterJourneyExpired(
  userId: string,
): Promise<void> {
  const event: DomainEvent<any> = {
    eventName: "StarterJourneyExpired",
    aggregateType: "starter_journey",
    aggregateId: userId,
    payload: { userId },
    metadata: createEventMetadata({ source: "ai" }),
  };
  await eventBus.publish(event);
}

export async function publishGeminiKeyConnected(
  userId: string,
): Promise<void> {
  const event: DomainEvent<any> = {
    eventName: "GeminiKeyConnected",
    aggregateType: "ai",
    aggregateId: userId,
    payload: { userId },
    metadata: createEventMetadata({ source: "ai" }),
  };
  await eventBus.publish(event);
}

export async function publishFirstReflectionGeneratedInStarter(
  userId: string,
  reflectionId: string,
): Promise<void> {
  const event: DomainEvent<any> = {
    eventName: "FirstReflectionGeneratedInStarter",
    aggregateType: "reflection",
    aggregateId: reflectionId,
    payload: { userId, reflectionId },
    metadata: createEventMetadata({ source: "ai" }),
  };
  await eventBus.publish(event);
}

export async function publishFirstQuietReturnDetectedInStarter(
  userId: string,
): Promise<void> {
  const event: DomainEvent<any> = {
    eventName: "FirstQuietReturnDetectedInStarter",
    aggregateType: "memory",
    aggregateId: userId,
    payload: { userId },
    metadata: createEventMetadata({ source: "memory" }),
  };
  await eventBus.publish(event);
}
