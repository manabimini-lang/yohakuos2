import { prisma } from '../prisma';
import { generateText } from '../ai/gemini';

export interface UserContext {
    user_context: {
        recent_learnings: Array<{ title: string; confidence: number }>;
        current_themes: Array<{ title: string; confidence: number }>;
        emotional_trend: string | null;
        core_values: Array<{ title: string; confidence: number }>;
        active_behaviors: Array<{ title: string; confidence: number }>;
        last_reflection: { title: string; content: string } | null;
        memory_count: number;
    };
    generated_at: string;
    confidence_floor: number;
}

export async function buildUserContext(userId: string): Promise<UserContext> {
    const [recentLearnings, coreValues, activeBehaviors, emotionalTrend, lastReflection] =
        await Promise.all([
            // Recent learnings (memories created in last 7 days)
            prisma.userMemory.findMany({
                where: {
                    userId,
                    createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                    confidence: { gte: 0.4 },
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { title: true, confidence: true },
            }),

            // Core values (highest confidence values)
            prisma.userMemory.findMany({
                where: { userId, type: 'value', confidence: { gte: 0.5 } },
                orderBy: { confidence: 'desc' },
                take: 5,
                select: { title: true, confidence: true },
            }),

            // Active behavior patterns
            prisma.userMemory.findMany({
                where: {
                    userId,
                    type: 'behavior_pattern',
                    confidence: { gte: 0.4 },
                },
                orderBy: { confidence: 'desc' },
                take: 3,
                select: { title: true, confidence: true },
            }),

            // Latest emotional trend
            prisma.userMemory.findFirst({
                where: { userId, type: 'emotional_pattern', confidence: { gte: 0.4 } },
                orderBy: { createdAt: 'desc' },
                select: { content: true },
            }),

            // Latest reflection
            prisma.reflection.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                select: { title: true, content: true },
            }),
        ]);

    // Current themes from life_themes
    const currentThemes = await prisma.userMemory.findMany({
        where: { userId, type: 'life_theme', confidence: { gte: 0.4 } },
        orderBy: { confidence: 'desc' },
        take: 3,
        select: { title: true, confidence: true },
    });

    // Total memory count
    const memoryCount = await prisma.userMemory.count({
        where: { userId, confidence: { gte: 0.3 } },
    });

    return {
        user_context: {
            recent_learnings: recentLearnings,
            current_themes: currentThemes,
            emotional_trend: emotionalTrend?.content ?? null,
            core_values: coreValues,
            active_behaviors: activeBehaviors,
            last_reflection: lastReflection ? { title: lastReflection.title || '', content: lastReflection.content || '' } : null,
            memory_count: memoryCount,
        },
        generated_at: new Date().toISOString(),
        confidence_floor: 0.3,
    };
}

// Build a prompt-friendly context string for AI dialogue
export async function buildContextForPrompt(userId: string): Promise<string> {
    const context = await buildUserContext(userId);
    const c = context.user_context;

    const parts: string[] = ['【ユーザー長期記憶コンテキスト】'];

    if (c.core_values.length > 0) {
        parts.push(
            '価値観: ' +
            c.core_values
                .map((v) => `${v.title} (確度${Math.round(v.confidence * 100)}%)`)
                .join(', ')
        );
    }

    if (c.current_themes.length > 0) {
        parts.push(
            '現在のテーマ: ' +
            c.current_themes
                .map((t) => `${t.title} (確度${Math.round(t.confidence * 100)}%)`)
                .join(', ')
        );
    }

    if (c.emotional_trend) {
        parts.push(`感情傾向: ${c.emotional_trend.slice(0, 100)}`);
    }

    if (c.active_behaviors.length > 0) {
        parts.push(
            '行動特性: ' +
            c.active_behaviors
                .map((b) => `${b.title} (確度${Math.round(b.confidence * 100)}%)`)
                .join(', ')
        );
    }

    if (c.last_reflection) {
        parts.push(`最近の気づき: ${c.last_reflection.title}`);
    }

    parts.push(`\n※この情報は参考です。ユーザーは日々変化します。`);
    parts.push(`記憶数: ${c.memory_count}件`);

    return parts.join('\n');
}