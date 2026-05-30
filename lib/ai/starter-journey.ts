import { prisma } from "@/lib/prisma";
import { getUserOwnedApiCredentials } from "./gemini";
import { log } from "@/core/audit/logger";
import { publishStarterJourneyStarted } from "@/core/events/publishers/starter-journey";

export const STARTER_JOURNEY_DURATION_HOURS = 72;
export const STARTER_JOURNEY_DURATION_MS = STARTER_JOURNEY_DURATION_HOURS * 60 * 60 * 1000;
const STARTER_GEMINI_API_KEY = process.env.STARTER_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

export interface StarterJourneyStatus {
  active: boolean;
  startedAt: Date | null;
  expiresAt: Date | null;
  remainingHours: number;
  remainingMinutes: number;
}

export function isStarterJourneyActive(
  settings?: { starterJourneyStartedAt?: Date | null; starterJourneyExpiresAt?: Date | null } | null,
): boolean {
  if (!settings?.starterJourneyStartedAt) {
    return false;
  }

  const now = Date.now();
  const expiresAt = settings.starterJourneyExpiresAt
    ? new Date(settings.starterJourneyExpiresAt).getTime()
    : new Date(settings.starterJourneyStartedAt).getTime() + STARTER_JOURNEY_DURATION_MS;

  return now < expiresAt;
}

export function getStarterJourneyRemainingTime(
  settings?: { starterJourneyStartedAt?: Date | null; starterJourneyExpiresAt?: Date | null } | null,
): { hours: number; minutes: number; remainingMs: number } {
  if (!settings?.starterJourneyStartedAt) {
    return { hours: 0, minutes: 0, remainingMs: 0 };
  }

  const now = Date.now();
  const expiresAt = settings.starterJourneyExpiresAt
    ? new Date(settings.starterJourneyExpiresAt).getTime()
    : new Date(settings.starterJourneyStartedAt).getTime() + STARTER_JOURNEY_DURATION_MS;

  const remainingMs = Math.max(0, expiresAt - now);
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  return { hours, minutes, remainingMs };
}

export async function getStarterJourneyStatus(userId: string): Promise<StarterJourneyStatus> {
  const settings = await prisma.userAISettings.findUnique({
    where: { userId },
    select: {
      starterJourneyStartedAt: true,
      starterJourneyExpiresAt: true,
    },
  });

  const active = isStarterJourneyActive(settings);
  const { hours, minutes, remainingMs } = getStarterJourneyRemainingTime(settings);

  return {
    active,
    startedAt: settings?.starterJourneyStartedAt ?? null,
    expiresAt: settings?.starterJourneyExpiresAt ?? null,
    remainingHours: hours,
    remainingMinutes: minutes,
  };
}

export async function isStarterJourneyUsingSharedKey(userId: string): Promise<boolean> {
  const [credentials, settings] = await Promise.all([
    getUserOwnedApiCredentials(userId),
    prisma.userAISettings.findUnique({
      where: { userId },
      select: {
        starterJourneyStartedAt: true,
        starterJourneyExpiresAt: true,
      },
    }),
  ]);

  return !credentials && isStarterJourneyActive(settings);
}

export async function recordStarterJourneyCompanionMessage(userId: string): Promise<boolean> {
  const settings = await prisma.userAISettings.findUnique({
    where: { userId },
    select: {
      starterJourneyStartedAt: true,
      starterJourneyExpiresAt: true,
      starterJourneyCompanionMessageCount: true,
      starterJourneyCompanionMessageLimit: true,
    },
  });

  if (!settings || !isStarterJourneyActive(settings)) {
    return false;
  }

  const limit = settings.starterJourneyCompanionMessageLimit ?? 20;
  if ((settings.starterJourneyCompanionMessageCount ?? 0) >= limit) {
    return false;
  }

  await prisma.userAISettings.update({
    where: { userId },
    data: {
      starterJourneyCompanionMessageCount: {
        increment: 1,
      },
    },
  });

  return true;
}

export async function startStarterJourneyIfEligible(userId: string): Promise<boolean> {
  if (!STARTER_GEMINI_API_KEY) {
    return false;
  }

  const userOwnedCredentials = await getUserOwnedApiCredentials(userId);
  if (userOwnedCredentials) {
    return false;
  }

  const existingSettings = await prisma.userAISettings.findUnique({
    where: { userId },
  });

  if (isStarterJourneyActive(existingSettings)) {
    return false;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + STARTER_JOURNEY_DURATION_MS);

  const journeyData = {
    starterJourneyStartedAt: now,
    starterJourneyExpiresAt: expiresAt,
    starterJourneyCompanionMessageCount: 0,
    starterJourneyCompanionMessageLimit: 20,
  };

  if (existingSettings) {
    await prisma.userAISettings.update({
      where: { userId },
      data: {
        ...journeyData,
      },
    });
  } else {
    await prisma.userAISettings.create({
      data: {
        userId,
        provider: "gemini",
        model: null,
        isEnabled: false,
        encryptedApiKey: null,
        ...journeyData,
      },
    });
  }

  await log({
    actorId: userId,
    category: "ai",
    action: "starter_journey_started",
    targetType: "starter_journey",
    metadata: {
      expiresAt: expiresAt.toISOString(),
      source: "system_key",
    },
  });

  await publishStarterJourneyStarted(userId, expiresAt);

  return true;
}
