// ===================================================
// YOHAKU Companion — Core Engine
// ===================================================
//
// AI Companion Conversation Layer の中心エンジン。
// 以下の統合:
// - Memory Retrieval Engine
// - Context Budget System
// - AI Silence Rules
// - Reflection-aware Chat
// - Quiet Guidance Engine
// - Ethical Safety Layer
//

import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gemini";
import { buildCompanionContext, buildCompanionContextForPrompt } from "./retrieval";
import { evaluateSilence } from "./silence";
import { COMPANION_SYSTEM_PROMPT, PROMPT_VERSION } from "./prompts/system";
import { validateCompanionResponse } from "./ethics";
import {
    CompanionResponse,
    CompanionSessionState,
    SilenceDecision,
    CompanionContext,
} from "./types";
import { estimateTokenCount } from "@/lib/memory/cost";

// ===================================================
// Session Management
// ===================================================

export async function getOrCreateConversation(
    userId: string,
    title: string = ""
): Promise<{ id: string; isNew: boolean }> {
    // Find latest conversation for this user
    const existing = await prisma.companionConversation.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
    });

    if (existing) {
        return { id: existing.id, isNew: false };
    }

    // Create new if none exists
    const created = await prisma.companionConversation.create({
        data: { userId, title },
    });

    return { id: created.id, isNew: true };
}

export async function getSessionState(
    conversationId: string
): Promise<CompanionSessionState> {
    const conversation = await prisma.companionConversation.findUnique({
        where: { id: conversationId },
        include: {
            messages: {
                orderBy: { createdAt: "desc" },
                take: 10,
                select: { role: true, content: true, tokenCount: true, createdAt: true },
            },
        },
    });

    if (!conversation) {
        throw new Error(`Conversation not found: ${conversationId}`);
    }

    // Count consecutive assistant messages
    let consecutiveAssistantMessages = 0;
    for (const msg of conversation.messages) {
        if (msg.role === "assistant") {
            consecutiveAssistantMessages++;
        } else {
            break;
        }
    }

    // Calculate total tokens used
    const totalTokensUsed = conversation.messages.reduce(
        (sum, msg) => sum + msg.tokenCount,
        0
    );

    // Extract recent themes from messages (simplified)
    const recentThemes = extractThemesFromMessages(
        conversation.messages.map((m) => m.content)
    );

    return {
        conversationId,
        userId: conversation.userId,
        title: conversation.title,
        contextVersion: conversation.contextVersion,
        consecutiveAssistantMessages,
        recentThemes,
        lastMessageAt: conversation.messages[0]?.createdAt || null,
        totalTokensUsed,
    };
}

function extractThemesFromMessages(
    messages: string[]
): Array<{ theme: string; timestamp: number }> {
    // Simple heuristic: extract noun phrases from last few messages
    const now = Date.now();
    const themes: Array<{ theme: string; timestamp: number }> = [];

    // Known theme indicators (TODO: make this more sophisticated)
    const themeIndicators = [
        "仕事",
        "勉強",
        "人間関係",
        "健康",
        "趣味",
        "家族",
        "将来",
        "不安",
        "成長",
        "変化",
        "習慣",
    ];

    for (const msg of messages.slice(0, 5)) {
        for (const indicator of themeIndicators) {
            if (msg.includes(indicator)) {
                themes.push({ theme: indicator, timestamp: now });
            }
        }
    }

    return themes;
}

// ===================================================
// Message History Builder (Context Budget 적용)
// ===================================================

async function buildConversationHistory(
    conversationId: string,
    budget: number
): Promise<Array<{ role: string; content: string }>> {
    const messages = await prisma.companionMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true, tokenCount: true },
    });

    const history: Array<{ role: string; content: string }> = [];
    let totalTokens = 0;

    // Take messages from the end (most recent) working backwards
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        const tokenCount = msg.tokenCount || estimateTokenCount(msg.content);

        if (totalTokens + tokenCount > budget) break;

        history.unshift({ role: msg.role, content: msg.content });
        totalTokens += tokenCount;
    }

    return history;
}

// ===================================================
// Core: Generate Companion Response
// ===================================================

