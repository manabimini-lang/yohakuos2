import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { StrategyLearningService } from "../strategy-learning-service";
import { LifeArea, RecommendationStatus, DifficultyLevel, RecommendationStrategy, QuietPlanStatus } from "@prisma/client";
import { LifeState } from "../types";
import { LifeTrajectory } from "../types";
import { FutureForecast } from "../types";
import { PreferenceProfile } from "../types";
import { WeeklyReview } from "../types";
import { LifeReportGeneratorService } from "../report-generator";
import { SafetyPolicyEngine } from "../safety-engine";

// Mock external service calls for report generation
vi.mock("../preference-service", () => ({
  PreferenceProfileService: {
    generatePreferenceProfile: vi.fn(() => Promise.resolve({
      userId: "test-user", generatedAt: new Date(), areas: {}, preferredAreas: [], avoidedAreas: [],
      preferredDifficulty: DifficultyLevel.MEDIUM, behaviorStyle: "CONSISTENT", summary: ""
    })),
  },
}));
vi.mock("../life-state-service", () => ({
  LifeStateService: {
    generateLifeState: vi.fn(() => Promise.resolve({
      userId: "test-user", generatedAt: new Date(), energyLevel: "MEDIUM", stressLevel: "LOW",
      growthMomentum: "STABLE", engagementLevel: "HIGH", dominantAreas: [], neglectedAreas: [],
      confidence: 0.8, summary: ""
    })),
  },
}));
vi.mock("../life-trajectory-service", () => ({
  LifeTrajectoryService: {
    generateLifeTrajectory: vi.fn(() => Promise.resolve({
      userId: "test-user", generatedAt: new Date(), energyTrend: "STABLE", stressTrend: "DECLINING",
      engagementTrend: "RISING", growthTrend: "RISING", recoveryDetected: true,
      burnoutRisk: 0.1, stagnationRisk: 0.05, confidence: 0.9, summary: ""
    })),
  },
}));
vi.mock("../future-forecast-service", () => ({
  FutureForecastService: {
    generateForecast: vi.fn(() => Promise.resolve({
      userId: "test-user", generatedAt: new Date(), forecastHorizonDays: 14, predictedEnergy: "HIGH",
      predictedStress: "LOW", predictedGrowth: "RISING", burnoutProbability: 0.1,
      stagnationProbability: 0.05, successProbability: 0.8, confidence: 0.9, summary: ""
    })),
  },
}));
vi.mock("../weekly-review-service", () => ({
  WeeklyReviewService: {
    generateWeeklyReview: vi.fn(() => Promise.resolve({
      userId: "test-user", periodStart: new Date(), periodEnd: new Date(), totalScoreDelta: 50,
      areaBreakdown: {}, strongestArea: LifeArea.Mind, weakestArea: LifeArea.Work,
      completedActions: 10, completedHabits: 5, completedRecommendations: 2,
      habitCompletionRate: 90, recommendationCompletionRate: 80, summary: "", insights: [], recommendations: [],
    })),
  },
}));

