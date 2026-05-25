// ===================================================
// YOHAKU Life OS — Context Compression Engine
// ===================================================
//
// 人生データの全投入を防ぐための圧縮レイヤー。
// 以下の圧縮方式を提供:
// - rolling summaries: ローリングサマリー
// - thematic compression: テーマ別圧縮
// - emotional abstraction: 感情的抽象化
// - meaning compression: 意味圧縮
// - seasonal summarization: 季節サマリー
//

import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gemini";
import { CompressedContext } from "./types";
import { MEANING_SYSTEM_PROMPT } from "./prompts";

const MAX_TOKENS_PER_SECTION = 500;

/**
 * 圧縮コンテキストを生成
 */
export async function buildCompressedContext(userId: string): Promise<CompressedContext> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Collect data for compression
    const [recentReflections, recentMemories, recentMessages, energyStates] =
        await Promise.all([
            prisma.reflection.findMany({
                where: { userId, createdAt: { gte: sevenDaysAgo } },
                orderBy: { createdAt: "desc" },
                take: 20,
                select: { title: true, content: true, sentiment: true },
            }),
            prisma.userMemory.findMany({
                where: { userId, createdAt: { gte: thirtyDaysAgo }, confidence: { gte: 0.3 } },
                orderBy: { createdAt: "desc" },
                take: 20,
                select: { type: true, title: true, content: true, confidence: true },
            }),
            prisma.companionMessage.findMany({
                where: { role: { in: ["user", "assistant"] }, conversation: { userId }, createdAt: { gte: sevenDaysAgo } },
                orderBy: { createdAt: "desc" },
                take: 30,
                select: { role: true, content: true, createdAt: true },
            }),
            prisma.energyState.findMany({
                where: { userId, createdAt: { gte: thirtyDaysAgo } },
                orderBy: { createdAt: "desc" },
                take: 20,
                select: { state: true, intensity: true, note: true },
            }),
        ]);

    // Generate each compression type
    const [rollingSummary, thematicCompression, emotionalAbstraction, meaningCompression, seasonalSummary] =
        await Promise.all([
            generateRollingSummary(recentReflections, recentMessages),
            generateThematicCompression(recentMemories),
            generateEmotionalAbstraction(energyStates, recentReflections),
            generateMeaningCompression(userId),
            generateSeasonalSummary(userId),
        ]);

    const estimatedTokens = Math.ceil(
        (rollingSummary.length + thematicCompression.length +
            emotionalAbstraction.length + meaningCompression.length +
            (seasonalSummary || "").length) / 4
    );

    return {
        rollingSummary,
        thematicCompression,
        emotionalAbstraction,
        meaningCompression,
        seasonalSummarization: seasonalSummary,
        estimatedTokens,
    };
}

async function generateRollingSummary(
    reflections: Array<{ title: string | null; content: string | null; sentiment: string | null }>,
    messages: Array<{ role: string; content: string; createdAt: Date }>
): Promise<string> {
    if (reflections.length === 0 && messages.length === 0) {
        return "最近のアクティビティはありません。";
    }

    const reflectionText = reflections
        .map((r) => `- ${r.title || "内省"}: ${(r.content || "").slice(0, 100)}`)
        .join("\n");

    const messageText = messages
        .slice(0, 10)
        .map((m) => `- [${m.role}]: ${m.content.slice(0, 100)}`)
        .join("\n");

    const prompt = `以下のデータを3行に圧縮してください。
最近の出来事の流れが分かるように。

${reflectionText}

${messageText}

圧縮（3行以内）:`;

    const { text } = await generateText(prompt);
    return text.slice(0, MAX_TOKENS_PER_SECTION * 4);
}

async function generateThematicCompression(
    memories: Array<{ type: string; title: string; content: string; confidence: number }>
): Promise<string> {
    if (memories.length === 0) return "テーマ別データはありません。";

    const memoryText = memories
        .slice(0, 15)
        .map((m) => `- [${m.type}] ${m.title}: ${m.content.slice(0, 80)}`)
        .join("\n");

    const prompt = `以下の記憶をテーマ別に2-3行で要約してください。
共通するテーマがあれば、それを中心に。

${memoryText}

テーマ別要約:`;

    const { text } = await generateText(prompt);
    return text.slice(0, MAX_TOKENS_PER_SECTION * 4);
}

async function generateEmotionalAbstraction(
    energies: Array<{ state: string; intensity: number; note: string | null }>,
    reflections: Array<{ title: string | null; content: string | null; sentiment: string | null }>
): Promise<string> {
    if (energies.length === 0 && reflections.length === 0) {
        return "感情データはありません。";
    }

    const energyText = energies
        .slice(0, 10)
        .map((e) => `- ${e.state}(${e.intensity}/10): ${e.note || ""}`)
        .join("\n");

    const reflectionSentiments = reflections
        .filter((r) => r.sentiment)
        .map((r) => r.sentiment)
        .join(", ");

    const prompt = `以下のエネルギー状態と感情データから、
感情の傾向を2行で抽象化してください。

【エネルギー状態】
${energyText}

【感情の兆し】
${reflectionSentiments}

感情の傾向（2行）:`;

    const { text } = await generateText(prompt);
    return text.slice(0, MAX_TOKENS_PER_SECTION * 4);
}

async function generateMeaningCompression(userId: string): Promise<string> {
    const meanings = await prisma.meaningSignal.findMany({
        where: { userId, confidence: { gte: 0.2 } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { signalType: true, description: true, confidence: true },
    });

    if (meanings.length === 0) return "意味シグナルはまだ抽出されていません。";

    const meaningText = meanings
        .map((m) => `- [${m.signalType}] ${m.description.slice(0, 100)}`)
        .join("\n");

    const prompt = `以下の意味シグナルを2行に圧縮してください。
繰り返し現れるテーマに注目して。

${meaningText}

圧縮:`;

    const { text } = await generateText(prompt, MEANING_SYSTEM_PROMPT);
    return text.slice(0, MAX_TOKENS_PER_SECTION * 4);
}

async function generateSeasonalSummary(userId: string): Promise<string | null> {
    const latestSeasonal = await prisma.seasonalSummary.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { period: true, summary: true, themes: true },
    });

    if (!latestSeasonal) return null;

    return `【${latestSeasonal.period}】${latestSeasonal.summary}`;
}