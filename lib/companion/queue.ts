// ===================================================
// YOHAKU Companion — Queue / Async Job Handlers
// ===================================================
//
// AIJob Queue 化:
// - weekly reflection generation
// - context summarization
// - memory compression
// - conversation summarization
//

import { registerJobHandler, enqueueJob } from "@/lib/memory/queue";
import { generateWeeklyReflection } from "./engine";

// ===================================================
// Handlers
// ===================================================

/**
 * weekly_reflection: 週次振り返り生成
 */
registerJobHandler("weekly_reflection", async (job) => {
    const response = await generateWeeklyReflection(job.userId);

    // Save reflection as a companion message
    const { prisma } = await import("@/lib/prisma");

    // Find or create companion conversation for weekly reflections
    let conversation = await prisma.companionConversation.findFirst({
        where: {
            userId: job.userId,
            title: { contains: "週次振り返り" },
        },
        orderBy: { createdAt: "desc" },
    });

    if (!conversation) {
        conversation = await prisma.companionConversation.create({
            data: {
                userId: job.userId,
                title: `週次振り返り - ${new Date().toLocaleDateString("ja-JP")}`,
            },
        });
    }

    // Save the weekly reflection as assistant message
    await prisma.companionMessage.create({
        data: {
            conversationId: conversation.id,
            role: "assistant",
            content: response.content,
            tokenCount: response.tokenUsed,
            memorySnapshot: response.memorySnapshot as any,
        },
    });

    // Update job output
    await prisma.aIJob.update({
        where: { id: job.id },
        data: {
            output: {
                conversationId: conversation.id,
                tokenUsed: response.tokenUsed,
                isSilent: response.isSilent,
            },
            tokenUsed: response.tokenUsed,
        },
    });
});

/**
 * conversation_summary: 会話の要約（コンテキスト圧縮用）
 */
registerJobHandler("conversation_summary", async (job) => {
    const { prisma } = await import("@/lib/prisma");
    const { generateText } = await import("@/lib/ai/gemini");

    const { conversationId } = job.input as { conversationId: string };

    // Get all messages in conversation
    const messages = await prisma.companionMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true, createdAt: true },
    });

    if (messages.length < 5) return; // Not enough to summarize

    // Build summary prompt
    const conversationText = messages
        .map(
            (m) =>
                `[${m.role}] (${m.createdAt.toLocaleDateString("ja-JP")}): ${m.content.slice(0, 200)}`
        )
        .join("\n");

    const summaryPrompt = `以下の会話を3-5行で要約してください。
重要なテーマ、感情の変化、未解決の問いを中心に。

${conversationText}

要約:`;

    const { text } = await generateText(summaryPrompt);

    // Save summary as system message
    await prisma.companionMessage.create({
        data: {
            conversationId,
            role: "system",
            content: JSON.stringify({
                type: "summary",
                summary: text,
            }),
            tokenCount: 50,
        },
    });

    await prisma.aIJob.update({
        where: { id: job.id },
        data: { output: { summary: text } },
    });
});

/**
 * memory_compression: 古いメモリを圧縮
 */
registerJobHandler("memory_compression", async (job) => {
    const { prisma } = await import("@/lib/prisma");
    const { generateText } = await import("@/lib/ai/gemini");

    const { userId } = job;

    // Find low-confidence memories that are old (>30 days)
    const oldMemories = await prisma.userMemory.findMany({
        where: {
            userId,
            confidence: { lt: 0.5 },
            createdAt: {
                lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
        },
        orderBy: { confidence: "asc" },
        take: 20,
        select: { id: true, type: true, title: true, content: true, confidence: true },
    });

    if (oldMemories.length < 5) return;

    // Generate a compressed summary of these low-confidence memories
    const memoryText = oldMemories
        .map((m) => `[${m.type}] ${m.title}: ${m.content.slice(0, 100)}`)
        .join("\n");

    const compressionPrompt = `以下の低確度記憶群を圧縮してください。
共通するテーマがあれば1-2行でまとめ、残りは破棄して構いません。

${memoryText}

圧縮結果:`;

    const { text } = await generateText(compressionPrompt);

    // Create a compressed memory summary note
    await prisma.userMemory.create({
        data: {
            userId,
            type: "reflection",
            title: "圧縮された古い記憶",
            content: `【自動圧縮】${text}`,
            confidence: 0.3,
            promptVersion: "compression-1.0.0",
        },
    });

    await prisma.aIJob.update({
        where: { id: job.id },
        data: { output: { compressed: true, originalCount: oldMemories.length } },
    });
});

export { enqueueJob };