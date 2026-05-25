import type { SafetyPolicy, SafetySignal, RiskAssessment, SignalType } from "../types";

// ===================================================
// Safety Policies
// ===================================================

/**
 * 定義済みの安全ポリシーのリスト。
 * 実際にはデータベースからロードされるか、設定ファイルで管理されます。
 */
export const SAFETY_POLICIES: SafetyPolicy[] = [
  {
    id: "policy-1001",
    name: "依存防止ポリシー",
    description: "AI応答がユーザーのAIへの依存を促す兆候を検出します。",
    criteria: { signalType: "dependency_indicators", threshold: 0.6 },
    action: "review",
    isActive: true,
  },
  {
    id: "policy-1002",
    name: "危険なAI応答ポリシー",
    description: "AIが不適切または危険なコンテンツを生成する可能性のあるパターンを特定します。",
    criteria: { signalType: "unsafe_prompt_patterns", threshold: 0.7 },
    action: "restrict",
    isActive: true,
  },
  {
    id: "policy-1003",
    name: "ハラスメントエスカレーションポリシー",
    description: "ユーザーがハラスメント行為に従事している場合にエスカレーションします。",
    criteria: { signalType: "harassment", threshold: 0.8 },
    action: "escalate",
    isActive: true,
  },
  {
    id: "policy-1004",
    name: "夜間活動モニタリングポリシー",
    description: "夜間の異常な活動パターンをモニタリング対象とします。",
    criteria: { signalType: "night_activity", threshold: 0.5 },
    action: "monitor",
    isActive: true,
  },
  {
    id: "policy-1005",
    name: "DM乱用検出ポリシー",
    description: "DM乱用のシグナルが高値の場合、レビューキューに追加します。",
    criteria: { signalType: "dm_abuse", threshold: 0.7 },
    action: "review",
    isActive: true,
  },
];

/**
 * 指定されたシグナルタイプと値に基づいて、関連するアクティブなポリシーを評価します。
 * @param signalType - 評価するシグナルのタイプ
 * @param signalValue - シグナルの値
 * @returns 適用される可能性のあるポリシーのリスト
 */
export function evaluatePoliciesForSignal(
  signalType: SignalType,
  signalValue: number,
): SafetyPolicy[] {
  return SAFETY_POLICIES.filter((policy) => {
    if (!policy.isActive) return false;
    if (policy.criteria.signalType === signalType && signalValue >= (policy.criteria.threshold || 0)) {
      return true;
    }
    return false;
  });
}

/**
 * リスクアセスメント全体に対してポリシーを評価します。
 * @param assessment - リスクアセスメント結果
 * @returns 適用されたポリシーとそれらによって推奨されるアクションのリスト
 */
export function evaluatePoliciesForAssessment(
  assessment: RiskAssessment,
): { policy: SafetyPolicy; action: SafetyPolicy["action"] }[] {
  const applicablePolicies: { policy: SafetyPolicy; action: SafetyPolicy["action"] }[] = [];

  assessment.signals.forEach((signal) => {
    const policies = evaluatePoliciesForSignal(signal.type, signal.value as number);
    policies.forEach((policy) => {
      applicablePolicies.push({ policy, action: policy.action });
    });
  });

  return applicablePolicies;
}

/**
 * 特定のポリシーIDでポリシーを取得します。
 */
export function getPolicyById(policyId: string): SafetyPolicy | undefined {
  return SAFETY_POLICIES.find((p) => p.id === policyId);
}

/**
 * アクティブなすべてのポリシーを取得します。
 */
export function getActivePolicies(): SafetyPolicy[] {
  return SAFETY_POLICIES.filter((p) => p.isActive);
}

/**
 * Evaluates a single policy against a signal value.
 */
export function evaluatePolicy(policyId: string, signalValue: number): boolean {
  const policy = getPolicyById(policyId);
  if (!policy || !policy.isActive) return false;
  return signalValue >= (policy.criteria.threshold ?? 0);
}

