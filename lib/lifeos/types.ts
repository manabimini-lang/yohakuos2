// ===================================================
// YOHAKU Life OS Layer — Core Types
// ===================================================
//
// 設計原則:
// - 「人生OS」: 学習アプリでもAIチャットでもない
// - 静かな知的OS: SNSタイムライン禁止、タスク管理化禁止
// - 断定禁止: uncertainty を常に保つ
// - 依存を作らない: AIが必要最低限の存在に
// - 診断禁止: 分析ではなく静かな伴走
//

// ===================================================
// Prisma enum mirrors (used until prisma generate runs)
// ===================================================

export type LifeAreaType = "Health" | "Learning" | "Work" | "Creativity" | "Relationships" | "Mind" | "Rest" | "Challenge";
export type EnergyStateType = "calm_focus" | "exhaustion" | "recovery" | "curiosity" | "instability" | "groundedness";
export type HabitFlowStatus = "active" | "paused" | "completed" | "naturally_ended";
export type LifeReflectionType = "weekly" | "monthly" | "seasonal" | "half_year" | "yearly" | "goal";

// ===================================================
// Life Timeline Entry (統合ビュー)
// ===================================================

export interface LifeTimelineEntry {
    id: string;
    type: TimelineEntryType;
    title: string;
    description: string;
    confidence: number;
    createdAt: Date;
    /** 紐づくLifeArea */
    areaType: LifeAreaType | null;
    /** ソース元のID（Reflection, UserMemory, CompanionMessage etc） */
    sourceId: string;
    /** 感情の兆し（任意） */
    sentiment: string | null;
}

export type TimelineEntryType =
    | "learning"
    | "emotion"
    | "action"
    | "reflection"
    | "road"
    | "meaning"
    | "habit"
    | "conversation"
    | "energy"
    | "direction";

// ===================================================
// Life Area
// ===================================================

export interface LifeAreaSummary {
    type: LifeAreaType;
    title: string;
    description: string | null;
    /** この領域での最近のアクティビティ数（30日） */
    recentActivity: number;
    /** この領域でのエネルギー平均値 */
    averageEnergy: number | null;
    /** 最新の意味シグナル */
    recentSignals: MeaningSignalInfo[];
}

export interface LifeAreaPayload {
    type: LifeAreaType;
    title: string;
    description?: string;
}

// ===================================================
// Meaning Layer
// ===================================================

export type MeaningSignalType =
    | "recurring_theme"
    | "unresolved_question"
    | "value_tension"
    | "long_term_curiosity"
    | "emotional_recurrence";

export interface MeaningSignalInfo {
    id: string;
    signalType: MeaningSignalType;
    description: string;
    confidence: number;
    areaType: LifeAreaType | null;
    relatedMemoryIds: string[];
    createdAt: Date;
}

export interface MeaningAnalysis {
    signals: MeaningSignalInfo[];
    /** 全体サマリー（AI生成） */
    summary: string;
    /** 注目すべきパターン */
    patterns: string[];
    /** 静かな問い */
    quietQuestions: string[];
    confidence: number;
}

// ===================================================
// Habit Flow
// ===================================================

export interface HabitFlowInfo {
    id: string;
    title: string;
    category: string | null;
    status: HabitFlowStatus;
    intensity: number; // 1-5
    areaType: LifeAreaType | null;
    startedAt: Date;
    endedAt: Date | null;
    /** 継続日数 */
    durationDays: number;
}

export interface HabitFlowTrend {
    /** 継続中の習慣 */
    active: HabitFlowInfo[];
    /** 中断中の習慣 */
    paused: HabitFlowInfo[];
    /** 自然消滅した習慣 */
    naturallyEnded: HabitFlowInfo[];
    /** 今週の変化 */
    weeklyChanges: string[];
}

// ===================================================
// Energy Tracking
// ===================================================

export interface EnergyStateInfo {
    id: string;
    state: EnergyStateType;
    intensity: number; // 1-10
    areaType: LifeAreaType | null;
    note: string | null;
    createdAt: Date;
}

export interface EnergyTrend {
    /** 直近のエネルギー状態リスト */
    recentStates: EnergyStateInfo[];
    /** 平均強度 */
    averageIntensity: number;
    /** 支配的な状態タイプ */
    dominantState: EnergyStateType | null;
    /** 変化の兆し */
    shiftIndication: string | null;
    /** データの確度 */
    confidence: number;
}

// ===================================================
// Seasonal / Goal Reflection
// ===================================================

export interface SeasonalReflectionData {
    period: string; // "spring_2026" etc
    season: string;
    year: number;
    summary: string;
    themes: string[];
    /** この季節の特徴 */
    characteristics: string[];
    /** 次の季節への静かな問い */
    quietQuestions: string[];
    confidence: number;
    startDate: Date;
    endDate: Date;
}

export interface GoalReflectionData {
    /** 今の方向性 */
    direction: string;
    /** 意図・大切にしたいこと */
    intention: string;
    /** 価値観 */
    values: string[];
    /** 静かな願い */
    quietWish: string | null;
    /** 最近の行動と方向性の一致度（0-1） */
    alignment: number;
    confidence: number;
}

// ===================================================
// Life Balance
// ===================================================

export interface LifeBalanceAnalysis {
    analysis: string;
    signals: LifeBalanceSignal[];
    /** 過学習傾向 */
    learningOverload: number | null; // 0-1, null=insufficient data
    /** 感情停滞 */
    emotionalStagnation: number | null;
    /** 疲弊傾向 */
    exhaustionTendency: number | null;
    /** 不均衡度（総合, 0-1） */
    imbalanceScore: number | null;
    confidence: number;
    /** 静かな提案 */
    gentleSuggestions: string[];
}

