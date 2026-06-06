// ===================================================
// YOHAKU Life OS — AI Life Report Generator
// ===================================================

import { generateText } from "@/lib/ai/gemini";
import { WeeklyReview, LifeReport, RecommendedQuietPlan, PreferenceProfile, LifeState, LifeTrajectory, FutureForecast, SafetyPolicy } from "./types";
import { LifeArea, RecommendationStrategy, DifficultyLevel } from "@prisma/client";
import { PreferenceProfileService } from "./preference-service";
import { LifeStateService } from "./life-state-service";
import { LifeTrajectoryService } from "./life-trajectory-service";
import { FutureForecastService } from "./future-forecast-service";
import { StrategyLearningService } from "./strategy-learning-service";
import { SafetyPolicyEngine } from "./safety-engine";

export class LifeReportGeneratorService {
  /**
   * WeeklyReview を元に AI Life Report を生成する
   */
  static async generateLifeReport(weeklyReview: WeeklyReview): Promise<LifeReport> {
    // 長期傾向、短期状態、軌道、未来予測、戦略プロファイルを取得
    const [preference, lifeState, lifeTrajectory, futureForecast, userStrategyProfile] = await Promise.all([
      PreferenceProfileService.generatePreferenceProfile(weeklyReview.userId),
      LifeStateService.generateLifeState(weeklyReview.userId),
      LifeTrajectoryService.generateLifeTrajectory(weeklyReview.userId),
      FutureForecastService.generateForecast(weeklyReview.userId),
      StrategyLearningService.generateUserStrategyProfile(weeklyReview.userId),
    ]);

    // Safety Policy Engine を通して推薦の制約を決定
    const safetyPolicy = SafetyPolicyEngine.evaluatePolicies(preference, lifeState, lifeTrajectory, futureForecast);

    const prompt = this.buildPrompt(weeklyReview, preference, lifeState, lifeTrajectory, futureForecast, userStrategyProfile, safetyPolicy);
    
    // システムプロンプトは既存の SEASONAL_SYSTEM_PROMPT などを参考にしつつ、
    // 今回は具体的な指示をプロンプト内に含める
    const { text } = await generateText(prompt, "あなたは人生の質を静かに見守り、導く YOHAKU OS のライフコーチです。");

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI response does not contain valid JSON");
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        generatedAt: new Date(),
        score: {
          totalScoreDelta: weeklyReview.totalScoreDelta,
          strongestArea: weeklyReview.strongestArea,
          weakestArea: weeklyReview.weakestArea,
        },
        executiveSummary: parsed.executiveSummary || "",
        achievements: parsed.achievements || [],
        risks: parsed.risks || [],
        opportunities: parsed.opportunities || [],
        nextWeekFocusAreas: (parsed.nextWeekFocusAreas || []) as LifeArea[],
        recommendedPlans: (parsed.recommendedPlans || []) as RecommendedQuietPlan[],
        aiNarrative: parsed.aiNarrative || "",
      };
    } catch (error) {
      console.error("Failed to parse Life Report JSON:", error);
      throw new Error("レポートの生成に失敗しました。");
    }
  }

  private static buildPrompt(review: WeeklyReview, pref: PreferenceProfile, state: LifeState, traj: LifeTrajectory, forecast: FutureForecast, userStrategyProfile: UserStrategyProfile, safetyPolicy: SafetyPolicy): string {
    return `
以下はユーザーの一週間の活動データ（WeeklyReview）です。
このデータを元に、人間が理解しやすく、行動を促す「Explainable Life Report」を生成してください。

## ユーザーの個人嗜好（PreferenceProfile）
- 行動スタイル: ${pref.behaviorStyle} (例: ACHIEVERなら成果、CONSISTENTなら継続を重視)
- 好みの難易度: ${pref.preferredDifficulty}
- 優先すべき領域: ${pref.preferredAreas.join(", ")}
- 避けるべき領域: ${pref.avoidedAreas.join(", ")}
- ユーザーの傾向: ${pref.summary}

## ユーザーの現在の状態（LifeState）
- エネルギーレベル: ${state.energyLevel}
- ストレスレベル: ${state.stressLevel}
- 成長モーメンタム: ${state.growthMomentum}
- 主要な領域: ${state.dominantAreas.join(", ")}
- 疎かになっている領域: ${state.neglectedAreas.join(", ")}
- ステートサマリー: ${state.summary}

- 主要な領域: ${state.dominantAreas.join(", ")}
- 疎かになっている領域: ${state.neglectedAreas.join(", ")}
- ステートサマリー: ${state.summary}

## ユーザーの軌道（LifeTrajectory）
- エネルギー傾向: ${traj.energyTrend}
- ストレス傾向: ${traj.stressTrend}
- 成長傾向: ${traj.growthTrend}
- バーンアウトリスク: ${Math.round(traj.burnoutRisk * 100)}%
- 停滞リスク: ${Math.round(traj.stagnationRisk * 100)}%
- 回復の兆し: ${traj.recoveryDetected ? "あり" : "なし"}

## 将来予測（FutureForecast - ${forecast.forecastHorizonDays}日後）
- 予測エネルギー: ${forecast.predictedEnergy}
- 予測ストレス: ${forecast.predictedStress}
- 予測成長: ${forecast.predictedGrowth}
- バーンアウト確率: ${Math.round(forecast.burnoutProbability * 100)}%
- 停滞確率: ${Math.round(forecast.stagnationProbability * 100)}%
- 成功確率（新しい推薦の）: ${Math.round(forecast.successProbability * 100)}%
- 予測サマリー: ${forecast.summary}

## 入力データ
- 期間: ${review.periodStart.toLocaleDateString()} - ${review.periodEnd.toLocaleDateString()}
- 合計スコア変化: +${review.totalScoreDelta}
- 領域別内訳: ${JSON.stringify(review.areaBreakdown)}
- 最も成長した領域: ${review.strongestArea || "なし"}
- 最も活動が少なかった領域: ${review.weakestArea || "なし"}
- 完了したアクション数: ${review.completedActions}
- 習慣継続率: ${review.habitCompletionRate}%
- QuietPlan達成率: ${review.recommendationCompletionRate}%
- システムサマリー: ${review.summary}

## 出力要件
以下のJSON形式で出力してください。
{
  "executiveSummary": "一週間の要約（2-3文）",
  "achievements": ["達成事項1", "達成事項2", "達成事項3"], // 最低3件。成長領域や完了率に注目
  "risks": ["リスク1", "リスク2", "リスク3"], // 最低3件。停滞領域や未達成に注目
  "opportunities": ["改善の機会1", "機会2", "機会3"], // 最低3件
  "nextWeekFocusAreas": ["Health", "Learning", "..."], // 優先度順で最大3件。LifeArea enumの値を使用。
  "recommendedPlans": [
    {
      "area": "LifeAreaの値",
      "title": "プランのタイトル",
      "reason": "なぜこの提案をするのか",
      "expectedImpact": "期待される効果",
      "difficultyLevel": "LOW | MEDIUM | HIGH" // Add difficultyLevel
    }
  ], // 最低3件
  "aiNarrative": "300-600文字程度の、前向きで分析的なナラティブ。説教臭くならず、なぜその提案や評価になったのかを論理的に説明すること。"
}

## トーン
- 前向きかつ分析的
- 非説教的
- 説明可能（Explainable）: データの根拠を示すこと
`;
  }
}