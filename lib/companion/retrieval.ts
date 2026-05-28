// ===================================================
// YOHAKU Companion — Memory Retrieval Engine
// ===================================================
//
// 重要: 全Memory投入禁止。
// 以下の優先度で必要な記憶のみを選択的に取得:
//   1. recent memory prioritization
//   2. active theme prioritization
//   3. emotional relevance
//   4. road relevance
//   5. reflection relevance
//   6. token budgeting
//

import { prisma } from "@/lib/prisma";
import {
    CompanionContext,
    ThemeInfo,
    EmotionalTrend,
    ReflectionInfo,
    RoadInfo,
    MemorySnippet,
} from "./types";
import { estimateTokenCount } from "@/lib/memory/cost";
import { getLifeOSContextForCompanion } from "./life-os-context";

const MAX_TOTAL_TOKENS = 8_000; // user context token budget
const MAX_MEMORIES = 15;
const MAX_REFLECTIONS = 5;
const MAX_THEMES = 3;

export async function buildCompanionContext(
    userId: string,
    conversationId?: string
): Promise<CompanionContext> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Fetch all data sources in parallel (including Life OS context)
    const [activeThemes, emotionalMemories, recentReflections, activeRoads, recentMemories, highConfidenceMemories, lifeOSContext] =
        await Promise.all([
            // Active life themes (highest confidence, most recent)
            prisma.userMemory.findMany({
                where: { userId, type: "life_theme", confidence: { gte: 0.35 } },
                orderBy: [{ confidence: "desc" }, { createdAt: "desc" }],
                take: MAX_THEMES,
                select: {
                    id: true,
                    title: true,
                    content: true,
                    type: true,
                    confidence: true,
                    createdAt: true,
                },
            }),

            // Emotional patterns (for trend detection)
            prisma.userMemory.findMany({
                where: {
                    userId,
                    type: "emotional_pattern",
                    confidence: { gte: 0.3 },
                },
                orderBy: { createdAt: "desc" },
                take: 3,
                select: { id: true, type: true, title: true, content: true, confidence: true, createdAt: true },
            }),

            // Recent reflections
            prisma.reflection.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: MAX_REFLECTIONS,
                select: {
                    id: true,
                    title: true,
                    content: true,
                    sentiment: true,
                    createdAt: true,
                },
            }),

            // Active roads (user's current path)
            prisma.road.findMany({
                where: { isActive: true },
                take: 1,
                select: { id: true, slug: true, title: true, description: true, icon: true },
            }),

            // Recent memories (last 7 days, high confidence)
            prisma.userMemory.findMany({
                where: {
                    userId,
                    createdAt: { gte: sevenDaysAgo },
                    confidence: { gte: 0.4 },
                },
                orderBy: [{ confidence: "desc" }, { createdAt: "desc" }],
                take: 10,
                select: {
                    id: true,
                    type: true,
                    title: true,
                    content: true,
                    confidence: true,
                    createdAt: true,
                },
            }),

            // High-confidence cornerstone memories
            prisma.userMemory.findMany({
                where: {
                    userId,
                    confidence: { gte: 0.6 },
                    type: { in: ["value", "belief", "motivation", "personality_trait"] },
                },
                orderBy: { confidence: "desc" },
                take: 5,
                select: {
                    id: true,
                    type: true,
                    title: true,
                    content: true,
                    confidence: true,
                    createdAt: true,
                },
            }),

            // Life OS context (人生OS層)
            getLifeOSContextForCompanion(userId),
        ]);

    // 2. Build themes with duration info
    const currentThemes: ThemeInfo[] = activeThemes.map((t) => {
        const daysSinceCreation = Math.ceil(
            (now.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
            title: t.title,
            confidence: t.confidence,
            durationDays: daysSinceCreation,
            sources: [t.type],
        };
    });

    // 3. Build emotional trend
    const emotionalTrend = buildEmotionalTrend(emotionalMemories);

    // 4. Format reflections
    const recentReflectionsFormatted: ReflectionInfo[] = recentReflections.map((r) => ({
        id: r.id,
        title: r.title || "",
        content: r.content || "",
        sentiment: r.sentiment,
        createdAt: r.createdAt,
    }));

    // 5. Format active road
    const activeRoad: RoadInfo | null =
        activeRoads.length > 0
            ? {
                id: activeRoads[0].id,
                slug: activeRoads[0].slug,
                title: activeRoads[0].title,
                description: activeRoads[0].description,
                icon: activeRoads[0].icon,
            }
            : null;

    // 6. Merge and rank memories by relevance
    const mergedMemories = mergeAndRankMemories(
        recentMemories,
        highConfidenceMemories,
        activeThemes,
        emotionalMemories
    );

    // 7. Token budget enforcement: trim memories to fit budget
    const budgetedMemories = applyTokenBudget(mergedMemories, MAX_TOTAL_TOKENS);

    // 8. Extract ongoing questions from reflections
    const ongoingQuestions = extractOngoingQuestions(recentReflectionsFormatted);

    // 9. Estimate total tokens
    const estimatedTokens = estimateContextTokens(
        currentThemes,
        emotionalTrend,
        recentReflectionsFormatted,
        budgetedMemories,
        ongoingQuestions
    );

    return {
        currentThemes,
        emotionalTrend,
        recentReflections: recentReflectionsFormatted,
        activeRoad,
        relevantMemories: budgetedMemories,
        ongoingQuestions,
        lifeOSContext,
        generatedAt: now.toISOString(),
        confidenceFloor: 0.35,
        estimatedTokens,
    };
}

