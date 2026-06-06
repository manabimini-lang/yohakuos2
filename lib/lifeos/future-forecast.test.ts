import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { FutureForecastService } from "../future-forecast-service";
import { LifeArea, DifficultyLevel } from "@prisma/client";
import { LifeState } from "../types";
import { LifeTrajectory } from "../types";
import { PreferenceProfile } from "../types";
import { WeeklyReview } from "../types";

// Mock external service calls
vi.mock("../preference-service", () => ({
  PreferenceProfileService: {
    generatePreferenceProfile: vi.fn(() => Promise.resolve({
      userId: "test-user",
      generatedAt: new Date(),
      areas: {
        [LifeArea.Mind]: {
          recommendationCount: 20, acceptRate: 0.8, dismissRate: 0.1, completionRate: 0.7, averageScoreImpact: 10, confidence: 1.0
        },
        [LifeArea.Health]: {
          recommendationCount: 10, acceptRate: 0.6, dismissRate: 0.2, completionRate: 0.5, averageScoreImpact: 5, confidence: 0.5
        },
        // ... other areas
      },
      preferredAreas: [LifeArea.Mind],
      avoidedAreas: [],
      preferredDifficulty: DifficultyLevel.MEDIUM,
      behaviorStyle: "CONSISTENT",
      summary: "安定志向",
    })),
  },
}));

vi.mock("../life-state-service", () => ({
  LifeStateService: {
    generateLifeState: vi.fn(() => Promise.resolve({
      userId: "test-user",
      generatedAt: new Date(),
      energyLevel: "MEDIUM",
      stressLevel: "LOW",
      growthMomentum: "STABLE",
      engagementLevel: "HIGH",
      dominantAreas: [LifeArea.Mind],
      neglectedAreas: [LifeArea.Work],
      confidence: 0.8,
      summary: "安定した状態",
    })),
  },
}));

vi.mock("../life-trajectory-service", () => ({
  LifeTrajectoryService: {
    generateLifeTrajectory: vi.fn(() => Promise.resolve({
      userId: "test-user",
      generatedAt: new Date(),
      energyTrend: "STABLE",
      stressTrend: "DECLINING",
      engagementTrend: "RISING",
      growthTrend: "RISING",
      recoveryDetected: true,
      burnoutRisk: 0.1,
      stagnationRisk: 0.05,
      confidence: 0.9,
      summary: "回復傾向",
    })),
  },
}));

vi.mock("../weekly-review-service", () => ({
  WeeklyReviewService: {
    generateWeeklyReview: vi.fn(() => Promise.resolve({
      userId: "test-user",
      periodStart: new Date(),
      periodEnd: new Date(),
      totalScoreDelta: 50,
      areaBreakdown: {},
      strongestArea: LifeArea.Mind,
      weakestArea: LifeArea.Work,
      completedActions: 10,
      completedHabits: 5,
      completedRecommendations: 2,
      habitCompletionRate: 90,
      recommendationCompletionRate: 80,
      summary: "良い週でした",
      insights: [],
      recommendations: [],
    })),
  },
}));

vi.mock("../strategy-learning-service", () => ({
  StrategyLearningService: {
    generateUserStrategyProfile: vi.fn(() => Promise.resolve({
      userId: "test-user", generatedAt: new Date(), preferredStrategies: [RecommendationStrategy.SMALL_WIN],
      avoidedStrategies: [], effectivenessScores: {
        [RecommendationStrategy.SMALL_WIN]: { acceptanceRate: 0.9, completionRate: 0.8, averageScoreImpact: 5, burnoutOccurrenceRate: 0.1, confidence: 1.0, totalRecommendations: 10 },
        [RecommendationStrategy.RECOVERY]: { acceptanceRate: 0.5, completionRate: 0.4, averageScoreImpact: 3, burnoutOccurrenceRate: 0.3, confidence: 0.5, totalRecommendations: 5 },
        // ... other strategies
      } as any,
      summary: "SMALL_WINを好む",
    })),
  },
}));

describe("FutureForecastService Integration Tests", () => {
  const userId = "test-user";

  beforeEach(async () => {
    await prisma.futureForecastSnapshot.deleteMany({ where: { userId } });
  });

  it("should generate a future forecast based on current data", async () => {
    const forecast = await FutureForecastService.generateForecast(userId);

    expect(forecast.userId).toBe(userId);
    expect(forecast.forecastHorizonDays).toBe(14);
    expect(forecast.predictedEnergy).toBe("HIGH"); // Based on RISING energy trend
    expect(forecast.predictedStress).toBe("LOW"); // Based on DECLINING stress trend
    expect(forecast.predictedGrowth).toBe("RISING"); // Based on RISING growth trend
    expect(forecast.burnoutProbability).toBeCloseTo(0.1); // Base from trajectory
    expect(forecast.stagnationProbability).toBeCloseTo(0.05); // Base from trajectory
    expect(forecast.successProbability).toBeGreaterThan(0.5); // Should be calculated
    expect(forecast.confidence).toBeGreaterThan(0.5); // Should be average of sub-engines
    expect(forecast.summary).toBeTypeOf("string");

    const snapshots = await prisma.futureForecastSnapshot.findMany({ where: { userId } });
    expect(snapshots.length).toBe(1);
    expect((snapshots[0].forecast as any).predictedEnergy).toBe("HIGH");
  });

  it("should return a forecast history", async () => {
    await FutureForecastService.generateForecast(userId);
    vi.setSystemTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Advance time
    await FutureForecastService.generateForecast(userId);

    const history = await FutureForecastService.getForecastHistory(userId);
    expect(history.length).toBe(2);
    expect(history[0].userId).toBe(userId);
  });

  it("should adjust burnout probability based on state and trajectory", async () => {
    // Mock LifeState and LifeTrajectory to simulate high risk
    vi.mock("../life-state-service", () => ({
      LifeStateService: {
        generateLifeState: vi.fn(() => Promise.resolve({
          userId: "test-user", generatedAt: new Date(), energyLevel: "LOW", stressLevel: "HIGH",
          growthMomentum: "DECLINING", engagementLevel: "LOW", dominantAreas: [], neglectedAreas: [],
          confidence: 0.7, summary: ""
        })),
      },
    }));
    vi.mock("../life-trajectory-service", () => ({
      LifeTrajectoryService: {
        generateLifeTrajectory: vi.fn(() => Promise.resolve({
          userId: "test-user", generatedAt: new Date(), energyTrend: "DECLINING", stressTrend: "RISING",
          engagementTrend: "DECLINING", growthTrend: "DECLINING", recoveryDetected: false,
          burnoutRisk: 0.6, stagnationRisk: 0.2, confidence: 0.8, summary: ""
        })),
      },
    }));

    const forecast = await FutureForecastService.generateForecast(userId);
    expect(forecast.burnoutProbability).toBeCloseTo(Math.min(1.0, 0.6 + 0.3 + 0.3)); // 0.6 (base) + 0.3 (low energy & declining) + 0.3 (high stress & rising)
    expect(forecast.burnoutProbability).toBe(1.0); // Capped at 1.0
  });
});