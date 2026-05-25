// ===================================================
// YOHAKU AI Companion Layer — Core Types
// ===================================================
// 設計原則:
// - 静かな伴走者: 常に会話を強制しない
// - 人生文脈を理解: ただし全Memory投入禁止
// - 断定禁止: uncertainty を常に保つ
// - 依存を作らない: AIが必要最低限の存在に

export interface CompanionContext {
    /** 現在アクティブなテーマ */
    currentThemes: ThemeInfo[];
    /** 感情トレンド（直近の傾向） */
    emotionalTrend: EmotionalTrend | null;
    /** 最近の内省 */
    recentReflections: ReflectionInfo[];
    /** アクティブなRoad */
    activeRoad: RoadInfo | null;
    /** 関連性の高い記憶 */
    relevantMemories: MemorySnippet[];
    /** 継続中の問い / 未解決テーマ */
    ongoingQuestions: string[];
    /** コンテキスト生成時刻 */
    generatedAt: string;
    /** コンテキストの確度下限 */
    confidenceFloor: number;
    /** トークン使用量見積もり */
    estimatedTokens: number;
}

export interface ThemeInfo {
    title: string;
    confidence: number;
    /** このテーマの継続期間（日） */
    durationDays: number;
    /** 関連Memoryタイプ */
    sources: string[];
}

export interface EmotionalTrend {
    /** 直近の感情パターン要約 */
    summary: string;
    /** 変化の方向性: 'stable' | 'positive_shift' | 'negative_shift' | 'fluctuating' */
    direction: string;
    confidence: number;
}

export interface ReflectionInfo {
    id: string;
    title: string;
    content: string;
    sentiment: string | null;
    createdAt: Date;
}

export interface RoadInfo {
    id: string;
    slug: string;
    title: string;
    description: string;
    icon: string;
}

export interface MemorySnippet {
    id: string;
    type: string;
    title: string;
    content: string;
    confidence: number;
    /** 関連性スコア（0-1） */
    relevance: number;
    createdAt: Date;
}

// ===================================================
// Context Budget System
// ===================================================

export interface ContextBudget {
    /** 全体のトークン上限（Gemini 3.1 Pro Low 想定: ~128K） */
    totalLimit: number;
    /** システムプロンプト */
    systemPrompt: number;
    /** ユーザーコンテキスト */
    userContext: number;
    /** 会話履歴 */
    conversationHistory: number;
    /** 返信用 */
    response: number;
    /** バッファ */
    buffer: number;
}

export const DEFAULT_BUDGET: ContextBudget = {
    totalLimit: 128_000,
    systemPrompt: 2_000,
    userContext: 8_000,
    conversationHistory: 16_000,
    response: 4_000,
    buffer: 2_000,
};

// ===================================================
// Silence Rules
// ===================================================

export interface SilenceDecision {
    shouldSpeak: boolean;
    reason: string | null;
    /** 沈黙する場合の推奨時間（時間単位） */
    silenceDurationHours?: number;
    /** 代替案: 静かな問いがあれば */
    alternativeQuietQuestion?: string;
}

export interface SilenceThresholds {
    /** 会話の最小間隔（時間） */
    minIntervalHours: number;
    /** 低確度で沈黙する閾値 */
    lowConfidenceThreshold: number;
    /** 過剰ガイダンス抑制（連続アシスタント発言数上限） */
    maxConsecutiveAssistant: number;
    /** 繰り返しアドバイス抑制 */
    repetitionSuppressionWindow: number; // 同じテーマを扱う最低間隔（時間）
}

export const DEFAULT_SILENCE_THRESHOLDS: SilenceThresholds = {
    minIntervalHours: 2,
    lowConfidenceThreshold: 0.4,
    maxConsecutiveAssistant: 2,
    repetitionSuppressionWindow: 48,
};

// ===================================================
// Conversation State
// ===================================================

export interface CompanionSessionState {
    conversationId: string;
    userId: string;
    title: string;
    contextVersion: number;
    /** 連続するアシスタント発言数 */
    consecutiveAssistantMessages: number;
    /** 最近扱ったテーマ（repetition suppression用） */
    recentThemes: Array<{ theme: string; timestamp: number }>;
    /** 最終会話時刻 */
    lastMessageAt: Date | null;
    /** このセッションで利用したトークン総数 */
    totalTokensUsed: number;
}

// ===================================================
// Response Types
// ===================================================

export interface CompanionResponse {
    content: string;
    /** AIが沈黙を選んだ場合 true */
    isSilent: boolean;
    /** 代わりの静かな問い（沈黙時の代替） */
    quietQuestion?: string;
    tokenUsed: number;
    memorySnapshot: Record<string, unknown> | null;
}

// ===================================================
// Weekly Reflection Types
// ===================================================

export interface WeeklyReflectionData {
    /** 期間 */
    period: { start: Date; end: Date };
    /** 学びのサマリー */
    learningsSummary: string;
    /** 感情の変化 */
    emotionalShift: string;
    /** 継続しているパターン */
    continuations: string[];
    /** 変化・気づき */
    changes: string[];
    /** 静かな問い */
    gentleQuestions: string[];
    /** 生成確度 */
    confidence: number;
}