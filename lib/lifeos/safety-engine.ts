// ===================================================
// YOHAKU Life OS — Safety Policy Engine
// ===================================================
//
// ユーザーのコンディションや予測に基づいて、推薦生成の制約を動的に決定する。
//

import { LifeArea, DifficultyLevel, RecommendationStrategy } from "@prisma/client";
import { PreferenceProfile, LifeState, LifeTrajectory, FutureForecast, SafetyPolicy, SafetyMode, UserStrategyProfile } from "./types";

export class SafetyPolicyEngine {
    /**
     * 現在の全コンテキストから、推薦生成の制約（SafetyPolicy）を決定する
     */
    static evaluatePolicies(
        preference: PreferenceProfile,
        state: LifeState,
        trajectory: LifeTrajectory,
        forecast: FutureForecast,
        userStrategyProfile: UserStrategyProfile // New: UserStrategyProfile
    ): SafetyPolicy {
        const reasoning: string[] = [];
        const allAreas = Object.values(LifeArea);

        // 1. Protective Mode (最優先)
        if (forecast.burnoutProbability > 0.8 || (state.stressLevel === "HIGH" && trajectory.energyTrend === "DECLINING")) {
            reasoning.push("バーンアウトの兆候が極めて高いため、保護モードを適用します。");
            return {
                mode: "PROTECTIVE",
                allowedAreas: [LifeArea.Mind, LifeArea.Rest],
                blockedAreas: allAreas.filter(a => a !== LifeArea.Mind && a !== LifeArea.Rest),
                maxDifficulty: DifficultyLevel.LOW,
                maxRecommendations: 1,
                reasoning
            };
        }

        // 2. Recovery Mode
        if (trajectory.recoveryDetected) {
            reasoning.push("回復の兆しを検出しました。小さな成功体験を積み重ねるフェーズです。");
            return {
                mode: "RECOVERY",
                allowedAreas: allAreas,
                blockedAreas: [],
                maxDifficulty: DifficultyLevel.MEDIUM,
                maxRecommendations: 2,
                reasoning
            };
        }

        // 3. Exploration Mode
        // ユーザーの行動スタイルがEXPLORERで、かつ成長傾向にある場合
        if (preference.behaviorStyle === "EXPLORER" && trajectory.growthTrend === "RISING") {
            reasoning.push("成長の勢いがあり、新しい領域への関心が高い状態です。");
            return {
                mode: "EXPLORATION",
                allowedAreas: allAreas,
                blockedAreas: [],
                maxDifficulty: preference.preferredDifficulty, // EXPLORERは難易度も試す
                maxRecommendations: 3,
                reasoning
            };
        }

        // 4. Normal Mode (デフォルト)
        let maxDiff = preference.preferredDifficulty;
        if (forecast.successProbability < 0.3) {
            reasoning.push("予測成功率が低いため、難易度を一段階下げて提案します。");
            maxDiff = this.downgradeDifficulty(maxDiff);
        }

        // Preferred / Avoided Strategies を考慮したエリア制限
        const allowedAreas = allAreas.filter(area => !preference.avoidedAreas.includes(area));
        const blockedAreas = preference.avoidedAreas;

        return {
            mode: "NORMAL",
            allowedAreas,
            blockedAreas,
            maxDifficulty: maxDiff,
            maxRecommendations: 3,
            reasoning
        };
    }

    private static downgradeDifficulty(current: DifficultyLevel): DifficultyLevel {
        if (current === DifficultyLevel.HIGH) return DifficultyLevel.MEDIUM;
        if (current === DifficultyLevel.MEDIUM) return DifficultyLevel.LOW;
        return DifficultyLevel.LOW;
    }
}

export class SafetyPolicyEngine {
    /**
     * 現在の全コンテキストから、推薦生成の制約（SafetyPolicy）を決定する
     */
    static evaluatePolicies(
        preference: PreferenceProfile,
        state: LifeState,
        trajectory: LifeTrajectory,
        forecast: FutureForecast
    ): SafetyPolicy {
        const reasoning: string[] = [];
        const allAreas = Object.values(LifeArea);

        // 1. Protective Mode (最優先)
        if (forecast.burnoutProbability > 0.8 || (state.stressLevel === "HIGH" && trajectory.energyTrend === "DECLINING")) {
            reasoning.push("バーンアウトの兆候が極めて高いため、保護モードを適用します。");
            return {
                mode: "PROTECTIVE",
                allowedAreas: [LifeArea.Mind, LifeArea.Rest],
                blockedAreas: allAreas.filter(a => a !== LifeArea.Mind && a !== LifeArea.Rest),
                maxDifficulty: "LOW",
                maxRecommendations: 1,
                reasoning
            };
        }

        // 2. Recovery Mode
        if (trajectory.recoveryDetected) {
            reasoning.push("回復の兆しを検出しました。小さな成功体験を積み重ねるフェーズです。");
            return {
                mode: "RECOVERY",
                allowedAreas: allAreas,
                blockedAreas: [],
                maxDifficulty: "MEDIUM",
                maxRecommendations: 2,
                reasoning
            };
        }

        // 3. Exploration Mode
        if (preference.behaviorStyle === "EXPLORER" && state.growthMomentum === "RISING") {
            reasoning.push("成長の勢いがあり、新しい領域への関心が高い状態です。");
            return {
                mode: "EXPLORATION",
                allowedAreas: allAreas,
                blockedAreas: [],
                maxDifficulty: preference.preferredDifficulty,
                maxRecommendations: 3,
                reasoning
            };
        }

        // 4. Normal Mode
        let maxDiff = preference.preferredDifficulty;
        if (forecast.successProbability < 0.3) {
            reasoning.push("予測成功率が低いため、難易度を一段階下げて提案します。");
            maxDiff = this.downgradeDifficulty(maxDiff);
        }

        return {
            mode: "NORMAL",
            allowedAreas: allAreas.filter(a => !preference.avoidedAreas.includes(a)),
            blockedAreas: preference.avoidedAreas,
            maxDifficulty: maxDiff,
            maxRecommendations: 3,
            reasoning
        };
    }

    private static downgradeDifficulty(current: DifficultyLevel): DifficultyLevel {
        if (current === "HIGH") return "MEDIUM";
        return "LOW";
    }
}