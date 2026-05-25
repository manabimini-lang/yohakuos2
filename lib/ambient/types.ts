// ===================================================
// YOHAKU Ambient Intelligence Layer — Core Types
// ===================================================
//
// 設計思想:
// - 「必要な時だけ静かに現れるAI」
// - 通知ではなく「そっと浮かび上がる」
// - 常に喋らない、常に提案しない、常に最適化しない
//

export type AmbientInsightType =
    | "seasonal_echo"
    | "memory_resonance"
    | "reflection_bridge"
    | "theme_recurrence"
    | "quiet_discovery";

export type ResonancePatternType =
    | "seasonal_recurrence"
    | "emotional_cycle"
    | "behavioral_loop"
    | "thematic_return"
    | "value_consistency";

export type SlowFeedEntryType =
    | "insight"
    | "resonance"
    | "reflection"
    | "seasonal_echo"
    | "quiet_connection";

export interface AmbientInsightInfo {
    id: string;
    type: AmbientInsightType;
    title: string;
    content: string;
    sourceMemoryIds: string[];
    confidence: number;
    surfacedAt: Date;
    dismissedAt: Date | null;
    createdAt: Date;
}

export interface ResonancePatternInfo {
    id: string;
    patternType: ResonancePatternType;
    description: string;
    confidence: number;
    sourceMemoryIds: string[];
    evidenceIds: string[];
    firstObservedAt: Date;
    observedCount: number;
    lastObservedAt: Date;
    createdAt: Date;
}

export interface SlowFeedEntryInfo {
    id: string;
    entryType: SlowFeedEntryType;
    title: string;
    content: string;
    sourceType: string | null;
    sourceId: string | null;
    isRead: boolean;
    isSaved: boolean;
    confidence: number;
    priority: number;
    surfacedAt: Date;
    readAt: Date | null;
    createdAt: Date;
}

// ===================================================
// Presence Decision
// ===================================================

export interface PresenceDecision {
    shouldSurface: boolean;
    reason: string | null;
    suggestedType: AmbientInsightType | null;
    /** 次回出現可能時刻（クールダウン） */
    nextAvailableAt: Date | null;
}

export interface FrequencyConfig {
    /** 最低インターバル（時間） */
    minIntervalHours: number;
    /** 1日あたりの最大出現数 */
    maxPerDay: number;
    /** 低確度で抑制する閾値 */
    lowConfidenceThreshold: number;
    /** 同じタイプの再出現抑制（時間） */
    typeCooldownHours: number;
}

export const DEFAULT_FREQUENCY_CONFIG: FrequencyConfig = {
    minIntervalHours: 4,
    maxPerDay: 3,
    lowConfidenceThreshold: 0.25,
    typeCooldownHours: 24,
};

// ===================================================
// Contextual Surface
// ===================================================

export interface SurfaceContext {
    currentTheme: string | null;
    currentEmotion: string | null;
    activeRoad: string | null;
    currentSeason: string | null;
    recentReflections: number;
    recentEnergies: string[];
    lastInsightAt: Date | null;
}

// ===================================================
// Calm Recommendation
// ===================================================

export interface CalmRecommendation {
    type: "connection" | "space" | "question" | "reflection" | "echo";
    title: string;
    content: string;
    sourceId: string | null;
    sourceType: string | null;
    confidence: number;
}

export interface AmbientAnalysis {
    insights: AmbientInsightInfo[];
    resonances: ResonancePatternInfo[];
    recommendations: CalmRecommendation[];
    hasNewContent: boolean;
    lastUpdated: Date;
}