function buildEmotionalTrend(
    memories: Array<{ title: string; content: string; confidence: number; createdAt: Date }>
): EmotionalTrend | null {
    if (memories.length === 0) return null;

    // Simple aggregation: take the most recent high-confidence pattern
    const sorted = [...memories].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    const latest = sorted[0];

    // Detect direction based on content keywords (simple heuristic)
    const content = (latest.title + " " + latest.content).toLowerCase();
    let direction = "stable";
    if (content.includes("改善") || content.includes("上昇") || content.includes("前向き")) {
        direction = "positive_shift";
    } else if (
        content.includes("下降") ||
        content.includes("停滞") ||
        content.includes("不安")
    ) {
        direction = "negative_shift";
    } else if (sorted.length > 1) {
        direction = "fluctuating";
    }

    return {
        summary: latest.content.slice(0, 150),
        direction,
        confidence: latest.confidence,
    };
}

function mergeAndRankMemories(
    ...memoryGroups: Array<
        Array<{
            id: string;
            type: string;
            title: string;
            content: string;
            confidence: number;
            createdAt: Date;
        }>
    >
): MemorySnippet[] {
    const seen = new Set<string>();
    const all: MemorySnippet[] = [];

    for (const group of memoryGroups) {
        for (const m of group) {
            if (seen.has(m.id)) continue;
            seen.add(m.id);

            // Calculate relevance score: combination of confidence + recency
            const daysOld =
                (Date.now() - m.createdAt.getTime()) / (1000 * 60 * 60 * 24);
            const recencyFactor = Math.max(0, 1 - daysOld / 30); // decays over 30 days
            const typeBoost = getTypeBoost(m.type);
            const relevance = m.confidence * 0.5 + recencyFactor * 0.3 + typeBoost * 0.2;

            all.push({
                id: m.id,
                type: m.type,
                title: m.title,
                content: m.content,
                confidence: m.confidence,
                relevance: Math.min(1, Math.round(relevance * 100) / 100),
                createdAt: m.createdAt,
            });
        }
    }

    // Sort by relevance descending
    return all.sort((a, b) => b.relevance - a.relevance);
}

function getTypeBoost(type: string): number {
    // Core personality/value types get a boost for companion context
    const boostMap: Record<string, number> = {
        value: 0.3,
        belief: 0.25,
        motivation: 0.2,
        life_theme: 0.3,
        personality_trait: 0.2,
        emotional_pattern: 0.15,
        behavior_pattern: 0.1,
    };
    return boostMap[type] || 0;
}

