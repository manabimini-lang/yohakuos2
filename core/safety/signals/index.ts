import { ulid } from "ulid";
import type { SafetySignal, UserSignalType, AISignalType, CommunitySignalType, SignalType, SignalSource } from "../types";

// ===================================================
// User Signal Collection Functions
// ===================================================

/**
 * Simulates collecting user usage frequency signal.
 * In a real system, this would interact with usage tracking systems.
 */
export function collectUsageFrequencySignal(userId: string): SafetySignal {
  // Mock implementation
  const value = Math.random(); // Placeholder for actual frequency data
  return {
    id: ulid(),
    userId,
    type: "usage_frequency",
    source: "user",
    value,
    timestamp: new Date(),
    metadata: { description: "ユーザーの利用頻度" },
  };
}

/**
 * Simulates collecting user night activity signal.
 * In a real system, this would track login/activity times.
 */
export function collectNightActivitySignal(userId: string): SafetySignal {
  // Mock implementation
  const isNight = new Date().getHours() < 6 || new Date().getHours() > 22;
  const value = isNight && Math.random() > 0.5 ? 0.8 : 0.2; // Higher risk if active at night
  return {
    id: ulid(),
    userId,
    type: "night_activity",
    source: "user",
    value,
    timestamp: new Date(),
    metadata: { description: "ユーザーの夜間活動" },
  };
}

/**
 * Simulates collecting user session duration signal.
 * In a real system, this would integrate with session management.
 */
export function collectSessionDurationSignal(userId: string): SafetySignal {
  // Mock implementation
  const durationHours = Math.random() * 8; // Max 8 hours for example
  const value = durationHours / 8; // Normalize to 0-1
  return {
    id: ulid(),
    userId,
    type: "session_duration",
    source: "user",
    value,
    timestamp: new Date(),
    metadata: { duration: `${durationHours.toFixed(2)} hours` },
  };
}

/**
 * Simulates collecting user emotional volatility signal.
 * This is highly speculative and would require advanced AI/NLP. Placeholder.
 */
export function collectEmotionalVolatilitySignal(userId: string): SafetySignal {
  // Mock implementation
  const value = Math.random() * 0.5; // Placeholder, usually low unless specific triggers
  return {
    id: ulid(),
    userId,
    type: "emotional_volatility",
    source: "user",
    value,
    timestamp: new Date(),
    metadata: { description: "ユーザーの感情変動" },
  };
}

// ===================================================
// AI Signal Collection Functions
// ===================================================

/**
 * Simulates collecting AI repeated reassurance requests signal.
 * This would involve analyzing AI conversation history.
 */
export function collectRepeatedReassuranceRequestsSignal(aiResponseId: string, userId: string): SafetySignal {
  // Mock implementation
  const value = Math.random() * 0.6; // Placeholder
  return {
    id: ulid(),
    userId,
    type: "repeated_reassurance_requests",
    source: "ai",
    value,
    timestamp: new Date(),
    metadata: { aiResponseId, description: "AIからの繰り返しの安心要求" },
  };
}

/**
 * Simulates collecting unsafe prompt patterns signal.
 * This would involve NLP models checking user prompts.
 */
export function collectUnsafePromptPatternsSignal(aiResponseId: string, userId: string): SafetySignal {
  // Mock implementation
  const value = Math.random(); // Placeholder for pattern detection score
  return {
    id: ulid(),
    userId,
    type: "unsafe_prompt_patterns",
    source: "ai",
    value,
    timestamp: new Date(),
    metadata: { aiResponseId, description: "危険なプロンプトパターン" },
  };
}

/**
 * Simulates collecting AI dependency indicators signal.
 * This involves analyzing AI responses for signs of fostering dependency.
 */
export function collectDependencyIndicatorsSignal(aiResponseId: string, userId: string): SafetySignal {
  // Mock implementation
  const value = Math.random() * 0.7; // Placeholder
  return {
    id: ulid(),
    userId,
    type: "dependency_indicators",
    source: "ai",
    value,
    timestamp: new Date(),
    metadata: { aiResponseId, description: "AI依存度指標" },
  };
}

// ===================================================
// Community Signal Collection Functions
// ===================================================

/**
 * Simulates collecting harassment signal.
 * This would be based on reported content or automated detection in community interactions.
 */
export function collectHarassmentSignal(userId: string, targetEntityId?: string): SafetySignal {
  // Mock implementation
  const value = Math.random() * 0.9; // Higher value for harassment
  return {
    id: ulid(),
    userId,
    type: "harassment",
    source: "community",
    value,
    timestamp: new Date(),
    metadata: { targetEntityId, description: "ハラスメント" },
  };
}

/**
 * Simulates collecting DM abuse signal.
 * Based on reports or detection in direct messages.
 */
