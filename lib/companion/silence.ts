// ===================================================
// YOHAKU Companion — AI Silence Rules
// ===================================================
//
// YOHAKU Companion は「喋りすぎない」。
// AIが「今は何も言わない」を選択可能にする。
//
// ルール:
// - silence thresholds
// - low-confidence silence
// - over-guidance prevention
// - repetitive advice suppression
//

import { prisma } from "@/lib/prisma";
import {
    SilenceDecision,
    SilenceThresholds,
    DEFAULT_SILENCE_THRESHOLDS,
    CompanionContext,
} from "./types";

/**
 * Evaluate whether the companion should speak or remain silent.
 * Returns a SilenceDecision with rationale.
 */
export async function evaluateSilence(
    userId: string,
    conversationId: string,
    context: CompanionContext,
    userMessage: string,
    thresholds: SilenceThresholds = DEFAULT_SILENCE_THRESHOLDS
): Promise<SilenceDecision> {
    // 1. Check time since last message
    const timeDecision = await checkTimeInterval(userId, conversationId, thresholds);
    if (!timeDecision.shouldSpeak) return timeDecision;

    // 2. Check context confidence
    const confidenceDecision = checkContextConfidence(context, thresholds);
    if (!confidenceDecision.shouldSpeak) return confidenceDecision;

    // 3. Check consecutive assistant messages
    const consecutiveDecision = await checkConsecutiveMessages(
        conversationId,
        thresholds
    );
    if (!consecutiveDecision.shouldSpeak) return consecutiveDecision;

    // 4. Check repetition suppression
    const repetitionDecision = await checkRepetition(
        conversationId,
        userMessage,
        context,
        thresholds
    );
    if (!repetitionDecision.shouldSpeak) return repetitionDecision;

    // 5. Check over-guidance prevention
    const guidanceDecision = checkOverGuidance(context);
    if (!guidanceDecision.shouldSpeak) return guidanceDecision;

    // 6. Check if user message is purely social/non-reflective
    const socialSilenceDecision = checkSocialPattern(userMessage);
    if (!socialSilenceDecision.shouldSpeak) return socialSilenceDecision;

    return {
        shouldSpeak: true,
        reason: null,
    };
}

/**
 * 1. Time interval check: prevent too-frequent engagement
 */
async function checkTimeInterval(
    userId: string,
    conversationId: string,
    thresholds: SilenceThresholds
): Promise<SilenceDecision> {
    const lastMessage = await prisma.companionMessage.findFirst({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
    });

    if (!lastMessage) {
        return { shouldSpeak: true, reason: null };
    }

    const hoursSinceLastMessage =
        (Date.now() - lastMessage.createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastMessage < thresholds.minIntervalHours) {
        return {
            shouldSpeak: false,
            reason: `前回の会話から${Math.round(hoursSinceLastMessage * 10) / 10}時間。最小間隔${thresholds.minIntervalHours}時間未満のため沈黙。`,
            silenceDurationHours: thresholds.minIntervalHours - hoursSinceLastMessage,
            alternativeQuietQuestion: undefined, // Too soon for any response
        };
    }

    return { shouldSpeak: true, reason: null };
}

/**
 * 2. Context confidence check
 */
function checkContextConfidence(
    context: CompanionContext,
    thresholds: SilenceThresholds
): SilenceDecision {
    // If all context signals are low confidence, consider silence
    const avgThemeConfidence =
        context.currentThemes.length > 0
            ? context.currentThemes.reduce((sum, t) => sum + t.confidence, 0) /
            context.currentThemes.length
            : 0;

    const avgMemoryConfidence =
        context.relevantMemories.length > 0
            ? context.relevantMemories.reduce((sum, m) => sum + m.confidence, 0) /
            context.relevantMemories.length
            : 0;

    const overallConfidence = (avgThemeConfidence + avgMemoryConfidence) / 2;

    if (overallConfidence < thresholds.lowConfidenceThreshold) {
        return {
            shouldSpeak: false,
            reason: `コンテキスト確度不足 (${Math.round(overallConfidence * 100)}%)。低確度のため沈黙。`,
            alternativeQuietQuestion:
                "何か最近気になっていることはありますか？",
        };
    }

    return { shouldSpeak: true, reason: null };
}

