import { prisma } from '../prisma';
import { generateJSON } from '../ai/gemini';
import { REFLECTION_PROMPT, PROMPT_VERSION } from '../ai/prompts/reflection';
import { registerJobHandler } from './queue';

interface ReflectionResult {
    title: string;
    observation: string;
    gentle_suggestion?: string;
    confidence: number;
}

async function generateReflection(userId: string): Promise<void> {
    // 1. Get recent memory changes (last 7 days)
    const recentMemories = await prisma.userMemory.findMany({
        where: {
            userId,
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            confidence: { gte: 0.3 },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
    });

    if (recentMemories.length < 3) return; // Not enough data

    // 2. Get learning bias (which types are most common?)
    const typeCounts = recentMemories.reduce(
        (acc, m) => {
            acc[m.type] = (acc[m.type] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>
    );
    const dominantTypes = Object.entries(typeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([type, count]) => `${type}(${count}件)`);

    // 3. Get sentiment trend from reflections
    const recentReflections = await prisma.reflection.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { sentiment: true, content: true },
    });

    // 4. Build prompt
    const input = recentMemories.map(r => 
        `[${r.type}] ${r.title} (confidence: ${r.confidence})\n${(r.content || "") || ''}\n`
    ).join('---\n');
    const learningBias = dominantTypes.join(', ') || '分散';
    const sentimentTrend =
        recentReflections
            .map((r) => `[${r.sentiment || 'neutral'}] ${(r.content || "").slice(0, 50)}`)
            .join('\n') || 'まだ十分なデータがありません';
    const behaviorContinuity = recentMemories
        .filter((m) => m.type === 'behavior_pattern' || m.type === 'habit')
        .map((m) => m.title)
        .join(', ');

    const prompt = REFLECTION_PROMPT
        .replace('{{recentChanges}}', input)
        .replace('{{learningBias}}', learningBias)
        .replace('{{sentimentTrend}}', sentimentTrend)
        .replace('{{behaviorContinuity}}', behaviorContinuity || 'まだ十分なデータがありません');

    // 5. AI generation
    try {
        const { data } = await generateJSON<ReflectionResult>(prompt);

        // 6. Save reflection
        const triggeredBy = recentMemories.map((m) => m.id);
        await prisma.reflection.create({
            data: {
                userId,
                title: data.title,
                content: data.observation,
                reflectionText: data.observation,
                type: 'insight',
                triggeredBy,
                confidence: Math.min(data.confidence, 0.95),
                promptVersion: PROMPT_VERSION,
            },
        });

        // If there's a gentle suggestion, create it as a separate insight
        if (data.gentle_suggestion && data.gentle_suggestion.length > 0) {
            await prisma.reflection.create({
                data: {
                    userId,
                    title: 'そっとした提案',
                    content: data.gentle_suggestion,
                    reflectionText: data.gentle_suggestion,
                    type: 'insight',
                    triggeredBy,
                    confidence: Math.min(data.confidence * 0.8, 0.7),
                    promptVersion: PROMPT_VERSION,
                },
            });
        }
    } catch (error) {
        console.error('Reflection generation failed:', error);
        // Non-critical: reflection failure should not be blocking
    }
}

export async function getLatestReflections(
    userId: string,
    limit: number = 10
) {
    return prisma.reflection.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
            id: true,
            title: true,
            content: true,
            type: true,
            sentiment: true,
            confidence: true,
            createdAt: true,
        },
    });
}

// Register handler for queue
registerJobHandler('reflection', async (job) => {
    await generateReflection(job.userId);
});

export { generateReflection };