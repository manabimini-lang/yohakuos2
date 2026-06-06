// ===================================================
// YOHAKU Life OS — Strategy Learning Engine
// ===================================================

import { prisma } from "@/lib/prisma";
import { LifeArea, RecommendationStrategy } from "@prisma/client";
import { UserStrategyProfile, UserStrategyProfileSnapshot, StrategyOutcome } from "./types";
import { generateText } from "@/lib/ai/gemini";

export class StrategyLearningService {
    /**
     * ユーザーの推薦戦略プロファイルを生成
     */
    static async generateUserStrategyProfile(userId: string): Promise<UserStrategyProfile> {
        const now = new Date();
        const allStrategies = Object.values(RecommendationStrategy);
        const effectivenessScores: Record<RecommendationStrategy, {
            acceptanceRate: number;
            completionRate: number;
            averageScoreImpact: number;
            burnoutOccurrenceRate: number;
            confidence: number;
            totalRecommendations: number;
        }> = {} as any;

        for (const strategy of allStrategies) {
            effectivenessScores[strategy] = {
                acceptanceRate: 0,
                completionRate: 0,
                averageScoreImpact: 0,
                burnoutOccurrenceRate: 0,
                confidence: 0,
                totalRecommendations: 0,
            };
        }

        // 1. 全ての ForecastEvaluation から StrategyOutcome を集計
        const evaluations = await prisma.forecastEvaluation.findMany({
            where: { userId },
            select: { strategyOutcomes: true }
        });

        const allOutcomes: StrategyOutcome[] = [];
        evaluations.forEach(e => {
            if (e.strategyOutcomes) {
                allOutcomes.push(...(e.strategyOutcomes as unknown as StrategyOutcome[]));
            }
        });

        // 2. 戦略ごとの統計を計算
        const strategyData: Record<RecommendationStrategy, {
            total: number;
            accepted: number;
            completed: number;
            totalScore: number;
            burnoutCount: number;
        }> = {} as any;

        for (const strategy of allStrategies) {
            strategyData[strategy] = { total: 0, accepted: 0, completed: 0, totalScore: 0, burnoutCount: 0 };
        }

        for (const outcome of allOutcomes) {
            strategyData[outcome.strategy].total++;
            if (outcome.success) { // success means accepted AND completed
                strategyData[outcome.strategy].accepted++; // Accepted is implicit in success
                strategyData[outcome.strategy].completed++;
                strategyData[outcome.strategy].totalScore += outcome.scoreImpact;
            }
            if (outcome.burnoutOccurred) {
                strategyData[outcome.strategy].burnoutCount++;
            }
        }

        // 3. Effectiveness Score の算出
        for (const strategy of allStrategies) {
            const data = strategyData[strategy];
            const total = data.total;
            if (total === 0) continue;

            const acceptanceRate = data.accepted / total; // Assuming accepted is part of success
            const completionRate = data.completed / total;
            const averageScoreImpact = data.completed > 0 ? data.totalScore / data.completed : 0;
            const burnoutOccurrenceRate = data.burnoutCount / total;
            const confidence = Math.min(1.0, total / 10); // 10件で信頼度1.0

            effectivenessScores[strategy] = {
                acceptanceRate,
                completionRate,
                averageScoreImpact,
                burnoutOccurrenceRate,
                confidence,
                totalRecommendations: total,
            };
        }

        // 4. Preferred / Avoided Strategies
        const preferredStrategies = allStrategies.filter(s => 
            effectivenessScores[s].confidence > 0.5 && 
            effectivenessScores[s].completionRate > 0.6 && 
            effectivenessScores[s].burnoutOccurrenceRate < 0.3
        );
        const avoidedStrategies = allStrategies.filter(s => 
            effectivenessScores[s].confidence > 0.5 && 
            effectivenessScores[s].burnoutOccurrenceRate > 0.5
        );

        // 5. Summary 生成 (AI)
        const summary = await this.generateStrategyProfileSummary(effectivenessScores, preferredStrategies, avoidedStrategies);

        const profile: UserStrategyProfile = {
            userId,
            generatedAt: now,
            preferredStrategies,
            avoidedStrategies,
            effectivenessScores,
            summary,
        };

        // 6. スナップショットの保存
        await this.saveUserStrategyProfileSnapshot(profile);

        return profile;
    }

    private static async generateStrategyProfileSummary(scores: any, preferred: RecommendationStrategy[], avoided: RecommendationStrategy[]): Promise<string> {
        const prompt = `ユーザーの推薦戦略に関する学習結果を100-300文字で要約してください。
好む戦略: ${preferred.join(", ")}
避けるべき戦略: ${avoided.join(", ")}
各戦略の有効性スコア: ${JSON.stringify(scores)}

トーン: 前向き、分析的、非説教的、Explainable。`;
        const { text } = await generateText(prompt, "あなたはYOHAKU OSの戦略学習エンジンです。");
        return text;
    }

    static async saveUserStrategyProfileSnapshot(profile: UserStrategyProfile): Promise<UserStrategyProfileSnapshot> {
        const snapshot = await prisma.userStrategyProfileSnapshot.create({
            data: {
                userId: profile.userId,
                profile: profile as any,
            },
        });
        return snapshot as UserStrategyProfileSnapshot;
    }

    static async getUserStrategyProfileHistory(userId: string): Promise<UserStrategyProfileSnapshot[]> {
        const snapshots = await prisma.userStrategyProfileSnapshot.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        return snapshots.map(s => ({
            ...s,
            profile: s.profile as UserStrategyProfile,
        }));
    }

    static async getLatestUserStrategyProfile(userId: string): Promise<UserStrategyProfile | null> {
        const snapshot = await prisma.userStrategyProfileSnapshot.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" }
        });
        return snapshot ? (snapshot.profile as unknown as UserStrategyProfile) : null;
    }
}