/**
 * 3. Consecutive assistant message check
 */
async function checkConsecutiveMessages(
    conversationId: string,
    thresholds: SilenceThresholds
): Promise<SilenceDecision> {
    const recentMessages = await prisma.companionMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: thresholds.maxConsecutiveAssistant + 1,
        select: { role: true },
    });

    let consecutiveCount = 0;
    for (const msg of recentMessages) {
        if (msg.role === "assistant") {
            consecutiveCount++;
        } else {
            break;
        }
    }

    if (consecutiveCount >= thresholds.maxConsecutiveAssistant) {
        return {
            shouldSpeak: false,
            reason: `連続アシスタント発言${consecutiveCount}回。過剰ガイダンス防止のため沈黙。`,
            alternativeQuietQuestion:
                "少し間を置いてみるのも良いかもしれません。何か考えていることはありますか？",
        };
    }

    return { shouldSpeak: true, reason: null };
}

/**
 * 4. Repetition suppression check
 */
async function checkRepetition(
    conversationId: string,
    userMessage: string,
    context: CompanionContext,
    thresholds: SilenceThresholds
): Promise<SilenceDecision> {
    // Extract themes from user message
    const messageThemes = extractThemesFromMessage(
        userMessage,
        context.currentThemes.map((t) => t.title)
    );

    if (messageThemes.length === 0) {
        return { shouldSpeak: true, reason: null };
    }

    // Check if these themes were recently discussed
    const recentMessages = await prisma.companionMessage.findMany({
        where: { conversationId, role: "assistant" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { content: true, createdAt: true },
    });

    for (const theme of messageThemes) {
        for (const msg of recentMessages) {
            if (msg.content.includes(theme)) {
                const hoursAgo =
                    (Date.now() - msg.createdAt.getTime()) / (1000 * 60 * 60);
                if (hoursAgo < thresholds.repetitionSuppressionWindow) {
                    return {
                        shouldSpeak: false,
                        reason: `テーマ「${theme}」は${Math.round(hoursAgo)}時間前に扱った。重複抑制のため沈黙。`,
                        alternativeQuietQuestion:
                            "前回とは少し違う視点で見ると、何か新しい発見はありますか？",
                    };
                }
            }
        }
    }

    return { shouldSpeak: true, reason: null };
}

/**
 * 5. Over-guidance prevention: if context is very sparse or user is venting
 */
function checkOverGuidance(context: CompanionContext): SilenceDecision {
    // If there are no themes, no emotional trend, and few memories - stay silent
    if (
        context.currentThemes.length === 0 &&
        !context.emotionalTrend &&
        context.relevantMemories.length < 2
    ) {
        return {
            shouldSpeak: true, // Allow basic response
            reason: null,
        };
    }

    return { shouldSpeak: true, reason: null };
}

/**
 * 6. Social/non-reflective pattern check
 */
function checkSocialPattern(userMessage: string): SilenceDecision {
    const socialGreetings = [
        "おはよう",
        "こんにちは",
        "こんばんは",
        "やあ",
        "ただいま",
        "おやすみ",
        "お疲れ",
    ];

    const trimmed = userMessage.trim().toLowerCase();
    const isBareGreeting = socialGreetings.some(
        (g) => trimmed === g || trimmed === g + "。"
    );

    if (isBareGreeting) {
        return {
            shouldSpeak: false,
            reason: "社交的な挨拶のみ。沈黙を維持。",
            alternativeQuietQuestion:
                "今日はどんな日でしたか？よかったら教えてください。",
        };
    }

    return { shouldSpeak: true, reason: null };
}

/**
 * Utility: extract themes from user message
 */
function extractThemesFromMessage(
    message: string,
    knownThemes: string[]
): string[] {
    const found: string[] = [];
    for (const theme of knownThemes) {
        // Check if key parts of the theme appear in the message
        const keywords = theme.split(/[\s,、。．]+/).filter((k) => k.length > 1);
        const matchCount = keywords.filter((k) => message.includes(k)).length;
        if (matchCount >= Math.ceil(keywords.length / 2)) {
            found.push(theme);
        }
    }
    return found;
}