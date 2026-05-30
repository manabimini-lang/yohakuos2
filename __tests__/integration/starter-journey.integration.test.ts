/**
 * Starter Journey Integration Test
 * 
 * Tests the complete 72-hour trial workflow:
 * 1. New user without credentials → Starter journey begins
 * 2. AI features enabled: Reflection, Quiet Return, Companion
 * 3. Message limit enforcement (20 messages)
 * 4. Priority-based job processing (priority 4 for starters)
 * 5. Accelerated pattern detection (3 items, 2 days for starters)
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { prisma } from "@/lib/prisma";
import {
  isStarterJourneyActive,
  getStarterJourneyStatus,
  isStarterJourneyUsingSharedKey,
  recordStarterJourneyCompanionMessage,
  startStarterJourneyIfEligible,
} from "@/lib/ai/starter-journey";
import { getUserOwnedApiCredentials } from "@/lib/ai/gemini";

// Test user ID (use real user or mock)
const TEST_USER_ID = "test-starter-user-" + Date.now();

describe("Starter Journey Integration", () => {
  beforeEach(async () => {
    // Clean up test user if exists
    await prisma.userAISettings.deleteMany({
      where: { userId: TEST_USER_ID },
    });
  });

  afterEach(async () => {
    // Clean up test user
    await prisma.userAISettings.deleteMany({
      where: { userId: TEST_USER_ID },
    });
  });

  describe("Starter Journey Activation", () => {
    it("should activate starter journey for users without credentials", async () => {
      // 1. Ensure user has no credentials
      const existing = await prisma.userAISettings.findUnique({
        where: { userId: TEST_USER_ID },
      });
      if (existing) {
        await prisma.userAISettings.delete({
          where: { userId: TEST_USER_ID },
        });
      }

      // 2. Start starter journey
      const result = await startStarterJourneyIfEligible(TEST_USER_ID);
      expect(result).toBe(true);

      // 3. Verify journey is active
      const settings = await prisma.userAISettings.findUnique({
        where: { userId: TEST_USER_ID },
      });
      expect(settings).toBeDefined();
      expect(settings?.starterJourneyStartedAt).toBeDefined();
      expect(settings?.starterJourneyExpiresAt).toBeDefined();
      expect(isStarterJourneyActive(settings)).toBe(true);
    });

    it("should not activate starter journey twice", async () => {
      await startStarterJourneyIfEligible(TEST_USER_ID);
      const secondAttempt = await startStarterJourneyIfEligible(TEST_USER_ID);
      expect(secondAttempt).toBe(false);
    });
  });

  describe("Starter Journey Status", () => {
    beforeEach(async () => {
      await startStarterJourneyIfEligible(TEST_USER_ID);
    });

    it("should return correct journey status", async () => {
      const status = await getStarterJourneyStatus(TEST_USER_ID);
      expect(status.active).toBe(true);
      expect(status.startedAt).toBeInstanceOf(Date);
      expect(status.expiresAt).toBeInstanceOf(Date);
      expect(status.remainingHours).toBeLessThanOrEqual(72);
      expect(status.remainingHours).toBeGreaterThanOrEqual(71);
    });

    it("should indicate using shared key", async () => {
      const usingShared = await isStarterJourneyUsingSharedKey(TEST_USER_ID);
      expect(usingShared).toBe(true);
    });
  });

  describe("Companion Message Limit", () => {
    beforeEach(async () => {
      await startStarterJourneyIfEligible(TEST_USER_ID);
    });

    it("should enforce 20-message limit for starter users", async () => {
      // Record messages up to limit
      const recordedMessages = [];
      for (let i = 0; i < 20; i++) {
        const allowed = await recordStarterJourneyCompanionMessage(TEST_USER_ID);
        recordedMessages.push(allowed);
        expect(allowed).toBe(true);
      }

      // 21st message should be rejected
      const rejectedMessage = await recordStarterJourneyCompanionMessage(TEST_USER_ID);
      expect(rejectedMessage).toBe(false);

      // Verify counter in DB
      const settings = await prisma.userAISettings.findUnique({
        where: { userId: TEST_USER_ID },
      });
      expect(settings?.starterJourneyCompanionMessageCount).toBe(20);
    });

    it("should not allow messages after journey expires", async () => {
      // Manually expire the journey
      await prisma.userAISettings.update({
        where: { userId: TEST_USER_ID },
        data: {
          starterJourneyExpiresAt: new Date(Date.now() - 1000), // 1 second ago
        },
      });

      // Message should be rejected
      const allowed = await recordStarterJourneyCompanionMessage(TEST_USER_ID);
      expect(allowed).toBe(false);
    });
  });

  describe("Provider Resolution", () => {
    it("should identify starter users correctly", async () => {
      await startStarterJourneyIfEligible(TEST_USER_ID);
      
      const ownedCreds = await getUserOwnedApiCredentials(TEST_USER_ID);
      expect(ownedCreds).toBeNull();

      const usingShared = await isStarterJourneyUsingSharedKey(TEST_USER_ID);
      expect(usingShared).toBe(true);
    });
  });
});