function applyTokenBudget(
    memories: MemorySnippet[],
    budget: number
): MemorySnippet[] {
    const result: MemorySnippet[] = [];
    let totalTokens = 0;
    const overheadPerItem = 20; // approximate per-memory overhead

    for (const memory of memories) {
        const itemTokens =
            estimateTokenCount(memory.title + memory.content) + overheadPerItem;
        if (totalTokens + itemTokens > budget) break;
        totalTokens += itemTokens;
        result.push(memory);
    }

    return result;
}

function extractOngoingQuestions(reflections: ReflectionInfo[]): string[] {
    const questions: string[] = [];

    // Heuristic: look for question marks or uncertainty in reflections
    const uncertaintyPatterns = [
        "わからない",
        "疑問",
        "どうしよう",
        "迷っている",
        "悩んでいる",
        "?",
        "？",
    ];

    for (const ref of reflections) {
        const text = (ref.title + " " + ref.content).toLowerCase();
        for (const pattern of uncertaintyPatterns) {
            if (text.includes(pattern)) {
                questions.push(ref.content.slice(0, 100));
                break;
            }
        }
        if (questions.length >= 3) break;
    }

    return questions;
}

function estimateContextTokens(
    themes: ThemeInfo[],
    emotionalTrend: EmotionalTrend | null,
    reflections: ReflectionInfo[],
    memories: MemorySnippet[],
    questions: string[]
): number {
    let total = 0;

    total += estimateTokenCount(JSON.stringify(themes));
    total += emotionalTrend ? estimateTokenCount(JSON.stringify(emotionalTrend)) : 0;
    total += estimateTokenCount(JSON.stringify(reflections));
    total += estimateTokenCount(JSON.stringify(memories));
    total += estimateTokenCount(questions.join("\n"));

    return total;
}

/**
 * Build a formatted prompt-friendly context string for companion.
 * This is the final output used in AI prompts.
 */
export function buildCompanionContextForPrompt(
    context: CompanionContext
): string {
    const parts: string[] = [
        "【伴走コンテキスト - ユーザーの人生文脈】",
        "※これは参考情報です。断定せず、余白を残して応答してください。",
        "",
    ];

    if (context.currentThemes.length > 0) {
        parts.push("▸ 現在のテーマ:");
        for (const theme of context.currentThemes) {
            parts.push(
                `  - ${theme.title} (確度${Math.round(theme.confidence * 100)}%, ${theme.durationDays}日継続)`
            );
        }
        parts.push("");
    }

    if (context.emotionalTrend) {
        parts.push("▸ 感情の傾向:");
        parts.push(`  ${context.emotionalTrend.summary}`);
        parts.push(`  (変化: ${context.emotionalTrend.direction})`);
        parts.push("");
    }

    if (context.recentReflections.length > 0) {
        parts.push("▸ 最近の内省:");
        for (const ref of context.recentReflections.slice(0, 3)) {
            parts.push(`  - ${ref.title || "無題"}`);
            if (ref.sentiment) {
                parts.push(`    (感情: ${ref.sentiment})`);
            }
        }
        parts.push("");
    }

    if (context.activeRoad) {
        parts.push("▸ 現在の道:");
        parts.push(`  ${context.activeRoad.title}: ${context.activeRoad.description}`);
        parts.push("");
    }

    if (context.relevantMemories.length > 0) {
        parts.push("▸ 関連する記憶:");
        for (const mem of context.relevantMemories.slice(0, 8)) {
            const contentPreview = mem.content.slice(0, 80);
            parts.push(
                `  [${mem.type}] ${mem.title} (関連度: ${Math.round(mem.relevance * 100)}%)`
            );
            parts.push(`    ${contentPreview}${mem.content.length > 80 ? "..." : ""}`);
        }
        parts.push("");
    }

    if (context.ongoingQuestions.length > 0) {
        parts.push("▸ 継続中の問い:");
        for (const q of context.ongoingQuestions) {
            parts.push(`  - ${q}`);
        }
        parts.push("");
    }

    parts.push(
        "【ガイドライン】",
        "- ユーザーの人生文脈を理解しつつも、断定や過剰な解釈はしない",
        "- 沈黙も対話の一部。必要なければ無理に話さない",
        "- 答えを与えるのではなく、静かな問いを返す",
        "- この情報はあくまで参考であり、ユーザーは日々変化する",
    );

    return parts.join("\n");
}