describe("StrategyLearningService Integration Tests", () => {
  const userId = "test-user-strategy";
  const MOCK_DATE = new Date("2024-03-10T12:00:00.000Z");
  vi.useFakeTimers();
  vi.setSystemTime(MOCK_DATE);

  beforeEach(async () => {
    await prisma.userStrategyProfileSnapshot.deleteMany({ where: { userId } });
    await prisma.forecastEvaluation.deleteMany({ where: { userId } });
    await prisma.recommendedQuietPlan.deleteMany({ where: { userId } });
    await prisma.quietPlan.deleteMany({ where: { userId } });
    await prisma.lifeScoreEvent.deleteMany({ where: { userId } });
    await prisma.lifeStateSnapshot.deleteMany({ where: { userId } }); // For burnout check
  });

  it("should generate a user strategy profile based on past evaluations", async () => {
    // Simulate a forecast and its evaluation
    const forecast = await prisma.futureForecastSnapshot.create({
      data: {
        userId,
        forecast: { burnoutProbability: 0.1, stagnationProbability: 0.1, successProbability: 0.8 } as any,
        modelVersion: "v1.0"
      }
    });

    // Simulate recommendations made during this forecast period
    const rec1 = await prisma.recommendedQuietPlan.create({
      data: {
        userId, area: LifeArea.Health, title: "Small Win Health", reason: "", expectedImpact: "",
        strategy: RecommendationStrategy.SMALL_WIN, reasoning: "", difficultyLevel: DifficultyLevel.LOW,
        status: RecommendationStatus.ACCEPTED, createdAt: new Date(MOCK_DATE.getTime() - 5 * 24 * 60 * 60 * 1000)
      }
    });
    const plan1 = await prisma.quietPlan.create({
      data: { userId, area: LifeArea.Health, intention: rec1.title, recommendedQuietPlanId: rec1.id, status: QuietPlanStatus.COMPLETED }
    });
    await prisma.lifeScoreEvent.create({
      data: { userId, area: LifeArea.Health, delta: 5, reason: "RECOMMENDATION_COMPLETED", recommendationId: plan1.id }
    });

    const rec2 = await prisma.recommendedQuietPlan.create({
      data: {
        userId, area: LifeArea.Work, title: "Challenge Work", reason: "", expectedImpact: "",
        strategy: RecommendationStrategy.CHALLENGE, reasoning: "", difficultyLevel: DifficultyLevel.HIGH,
        status: RecommendationStatus.DISMISSED, createdAt: new Date(MOCK_DATE.getTime() - 3 * 24 * 60 * 60 * 1000)
      }
    });

    // Simulate a LifeStateSnapshot indicating no burnout
    await prisma.lifeStateSnapshot.create({
      data: {
        userId,
        state: { energyLevel: "MEDIUM", stressLevel: "LOW", engagementLevel: "HIGH" } as any,
        createdAt: new Date(MOCK_DATE.getTime() + 14 * 24 * 60 * 60 * 1000) // After forecast horizon
      }
    });

    // Evaluate the forecast (which includes strategy outcomes)
    await ForecastEvaluationService.evaluateForecast(forecast.id);

    // Generate user strategy profile
    const profile = await StrategyLearningService.generateUserStrategyProfile(userId);

    expect(profile.userId).toBe(userId);
    expect(profile.effectivenessScores[RecommendationStrategy.SMALL_WIN].totalRecommendations).toBe(1);
    expect(profile.effectivenessScores[RecommendationStrategy.SMALL_WIN].completionRate).toBe(1);
    expect(profile.effectivenessScores[RecommendationStrategy.SMALL_WIN].averageScoreImpact).toBe(5);
    expect(profile.effectivenessScores[RecommendationStrategy.SMALL_WIN].burnoutOccurrenceRate).toBe(0);
    expect(profile.effectivenessScores[RecommendationStrategy.SMALL_WIN].confidence).toBeCloseTo(0.1);

    expect(profile.effectivenessScores[RecommendationStrategy.CHALLENGE].totalRecommendations).toBe(1);
    expect(profile.effectivenessScores[RecommendationStrategy.CHALLENGE].completionRate).toBe(0);
    expect(profile.effectivenessScores[RecommendationStrategy.CHALLENGE].burnoutOccurrenceRate).toBe(0);

    expect(profile.preferredStrategies).toContain(RecommendationStrategy.SMALL_WIN);
    expect(profile.avoidedStrategies).not.toContain(RecommendationStrategy.CHALLENGE); // Not enough confidence yet
    expect(profile.summary).toBeTypeOf("string");

    const snapshots = await prisma.userStrategyProfileSnapshot.findMany({ where: { userId } });
    expect(snapshots.length).toBe(1);
    expect((snapshots[0].profile as any).preferredStrategies).toContain(RecommendationStrategy.SMALL_WIN);
  });

  it("should save and retrieve user strategy profile snapshots", async () => {
    const profile1 = await StrategyLearningService.generateUserStrategyProfile(userId);
    await StrategyLearningService.saveUserStrategyProfileSnapshot(profile1);

    vi.setSystemTime(new Date(MOCK_DATE.getTime() + 7 * 24 * 60 * 60 * 1000)); // Advance time

    // Simulate more data to change profile
    await prisma.recommendedQuietPlan.create({
      data: {
        userId, area: LifeArea.Learning, title: "New Learning Plan", reason: "", expectedImpact: "",
        strategy: RecommendationStrategy.EXPLORATION, reasoning: "", difficultyLevel: DifficultyLevel.MEDIUM,
        status: RecommendationStatus.ACCEPTED, createdAt: new Date(MOCK_DATE.getTime() + 1 * 24 * 60 * 60 * 1000)
      }
    });
    const forecast2 = await prisma.futureForecastSnapshot.create({ data: { userId, forecast: {} as any, modelVersion: "v1.0" } });
    await ForecastEvaluationService.evaluateForecast(forecast2.id);

    const profile2 = await StrategyLearningService.generateUserStrategyProfile(userId);
    await StrategyLearningService.saveUserStrategyProfileSnapshot(profile2);

    const history = await StrategyLearningService.getUserStrategyProfileHistory(userId);

    expect(history.length).toBe(2);
    expect(history[0].profile.generatedAt.toISOString()).not.toBe(history[1].profile.generatedAt.toISOString());
    expect(history[0].profile.userId).toBe(userId);
  });
});