// ===================================================
// YOHAKU Calm Infrastructure — Core Types
// ===================================================
//
// 長期運用・低刺激・高信頼を支える基盤設定。
//

export interface CalmConfig {
    /** AIコストガバナンス */
    costGovernance: CostGovernanceConfig;
    /** コンテキストライフサイクル */
    contextLifecycle: ContextLifecycleConfig;
    /** キューインフラ */
    queueInfrastructure: QueueInfrastructureConfig;
    /** 頻度ガバナンス */
    frequencyGovernance: FrequencyGovernanceConfig;
}

// ===================================================
// AI Cost Governance
// ===================================================

export interface CostGovernanceConfig {
    /** 月間予算（USD） */
    monthlyBudgetUSD: number;
    /** 1日あたりの予算（USD） */
    dailyBudgetUSD: number;
    /** 1ユーザーあたりの月間最大コスト */
    maxCostPerUserPerMonth: number;
    /** 低優先度ジョブの抑制割合（0-1） */
    lowPrioritySuppressionRatio: number;
    /** トークン節約モード有効化 */
    tokenSaverMode: boolean;
}

export const DEFAULT_COST_CONFIG: CostGovernanceConfig = {
    monthlyBudgetUSD: 5.0,
    dailyBudgetUSD: 5.0 / 30,
    maxCostPerUserPerMonth: 0.05,
    lowPrioritySuppressionRatio: 0.5,
    tokenSaverMode: false,
};

export interface CostReport {
    daily: { used: number; budget: number; remaining: number };
    monthly: { used: number; budget: number; remaining: number };
    byJobType: Record<string, number>;
    topCostJobs: Array<{ jobType: string; cost: number }>;
    withinBudget: boolean;
}

// ===================================================
// Context Lifecycle
// ===================================================

export interface ContextLifecycleConfig {
    /** メモリの最大保存期間（日） */
    maxMemoryAgeDays: number;
    /** 低確度メモリの圧縮間隔（日） */
    lowConfidenceCompressionInterval: number;
    /** 長期サマリー保持数 */
    maxLongTermSummaries: number;
    /** 自動アーカイブ日数 */
    autoArchiveDays: number;
}

export const DEFAULT_CONTEXT_LIFECYCLE: ContextLifecycleConfig = {
    maxMemoryAgeDays: 365,
    lowConfidenceCompressionInterval: 30,
    maxLongTermSummaries: 12,
    autoArchiveDays: 90,
};

export interface ContextHealthReport {
    totalMemories: number;
    lowConfidenceMemories: number;
    staleMemories: number;
    compressionCandidates: number;
    estimatedTokens: number;
}

// ===================================================
// Queue Infrastructure
// ===================================================

export interface QueueInfrastructureConfig {
    /** バッチサイズ */
    batchSize: number;
    /** 最大リトライ回数 */
    maxRetries: number;
    /** 低優先度ジョブの実行間隔（分） */
    lowPriorityIntervalMinutes: number;
    /** 高優先度ジョブの同時実行数 */
    highPriorityConcurrency: number;
    /** ジョブタイムアウト（秒） */
    jobTimeoutSeconds: number;
}

export const DEFAULT_QUEUE_CONFIG: QueueInfrastructureConfig = {
    batchSize: 5,
    maxRetries: 3,
    lowPriorityIntervalMinutes: 60,
    highPriorityConcurrency: 2,
    jobTimeoutSeconds: 120,
};

// ===================================================
// Frequency Governance
// ===================================================

export interface FrequencyGovernanceConfig {
    /** 静音モード */
    quietMode: boolean;
    /** 感情クールダウン連携 */
    emotionalCooldownEnabled: boolean;
    /** 過負荷防止 */
    overloadPrevention: boolean;
    /** 沈黙ウィンドウ（時間） */
    silenceWindows: Array<{ start: number; end: number }>;
    /** 1日あたりの最大AI出現数 */
    maxDailyAppearances: number;
}

export const DEFAULT_FREQUENCY_GOVERNANCE: FrequencyGovernanceConfig = {
    quietMode: false,
    emotionalCooldownEnabled: true,
    overloadPrevention: true,
    silenceWindows: [{ start: 22, end: 6 }], // 22:00-06:00 は沈黙
    maxDailyAppearances: 3,
};

// ===================================================
// Job Priority System
// ===================================================

export enum JobPriority {
    CRITICAL = 100,
    HIGH = 50,
    MEDIUM = 20,
    LOW = 10,
    BACKGROUND = 0,
}

export const JOB_PRIORITY_MAP: Record<string, JobPriority> = {
    // Companion Layer
    weekly_reflection: JobPriority.MEDIUM,
    conversation_summary: JobPriority.LOW,
    memory_compression: JobPriority.BACKGROUND,

    // Life OS Layer
    seasonal_reflection: JobPriority.LOW,
    life_balance_analysis: JobPriority.LOW,
    meaning_extraction: JobPriority.MEDIUM,
    conversation_compression: JobPriority.BACKGROUND,
    emotional_cooldown_update: JobPriority.HIGH,

    // Ambient Layer
    ambient_reflection: JobPriority.LOW,
    resonance_detection: JobPriority.BACKGROUND,
    slow_feed_cleanup: JobPriority.BACKGROUND,
};

// ===================================================
// Reflection Safety
// ===================================================

export interface ReflectionSafetyCheck {
    isSafe: boolean;
    violations: SafetyViolation[];
    sanitizedContent: string | null;
    confidence: number;
}

export interface SafetyViolation {
    type: "diagnosis" | "determination" | "pressure" | "dependency" | "fear" | "over_optimization";
    description: string;
    severity: "low" | "medium" | "high";
}

export const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; type: SafetyViolation["type"]; severity: SafetyViolation["severity"] }> = [
    // 精神診断風
    { pattern: /(障害|症候群|疾患|病).*(傾向|可能性)/, type: "diagnosis", severity: "high" },
    { pattern: /(アダルトチルドレン|HSP|ADHD|ASD|うつ病|PTSD|トラウマ)/, type: "diagnosis", severity: "high" },

    // 人格断定
    { pattern: /あなた(は|の).*(タイプ|性格|傾向).*(です|だ|ですね)/, type: "determination", severity: "high" },
    { pattern: /(間違いなく|絶対に|必ず|確実に|100%|完全に)/, type: "determination", severity: "medium" },

    // 過剰プレッシャー
    { pattern: /(すべき|した方がいい|しないと|するべき|やるべき)/, type: "pressure", severity: "medium" },
    { pattern: /(今すぐ|急がないと|遅れる前に)/, type: "pressure", severity: "high" },

    // 依存誘導
    { pattern: /(毎日|必ず).*(報告|連絡|相談)(して|ください)/, type: "dependency", severity: "high" },
    { pattern: /私に(任せて|頼って|相談して)/, type: "dependency", severity: "high" },

    // 恐怖誘導
    { pattern: /(このままだと|気づかないと|放置すると).*(危険|大変|後悔|取り返し)/, type: "fear", severity: "high" },

    // 過剰最適化
    { pattern: /(生産性|効率|最適化).*(上げる|高める|改善).*(べき|なさい)/, type: "over_optimization", severity: "medium" },
];

export const UNCERTAINTY_PREFIXES = [
    "感じるのですが、",
    "もしかすると、",
    "一つの見方として、",
    "ご自身の感覚が最も大切ですが、",
    "よかったら考えてみてください。",
    "少し違う角度から見ると、",
    "データからは〜のように見えますが、",
    "あくまで参考ですが、",
];