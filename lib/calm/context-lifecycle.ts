// ===================================================
// YOHAKU Calm Infrastructure — Context Lifecycle Management
// ===================================================
//
// Context は永久肥大化させない。
// - memory summarization（古い記憶の要約）
// - stale pruning（古いデータの削除）
// - theme compression（テーマ圧縮）
// - semantic abstraction（意味的抽象化）
// - layered memory（階層化記憶）
//

import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gemini";
import { ContextHealthReport, DEFAULT_CONTEXT_LIFECYCLE } from "./types";

/**
 * コンテキストヘルスレポートを生成
 */
export async function getContextHealth(userId: string): Promise<ContextHealthReport> {
    const [totalMemories, lowConfidenceMemories, oldMemories, totalTokens] = await Promise.all([
        prisma.userMemory.count({ where: { userId } }),
        prisma.userMemory.count({
            where: { userId, confidence: { lt: 0.3 } },
        }),
        prisma.userMemory.count({
            where: {
                userId,
                createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
                confidence: { lt: 0.4 },
            },
        }),
        // Estimate total tokens from stored memories
        prisma.userMemory.findMany({
            where: { userId },
            select: { content: true, title: true },
        }),
    ]);

    const estimatedTokens = totalTokens.reduce(
        (sum, m) => sum + Math.ceil((m.title.length + m.content.length) / 4),
        0
    );

    return {
        totalMemories,
        lowConfidenceMemories,
        staleMemories: oldMemories,
        compressionCandidates: lowConfidenceMemories + oldMemories,
        estimatedTokens,
    };
}

/**
 * 古い低確度メモリを圧縮
 */
export async function compressOldMemories(userId: string): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const config = DEFAULT_CONTEXT_LIFECYCLE;

    const oldMemories = await prisma.userMemory.findMany({
        where: {
            userId,
            confidence: { lt: 0.4 },
            createdAt: { lt: thirtyDaysAgo },
        },
        orderBy: { createdAt: "asc" },
        take: 50,
        select: { id: true, type: true, title: true, content: true, confidence: true },
    });

    if (oldMemories.length < 5) return 0;

    // Group by type for compression
    const byType: Record<string, typeof oldMemories> = {};
    for (const mem of oldMemories) {
        if (!byType[mem.type]) byType[mem.type] = [];
        byType[mem.type].push(mem);
    }

    let compressed = 0;

    for (const [type, memories] of Object.entries(byType)) {
        if (memories.length < 3) continue;

        const memoryText = memories
            .map((m) => `- [${m.confidence.toFixed(2)}] ${m.title}: ${m.content.slice(0, 80)}`)
            .join("\n");

        const prompt = `以下の${type}タイプの古い記憶群を2行に圧縮してください。
共通するテーマがあれば抽出し、残りは破棄して構いません。

${memoryText}

圧縮結果:`;

        const { text } = await generateText(prompt);

        // Create compressed memory
        await prisma.userMemory.create({
            data: {
                userId,
                type: type as any,
                title: `圧縮: ${type} (${memories.length}件)`,
                content: `【自動圧縮 ${new Date().toLocaleDateString("ja-JP")}】\n${text}`,
                confidence: 0.25,
                promptVersion: "calm-compression-1.0.0",
            },
        });

        compressed++;
    }

    return compressed;
}

/**
 * 古いリフレクションを要約
 */
export async function summarizeOldReflections(userId: string): Promise<number> {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const oldReflections = await prisma.reflection.findMany({
        where: {
            userId,
            createdAt: { lt: ninetyDaysAgo },
            type: "user",
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, title: true, content: true, createdAt: true },
    });

    if (oldReflections.length < 10) return 0;

    const reflectionText = oldReflections
        .map((r) => `- ${r.createdAt.toLocaleDateString("ja-JP")}: ${r.title || "無題"} - ${(r.content || "").slice(0, 60)}`)
        .join("\n");

    const prompt = `以下の90日以上前の古い内省群を、テーマ別に3行で要約してください。
繰り返し現れるテーマや関心の変化に注目。

${reflectionText}

要約:`;

    const { text } = await generateText(prompt);

    await prisma.lifeReflection.create({
        data: {
            userId,
            type: "seasonal",
            title: "長期内省サマリー",
            content: `【自動要約 ${new Date().toLocaleDateString("ja-JP")}】\n${text}`,
            confidence: 0.3,
            sourceIds: oldReflections.map((r) => r.id),
        },
    });

    return 1;
}

/**
 * 古いコンパニオンメッセージをクリーンアップ
 */
export async function cleanupOldMessages(userId: string): Promise<number> {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Remove old system messages (summaries, silence records)
    const result = await prisma.companionMessage.deleteMany({
        where: {
            role: "system",
            conversation: { userId },
            createdAt: { lt: ninetyDaysAgo },
        },
    });

    return result.count;
}

/**
 * 全コンテキスト最適化を実行
 */
export async function optimizeContext(userId: string): Promise<{
    memoriesCompressed: number;
    reflectionsSummarized: number;
    messagesCleaned: number;
}> {
    const [memoriesCompressed, reflectionsSummarized, messagesCleaned] = await Promise.all([
        compressOldMemories(userId),
        summarizeOldReflections(userId),
        cleanupOldMessages(userId),
    ]);

    return { memoriesCompressed, reflectionsSummarized, messagesCleaned };
}