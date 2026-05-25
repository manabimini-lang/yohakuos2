// ===================================================
// YOHAKU Life OS — Conversation Compression Layer
// ===================================================
//
// 目的:
// - コンテキスト肥大化防止
// - long-term abstraction
// - semantic summarization
//
// 会話のサマリー・テーマ・インサイトを保存。
//

import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gemini";
import {
    ConversationSummaryInfo,
    ConversationThemeInfo,
    ConversationInsightInfo,
    SummaryType,
} from "./types";

/**
 * 会話のサマリーを生成・保存
 */
export async function compressConversation(
    conversationId: string,
    summaryTypes: SummaryType[] = ["rolling", "thematic", "meaning"]
): Promise<ConversationSummaryInfo[]> {
    const results: ConversationSummaryInfo[] = [];

    // Get all messages in conversation
    const messages = await prisma.companionMessage.findMany({
        where: { conversationId, role: { in: ["user", "assistant"] } },
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true, createdAt: true },
    });

    if (messages.length < 5) {
        return []; // Not enough to summarize
    }

    const conversationText = messages
        .map((m) => `[${m.role}]: ${m.content.slice(0, 200)}`)
        .join("\n");

    for (const type of summaryTypes) {
        const summary = await generateSummary(type, conversationText, messages.length);

        const saved = await prisma.conversationSummary.create({
            data: {
                conversationId,
                summaryType: type,
                content: summary,
                tokenCount: Math.ceil(summary.length / 4),
            },
        });

        results.push({
            id: saved.id,
            conversationId: saved.conversationId,
            summaryType: saved.summaryType as SummaryType,
            content: saved.content,
            tokenCount: saved.tokenCount,
            createdAt: saved.createdAt,
        });
    }

    // Also extract themes
    await extractConversationThemes(conversationId, messages);

    return results;
}

async function generateSummary(
    type: SummaryType,
    conversationText: string,
    messageCount: number
): Promise<string> {
    const prompts: Record<SummaryType, string> = {
        rolling: `以下の会話を3行に要約してください。
流れが分かるように、時系列を意識して。

${conversationText}

要約（3行）:`,
        thematic: `以下の会話から、テーマを2-3行で要約してください。
繰り返し出てきた話題を中心に。

${conversationText}

テーマ要約:`,
        abstract: `以下の会話を、より抽象的な視点で2行に要約してください。
感情の変化や、会話の質の変化に注目して。

${conversationText}

抽象的サマリー:`,
        meaning: `以下の会話から、意味の兆しを抽出してください。
繰り返し現れるテーマや未解決の問いに注目。

${conversationText}

意味的サマリー:`,
    };

    const prompt = prompts[type];
    const { text } = await generateText(prompt);
    return text;
}

async function extractConversationThemes(
    conversationId: string,
    messages: Array<{ role: string; content: string }>
): Promise<void> {
    const conversationText = messages
        .map((m) => m.content.slice(0, 150))
        .join("\n");

    const prompt = `以下の会話から、主要なテーマを3つ抽出してください。
各テーマに確度（0.0-1.0）をつけてください。

${conversationText}

以下のJSON形式で返してください:
{
  "themes": [
    {"theme": "テーマ1", "confidence": 0.7},
    {"theme": "テーマ2", "confidence": 0.5}
  ]
}`;

    const { text } = await generateText(prompt);

    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return;
        const parsed = JSON.parse(jsonMatch[0]);

        for (const t of parsed.themes || []) {
            await prisma.conversationTheme.create({
                data: {
                    conversationId,
                    theme: t.theme.slice(0, 200),
                    confidence: Math.max(0, Math.min(1, t.confidence || 0.3)),
                },
            });
        }
    } catch {
        // Silently fail
    }
}

/**
 * 会話からインサイトを抽出
 */
export async function extractConversationInsights(
    conversationId: string
): Promise<ConversationInsightInfo[]> {
    const messages = await prisma.companionMessage.findMany({
        where: { conversationId, role: { in: ["user", "assistant"] } },
        orderBy: { createdAt: "asc" },
        take: 20,
        select: { content: true },
    });

    if (messages.length < 5) return [];

    const conversationText = messages
        .map((m) => m.content.slice(0, 200))
        .join("\n");

    const prompt = `以下の会話から、重要な気づきやインサイトを抽出してください。
「ユーザーが何に気づいたか」「どんな学びがあったか」に注目。

${conversationText}

以下のJSON形式で返してください:
{
  "insights": [
    {"insight": "気づき1（50文字以内）", "confidence": 0.6},
    {"insight": "気づき2", "confidence": 0.4}
  ]
}`;

    const { text } = await generateText(prompt);

    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return [];
        const parsed = JSON.parse(jsonMatch[0]);

        const results: ConversationInsightInfo[] = [];
        for (const ins of parsed.insights || []) {
            const saved = await prisma.conversationInsight.create({
                data: {
                    conversationId,
                    insight: ins.insight.slice(0, 500),
                    confidence: Math.max(0, Math.min(1, ins.confidence || 0.3)),
                },
            });

            results.push({
                id: saved.id,
                conversationId: saved.conversationId,
                insight: saved.insight,
                confidence: saved.confidence,
                createdAt: saved.createdAt,
            });
        }

        return results;
    } catch {
        return [];
    }
}

/**
 * 会話サマリー一覧を取得
 */
export async function getConversationSummaries(
    conversationId: string
): Promise<ConversationSummaryInfo[]> {
    const summaries = await prisma.conversationSummary.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            conversationId: true,
            summaryType: true,
            content: true,
            tokenCount: true,
            createdAt: true,
        },
    });

    return summaries.map((s) => ({
        id: s.id,
        conversationId: s.conversationId,
        summaryType: s.summaryType as SummaryType,
        content: s.content,
        tokenCount: s.tokenCount,
        createdAt: s.createdAt,
    }));
}