export function collectDmAbuseSignal(userId: string, targetEntityId: string): SafetySignal {
  // Mock implementation
  const value = Math.random() * 0.8; // Higher value for DM abuse
  return {
    id: ulid(),
    userId,
    type: "dm_abuse",
    source: "community",
    value,
    timestamp: new Date(),
    metadata: { targetEntityId, description: "DM乱用" },
  };
}

/**
 * Simulates collecting manipulation attempts signal.
 * Detecting patterns of manipulation in user interactions.
 */
export function collectManipulationAttemptsSignal(userId: string, targetEntityId?: string): SafetySignal {
  // Mock implementation
  const value = Math.random() * 0.75; // Placeholder
  return {
    id: ulid(),
    userId,
    type: "manipulation_attempts",
    source: "community",
    value,
    timestamp: new Date(),
    metadata: { targetEntityId, description: "操作の試み" },
  };
}

// ===================================================
// Aggregate Signal Collection
// ===================================================

export async function getSignalsForUser(userId: string): Promise<SafetySignal[]> {
  // In a real system, this would fetch signals from a database or real-time streams.
  // For now, return a mix of mock signals.
  const signals: SafetySignal[] = [
    collectUsageFrequencySignal(userId),
    collectNightActivitySignal(userId),
    collectSessionDurationSignal(userId),
    // collectEmotionalVolatilitySignal(userId), // For now, keep it simple
    collectHarassmentSignal(userId, "some_other_user_id"),
  ];
  return signals;
}

export async function getSignalsForAiResponse(aiResponseId: string, userId: string): Promise<SafetySignal[]> {
    // In a real system, this would fetch signals related to a specific AI response.
    const signals: SafetySignal[] = [
        collectRepeatedReassuranceRequestsSignal(aiResponseId, userId),
        collectUnsafePromptPatternsSignal(aiResponseId, userId),
        collectDependencyIndicatorsSignal(aiResponseId, userId),
    ];
    return signals;
}

export async function getAllSignals(entityType: "user" | "ai_response", entityId: string, userId?: string): Promise<SafetySignal[]> {
    if (entityType === "user") {
        return getSignalsForUser(entityId);
    } else if (entityType === "ai_response" && userId) {
        return getSignalsForAiResponse(entityId, userId);
    }
    return [];
}

// ===================================================
// Signal Registry and Helpers
// ===================================================

export const SIGNAL_REGISTRY: Record<SignalType, { label: string; description: string; category: SignalSource }> = {
  usage_frequency: {
    label: "利用頻度",
    description: "短時間での過剰なリクエストや利用頻度の急増",
    category: "user",
  },
  night_activity: {
    label: "夜間活動",
    description: "深夜帯（22時〜6時）のアクティビティ検出",
    category: "user",
  },
  session_duration: {
    label: "セッション時間",
    description: "長時間の連続セッション利用",
    category: "user",
  },
  emotional_volatility: {
    label: "感情変動",
    description: "テキスト中の極端な感情変動や情緒不安定さ",
    category: "user",
  },
  repeated_reassurance_requests: {
    label: "繰り返しの安心要求",
    description: "AIに対する過度な依存や執拗な確証・安心の要求",
    category: "ai",
  },
  unsafe_prompt_patterns: {
    label: "危険なプロンプト",
    description: "不適切または自己危害等の危険な文脈の検知",
    category: "ai",
  },
  dependency_indicators: {
    label: "依存の指標",
    description: "AIへの擬人化や過度な愛着・依存傾向の指標",
    category: "ai",
  },
  harassment: {
    label: "ハラスメント",
    description: "他者への攻撃的な言動や嫌がらせ行為",
    category: "community",
  },
  dm_abuse: {
    label: "DM乱用",
    description: "ダイレクトメッセージのスパム行為や不適切利用",
    category: "community",
  },
  manipulation_attempts: {
    label: "操作の試み",
    description: "AIモデルや他者の心理的コントロール・操作の試み",
    category: "community",
  },
};

/**
 * Creates a safety signal.
 */
export function createSignal(
  userId: string,
  type: SignalType,
  value: number | string | boolean,
  metadata?: Record<string, any>,
): SafetySignal {
  return {
    id: ulid(),
    userId,
    type,
    source: SIGNAL_REGISTRY[type]?.category ?? "system",
    value,
    timestamp: new Date(),
    metadata,
  };
}

/**
 * Checks if a signal's value indicates high safety concern (significant).
 */
export function isSignalSignificant(signal: SafetySignal): boolean {
  if (typeof signal.value === "number") {
    return signal.value >= 0.5;
  }
  if (typeof signal.value === "boolean") {
    return signal.value === true;
  }
  return false;
}

