import { ulid } from "ulid";
import type { RiskLevel, SafetySignal, RiskAssessment, RiskScore, SignalType } from "../types";

// ===================================================
// Risk Scoring Engine
// ===================================================

/**
 * 各シグナルタイプのリスク重み付け。
 * これはポリシーや機械学習モデルによって動的に調整される可能性があります。
 */
const SIGNAL_WEIGHTS: Record<SignalType, number> = {
  usage_frequency: 0.1,
  night_activity: 0.2,
  session_duration: 0.1,
  emotional_volatility: 0.3,
  repeated_reassurance_requests: 0.4,
  unsafe_prompt_patterns: 0.5,
  dependency_indicators: 0.6,
  harassment: 0.8,
  dm_abuse: 0.7,
  manipulation_attempts: 0.75,
};

/**
 * リスクスコアに基づいてリスクレベルを決定します。
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 0.7) return "critical";
  if (score >= 0.5) return "high";
  if (score >= 0.3) return "medium";
  return "low";
}

/**
 * 複数のSafetySignalを統合し、総合的なリスクスコアを計算します。
 * これはmulti-factor risk scoringとsignal aggregationに対応しています。
 */
export function calculateRiskScore(signals: SafetySignal[]): RiskScore {
  if (signals.length === 0) {
    return { score: 0, level: "low", reasons: ["No signals provided"], signals: [] };
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;
  const reasons: string[] = [];

  signals.forEach((signal) => {
    const weight = SIGNAL_WEIGHTS[signal.type] || 0.1; // 未定義のシグナルタイプにはデフォルトの重み
    totalWeightedScore += (signal.value as number) * weight;
    totalWeight += weight;
    if ((signal.value as number) > 0.5 && weight > 0.3) {
      reasons.push(`${signal.type} シグナルが高値 (${(signal.value as number).toFixed(2)})`);
    }
  });

  const averageScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  const finalScore = Math.min(averageScore * 1.5, 1); // スコアを少しブーストして正規化

  const level = getRiskLevel(finalScore);

  if (level === "critical") {
    reasons.push("クリティカルなリスクレベルに達しました");
  } else if (level === "high") {
    reasons.push("高リスクレベル");
  }

  return {
    score: finalScore,
    level,
    reasons: reasons.length > 0 ? reasons : ["リスクシグナルは検出されませんでした"],
    signals,
  };
}

/**
 * 特定のエンティティ（ユーザーまたはAI応答）のリスクアセスメントを実行します。
 * これはrisk_score calculation abstractionを提供します。
 */
export async function performRiskAssessment(
  entityType: "user" | "ai_response",
  entityId: string,
  signals: SafetySignal[],
): Promise<RiskAssessment> {
  const riskScore = calculateRiskScore(signals);

  return {
    id: ulid(),
    entityType,
    entityId,
    riskScore: riskScore.score,
    riskLevel: riskScore.level,
    reasons: riskScore.reasons,
    signals: riskScore.signals,
    timestamp: new Date(),
  };
}

/**
 * Assess risk for a user based on signals.
 */
export function assessRisk(userId: string, signals: SafetySignal[]): RiskAssessment {
  const riskScore = calculateRiskScore(signals);
  return {
    id: ulid(),
    entityType: "user",
    entityId: userId,
    riskScore: riskScore.score,
    riskLevel: riskScore.level,
    reasons: riskScore.reasons,
    signals: riskScore.signals,
    timestamp: new Date(),
  };
}

/**
 * Maps a numerical risk score to a RiskLevel.
 */
export function scoreToRiskLevel(score: number): RiskLevel {
  return getRiskLevel(score);
}

/**
 * Determines whether a risk assessment needs escalation.
 */
export function needsEscalation(assessment: RiskAssessment): boolean {
  return assessment.riskLevel === "high" || assessment.riskLevel === "critical";
}