export async function generateCompanionResponse(
    userId: string,
    conversationId: string,
    userMessage: string
): Promise<CompanionResponse> {
    // 1. Save user message
    const userTokenCount = estimateTokenCount(userMessage);
    await prisma.companionMessage.create({
        data: {
            conversationId,
            role: "user",
            content: userMessage,
            tokenCount: userTokenCount,
        },
    });

    // 2. Build companion context (memory retrieval)
    const context = await buildCompanionContext(userId, conversationId);

    // 3. Evaluate silence rules
    const silenceDecision = await evaluateSilence(
        userId,
        conversationId,
        context,
        userMessage
    );

    // 4. Save memory snapshot
    const memorySnapshot: Record<string, unknown> = {
        themes: context.currentThemes.length,
        emotionalTrend: context.emotionalTrend?.direction || null,
        reflectionCount: context.recentReflections.length,
        memoryCount: context.relevantMemories.length,
        silenceApplied: !silenceDecision.shouldSpeak,
        silenceReason: silenceDecision.reason,
    };

    // 5. Handle silence decision
    if (!silenceDecision.shouldSpeak) {
        // Save silence message (as system message)
        await prisma.companionMessage.create({
            data: {
                conversationId,
                role: "system",
                content: JSON.stringify({
                    type: "silence",
                    reason: silenceDecision.reason,
                }),
                tokenCount: 10,
                memorySnapshot: memorySnapshot as any,
            },
        });

        // Update conversation
        await prisma.companionConversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date(), contextVersion: { increment: 1 } },
        });

        return {
            content: "",
            isSilent: true,
            quietQuestion: silenceDecision.alternativeQuietQuestion || undefined,
            tokenUsed: 0,
            memorySnapshot,
        };
    }

    // 6. Build context string for prompt
    const contextString = buildCompanionContextForPrompt(context);

    // 7. Build conversation history (with budget)
    const historyBudget = 16_000; // tokens for history
    const conversationHistory = await buildConversationHistory(
        conversationId,
        historyBudget
    );

    // 8. Construct full prompt
    const fullPrompt = [
        contextString,
        "",
        "---",
        "【会話履歴】",
        ...conversationHistory.map(
            (m) => `${m.role === "user" ? "ユーザー" : "アシスタント"}: ${m.content}`
        ),
        "",
        "---",
        `ユーザー: ${userMessage}`,
        "",
        "【応答】",
    ].join("\n");

    // 9. Generate AI response
    const { text, tokenUsed } = await generateText(
        fullPrompt,
        COMPANION_SYSTEM_PROMPT
    );

    // 10. Ethical validation
    const validatedResponse = validateCompanionResponse(text);

    // 11. Save assistant message
    await prisma.companionMessage.create({
        data: {
            conversationId,
            role: "assistant",
            content: validatedResponse,
            tokenCount: tokenUsed || estimateTokenCount(validatedResponse),
            memorySnapshot: memorySnapshot as any,
        },
    });

    // 12. Update conversation
    await prisma.companionConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date(), contextVersion: { increment: 1 } },
    });

    return {
        content: validatedResponse,
        isSilent: false,
        tokenUsed: tokenUsed || estimateTokenCount(validatedResponse),
        memorySnapshot,
    };
}

// ===================================================
// Weekly Reflection Generator
// ===================================================

export async function generateWeeklyReflection(
    userId: string
): Promise<CompanionResponse> {
    const { WEEKLY_REFLECTION_SYSTEM_PROMPT, WEEKLY_REFLECTION_PROMPT } = await import(
        "./prompts/weekly"
    );

    // Build context for weekly reflection
    const context = await buildCompanionContext(userId);

    // Format data for weekly prompt
    const prompt = WEEKLY_REFLECTION_PROMPT
        .replace(
            "{{currentThemes}}",
            context.currentThemes
                .map((t) => `- ${t.title} (${Math.round(t.confidence * 100)}%)`)
                .join("\n") || "特に目立ったテーマはありません"
        )
        .replace(
            "{{emotionalTrend}}",
            context.emotionalTrend?.summary || "特に顕著な感情変化は見られません"
        )
        .replace(
            "{{recentReflections}}",
            context.recentReflections
                .map((r) => `- ${r.title || "気づき"}: ${(r.content || "").slice(0, 100)}`)
                .join("\n") || "今週の内省記録はありません"
        )
        .replace(
            "{{recentMemories}}",
            context.relevantMemories
                .map((m) => `- [${m.type}] ${m.title}`)
                .join("\n") || "新しい記憶の追加はありません"
        )
        .replace(
            "{{ongoingQuestions}}",
            context.ongoingQuestions.join("\n") || "特に継続中の問いはありません"
        );

    // Generate weekly reflection
    const { text, tokenUsed } = await generateText(
        prompt,
        WEEKLY_REFLECTION_SYSTEM_PROMPT
    );

    const validatedResponse = validateCompanionResponse(text);

    return {
        content: validatedResponse,
        isSilent: false,
        tokenUsed: tokenUsed || estimateTokenCount(validatedResponse),
        memorySnapshot: {
            type: "weekly_reflection",
            themes: context.currentThemes.length,
            reflections: context.recentReflections.length,
        } as any,
    };
}