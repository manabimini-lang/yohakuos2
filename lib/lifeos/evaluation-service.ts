// ===================================================
// YOHAKU Life OS — Forecast Evaluation Service
// ===================================================
 
import { prisma } from "@/lib/prisma";
import { LifeState, LifeTrajectory, ForecastEvaluation, FutureForecast } from "./types";
import { LifeStateService } from "./life-state-service";
import { LifeTrajectoryService } from "./life-trajectory-service";

export class ForecastEvaluationService {
    /**
     * 指定された予測 ID の結果を実際のデータに基づいて評価する
     */
    static async evaluateForecast(forecastId: string): Promise<ForecastEvaluation> {
        const snapshot = await prisma.futureForecastSnapshot.findUniqueOrThrow({
            where: { id: forecastId }
        });
        const forecast = snapshot.forecast as unknown as FutureForecast;
        const userId = snapshot.userId;

        // 1. 実績データの取得 (現在の状態を実績とする)
        const actualState = await LifeStateService.generateLifeState(userId);
        const actualTrajectory = await LifeTrajectoryService.generateLifeTrajectory(userId);
        const actualForecastHorizonEnd = new Date(snapshot.createdAt.getTime() + forecast.forecastHorizonDays * 24 * 60 * 60 * 1000);

        // 2. Burnout Actual 判定
        const burnoutActual = 
            actualState.energyLevel === "LOW" && 
            actualState.stressLevel === "HIGH" && 
            actualState.engagementLevel === "LOW";

        // 3. Stagnation Actual 判定
        const stagnationActual = 
            actualTrajectory.growthTrend === "DECLINING" || actualTrajectory.stagnationRisk > 0.7;

        // 4. Success Actual 判定
        // 予測時に生成された RecommendedQuietPlan の完了実績を確認
        const recommendations = await prisma.recommendedQuietPlan.findMany({
            where: { userId, createdAt: { gte: snapshot.createdAt, lt: actualForecastHorizonEnd } }
        });
        const accepted = recommendations.filter(r => r.status === "ACCEPTED");
        const completedPlans = await prisma.quietPlan.findMany({
            where: { recommendedQuietPlanId: { in: accepted.map(a => a.id) }, status: "COMPLETED" }
        });
        const successActual = accepted.length > 0 ? (completedPlans.length / accepted.length) >= 0.7 : false;

        // 5. Strategy Outcomes の評価
        const strategyOutcomes: any[] = [];
        for (const rec of recommendations) {
            const isAccepted = rec.status === "ACCEPTED";
            const isCompleted = completedPlans.some(p => p.recommendedQuietPlanId === rec.id);
            const scoreImpactEvent = await prisma.lifeScoreEvent.findFirst({
                where: {
                    userId,
                    recommendationId: rec.id, // This links to RecommendedQuietPlan.id
                    reason: "RECOMMENDATION_COMPLETED"
                },
                select: { delta: true }
            });
            const scoreImpact = scoreImpactEvent?.delta || 0;

            // 推薦が生成された時点から評価時点までのバーンアウト発生有無
            const burnoutOccurredDuringHorizon = await prisma.lifeStateSnapshot.count({
                where: {
                    userId,
                    createdAt: { gte: rec.createdAt, lte: actualForecastHorizonEnd },
                    state: {
                        path: ['stressLevel'],
                        equals: 'HIGH'
                    }
                }
            }) > 0;

            strategyOutcomes.push({
                strategy: rec.strategy,
                recommendationId: rec.id,
                success: isAccepted && isCompleted,
                scoreImpact,
                burnoutOccurred: burnoutOccurredDuringHorizon,
                evaluatedAt: now,
            });
        }

        const burnoutError = Math.abs((burnoutActual ? 1 : 0) - forecast.burnoutProbability);
        const stagnationError = Math.abs((stagnationActual ? 1 : 0) - forecast.stagnationProbability);
        const successError = Math.abs((successActual ? 1 : 0) - forecast.successProbability);
        
        const accuracyScore = 1 - ((burnoutError + stagnationError + successError) / 3);
        const evaluation: ForecastEvaluation = {
            id: "", // DBで発行
            userId,
            forecastId,
            evaluatedAt: new Date(),
            burnoutPrediction: forecast.burnoutProbability,
            burnoutActual,
            stagnationPrediction: forecast.stagnationProbability,
            stagnationActual,
            successPrediction: forecast.successProbability,
            successActual,
            confidence: forecast.confidence,
            accuracyScore,
            notes: `Evaluation for model ${snapshot.modelVersion}`
        };

        await prisma.forecastEvaluation.create({
            data: {
                userId,
                forecastId,
                evaluation: evaluation as any,
                accuracyScore,
                strategyOutcomes: strategyOutcomes as any,
            }
        });

        return evaluation;
    }

    /**
     * 評価履歴を取得
     */
    static async getEvaluationHistory(userId: string) {
        return await prisma.forecastEvaluation.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: { forecast: true }
        });
    }
}