export interface LifeBalanceSignal {
    type: "learning_overload" | "emotional_stagnation" | "exhaustion" | "imbalance" | "recovery";
    description: string;
    intensity: number; // 0-1
}

// ===================================================
// Quiet Planning
// ===================================================

export interface QuietPlanInfo {
    id: string;
    intention: string;
    nextStep: string | null;
    note: string | null;
    isOptional: boolean;
    isCompleted: boolean;
    createdAt: Date;
    completedAt: Date | null;
}

export interface QuietPlanningSuggestion {
    /** 小さな次の一歩 */
    smallNextSteps: string[];
    /** 静かな意図 */
    quietIntentions: string[];
    /** 任意の内省 */
    optionalReflections: string[];
}

// ===================================================
// Direction Reflection
// ===================================================

export interface DirectionReflectionInfo {
    id: string;
    direction: string;
    intention: string;
    values: string[];
    quietWish: string | null;
    period: string; // "current" | "past" | "emerging"
    confidence: number;
    createdAt: Date;
}

export interface DirectionShift {
    /** 以前の方向 */
    from: string;
    /** 現在の方向 */
    to: string;
    /** 変化の意味 */
    meaning: string;
    /** データ確度 */
    confidence: number;
}

// ===================================================
// Context Compression
// ===================================================

export interface CompressedContext {
    /** ローリングサマリー（直近の出来事） */
    rollingSummary: string;
    /** テーマ別圧縮 */
    thematicCompression: string;
    /** 感情的抽象化 */
    emotionalAbstraction: string;
    /** 意味圧縮 */
    meaningCompression: string;
    /** 季節サマリー */
    seasonalSummarization: string | null;
    /** 推定トークン数 */
    estimatedTokens: number;
}

// ===================================================
// Companion Boundary Rules
// ===================================================

export interface BoundaryDecision {
    shouldRespond: boolean;
    shouldStaySilent: boolean;
    shouldDefer: boolean;
    reason: string | null;
    /** 推奨される沈黙時間（分） */
    suggestedSilenceMinutes?: number;
    /** 代替案（defer時のリダイレクト先） */
    deferTarget?: string;
}

// ===================================================
// Emotional Cooldown
// ===================================================

export type CooldownType = "emotional_overload" | "anxiety_repetition" | "reflection_cooldown";

export interface EmotionalCooldownInfo {
    id: string;
    cooldownType: CooldownType;
    intensity: number; // 1-10
    expiresAt: Date;
    createdAt: Date;
    isActive: boolean;
}

// ===================================================
// Conversation Compression Types
// ===================================================

export type SummaryType = "rolling" | "thematic" | "abstract" | "meaning";

export interface ConversationSummaryInfo {
    id: string;
    conversationId: string;
    summaryType: SummaryType;
    content: string;
    tokenCount: number;
    createdAt: Date;
}

export interface ConversationThemeInfo {
    id: string;
    conversationId: string;
    theme: string;
    confidence: number;
    createdAt: Date;
}

export interface ConversationInsightInfo {
    id: string;
    conversationId: string;
    insight: string;
    confidence: number;
    createdAt: Date;
}

// ===================================================
// Life Timeline Query
// ===================================================

export interface LifeTimelineQuery {
    userId: string;
    /** 取得するエントリータイプ（空=全タイプ） */
    types?: TimelineEntryType[];
    /** LifeAreaで絞り込み */
    areaType?: LifeAreaType;
    /** 日付範囲 */
    fromDate?: Date;
    toDate?: Date;
    /** 最大件数 */
    limit?: number;
    /** カーソル（ページネーション） */
    cursor?: string;
}

// ===================================================
// Seasonal Period
// ===================================================

export interface SeasonalPeriod {
    season: "spring" | "summer" | "autumn" | "winter";
    year: number;
    period: string; // "spring_2026"
    startDate: Date;
    endDate: Date;
}

export function getCurrentSeasonalPeriod(): SeasonalPeriod {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    let season: SeasonalPeriod["season"];
    if (month >= 3 && month <= 5) season = "spring";
    else if (month >= 6 && month <= 8) season = "summer";
    else if (month >= 9 && month <= 11) season = "autumn";
    else season = "winter";

    const startDate = new Date(year, (month - 1) - ((month - 1) % 3), 1);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3);

    return {
        season,
        year,
        period: `${season}_${year}`,
        startDate,
        endDate,
    };
}

export function getPreviousSeasonalPeriod(current: SeasonalPeriod): SeasonalPeriod {
    const seasonOrder: SeasonalPeriod["season"][] = ["spring", "summer", "autumn", "winter"];
    const idx = seasonOrder.indexOf(current.season);
    let prevSeason: SeasonalPeriod["season"];
    let prevYear = current.year;

    if (idx === 0) {
        prevSeason = "winter";
        prevYear -= 1;
    } else {
        prevSeason = seasonOrder[idx - 1];
    }

    const startMonth = { spring: 3, summer: 6, autumn: 9, winter: 12 }[prevSeason] - 1;
    const startDate = new Date(prevYear, startMonth, 1);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3);

    return {
        season: prevSeason,
        year: prevYear,
        period: `${prevSeason}_${prevYear}`,
        startDate,
        endDate,
    };
}