import { ulid } from "ulid";
import type { RiskAssessment, RiskLevel, EscalationAction, Escalation, SafetyState } from "../types";

// ===================================================
// Escalation Engine
// ===================================================

/**
 * リスクレベルに基づいてエスカレーションアクションを決定する。
 */
export function determineEscalationAction(riskLevel: RiskLevel): EscalationAction {
  switch (riskLevel) {
    case "low":
      return "monitoring";
    case "medium":
      return "review_queue";
    case "high":
      return "moderator_escalation";
    case "critical":
      return "safety_restriction"; // クリティカルリスクの場合は制限措置を提案
    default:
      return "monitoring";
  }
}

/**
 * エスカレーションを作成し、記録する。
 * 実際のシステムでは、これをデータベースに保存し、適切な通知メカニズムをトリガーします。
 */
export async function createEscalation(
  assessment: RiskAssessment,
  currentSafetyState: SafetyState,
  escalatedTo: Escalation["escalatedTo"],
  reason: string,
  escalatedBy: string,
): Promise<Escalation> {
  const escalation: Escalation = {
    id: ulid(),
    entityType: assessment.entityType,
    entityId: assessment.entityId,
    riskScore: { score: assessment.riskScore, level: assessment.riskLevel, reasons: assessment.reasons, signals: assessment.signals },
    currentSafetyState,
    escalatedTo,
    reason,
    escalatedBy,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // TODO: データベースへの保存、通知のトリガーなど
  console.log("Escalation created:", escalation);

  return escalation;
}

/**
 * リスクアセスメントに基づいてエスカレーションプロセスを開始する。
 * @returns 実行されたエスカレーションアクション。
 */
export async function initiateEscalationProcess(
  assessment: RiskAssessment,
  currentSafetyState: SafetyState,
  actorId: string,
): Promise<EscalationAction> {
  const action = determineEscalationAction(assessment.riskLevel);
  let escalatedTo: Escalation["escalatedTo"] | undefined;
  let reason = `リスクレベル ${assessment.riskLevel} により、${action} が推奨されます。`;

  switch (action) {
    case "monitoring":
      console.log(`[Escalation] ${assessment.entityType} ${assessment.entityId} はモニタリング対象です。`);
      break;
    case "review_queue":
      escalatedTo = "moderator";
      reason = `手動レビューが必要な中リスクレベル: ${assessment.riskLevel}.`;
      await createEscalation(assessment, currentSafetyState, escalatedTo, reason, actorId);
      console.log(`[Escalation] ${assessment.entityType} ${assessment.entityId} はレビューキューに追加されました。`);
      break;
    case "moderator_escalation":
      escalatedTo = "moderator";
      reason = `モデレーターへのエスカレーションが必要な高リスクレベル: ${assessment.riskLevel}.`;
      await createEscalation(assessment, currentSafetyState, escalatedTo, reason, actorId);
      console.log(`[Escalation] ${assessment.entityType} ${assessment.entityId} はモデレーターにエスカレーションされました。`);
      break;
    case "safety_restriction":
      escalatedTo = "admin";
      reason = `クリティカルリスクにより、システムレベルの制限措置が推奨されます。`;
      await createEscalation(assessment, currentSafetyState, escalatedTo, reason, actorId);
      console.log(`[Escalation] ${assessment.entityType} ${assessment.entityId} には安全制限が適用されます。`);
      break;
  }

  return action;
}

/**
 * Gets the escalation rule for a given risk level.
 */
export function getEscalationRule(riskLevel: RiskLevel) {
  switch (riskLevel) {
    case "low":
      return { requiresHumanReview: false, action: "monitor" as const };
    case "medium":
      return { requiresHumanReview: true, action: "review" as const };
    case "high":
      return { requiresHumanReview: true, action: "escalate" as const };
    case "critical":
      return { requiresHumanReview: true, action: "restrict" as const };
    default:
      return { requiresHumanReview: false, action: "monitor" as const };
  }
}

/**
 * Determines the escalation action and rules for a risk assessment.
 */
export function determineEscalation(
  assessment: RiskAssessment,
  previousLevel?: RiskLevel,
): { action: EscalationAction; rule: ReturnType<typeof getEscalationRule>; reason: string } {
  const rule = getEscalationRule(assessment.riskLevel);
  const action = determineEscalationAction(assessment.riskLevel);
  const reason = `リスク評価レベル: ${assessment.riskLevel} (スコア: ${assessment.riskScore.toFixed(2)}). ${
    previousLevel ? `前回のレベル: ${previousLevel}.` : ""
  }`;
  
  return { action, rule, reason };
}

