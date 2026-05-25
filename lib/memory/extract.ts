import { prisma } from '../prisma';
import { generateJSON } from '../ai/gemini';
import { EXTRACT_MEMORY_PROMPT, PROMPT_VERSION } from '../ai/prompts/memory';
import { createFingerprint, findDuplicates } from './dedup';
import { sanitizeMemoryContent, sanitizeConfidence } from './ethics';
import { estimateCost, estimateTokenCount } from './cost';
import { enqueueJob } from './queue';

interface MemoryExtractionResult {
    values: Array<{ title: string; content: string; confidence: number }>;
    beliefs: Array<{ title: string; content: string; confidence: number }>;
    emotional_patterns: Array<{ title: string; content: string; confidence: number }>;
    behavior_patterns: Array<{ title: string; content: string; confidence: number }>;
    learning_styles: Array<{ title: string; content: string; confidence: number }>;
    life_themes: Array<{ title: string; content: string; confidence: number }>;
}

const MEMORY_TYPE_MAP: Record<string, string> = {
    values: 'value',
    beliefs: 'belief',
    emotional_patterns: 'emotional_pattern',
    behavior_patterns: 'behavior_pattern',
    learning_styles: 'learning_style',
    life_themes: 'life_theme',
};

async function extractMemories(cardId: string, userId: string): Promise<void> {
    const card = await prisma.knowledgeCard.findUnique({
        where: { id: cardId },
    });

    if (!card) throw new Error(`KnowledgeCard not found: ${cardId}`);

    // 1. Get existing memories for context (top 20 by confidence)
    const existingMemories = await prisma.userMemory.findMany({
        where: { userId, confidence: { gte: 0.3 } },
        orderBy: { confidence: 'desc' },
        take: 20,
        select: { title: true, type: true },
    });

    // 2. Token optimization: trim content to 2000 tokens
    const trimmedContent = card.content.slice(0, 8000); // ~2000 tokens
    const existingSummary = existingMemories
        .map((m) => `[${m.type}] ${m.title}`)
        .join('\n');

    // 3. AI Extraction
    const prompt = EXTRACT_MEMORY_PROMPT
        .replace('{{cardContent}}', trimmedContent)
        .replace('{{existingMemories}}', existingSummary || '（まだありません）');

    const { data, usage } = await generateJSON<MemoryExtractionResult>(prompt);

    // 4. Cost tracking
    const inputTokens = estimateTokenCount(prompt);
    const outputTokens = estimateTokenCount(usage.text);
    const cost = estimateCost(inputTokens, outputTokens);

    // 5. Save each extraction as UserMemory
    const createdMemories: string[] = [];

    for (const [key, items] of Object.entries(data)) {
        const memoryType = MEMORY_TYPE_MAP[key];
        if (!memoryType || !items || items.length === 0) continue;

        for (const item of items) {
            // Skip low confidence
            if (item.confidence < 0.3) continue;

            // Sanitize
            const sanitizedContent = sanitizeMemoryContent(item.content);
            const safeConfidence = sanitizeConfidence(item.confidence);

            // Dedup
            const dup = await findDuplicates(userId, item.title + item.content, memoryType);
            if (dup.isDuplicate) {
                // Update confidence if higher
                if (dup.existingId && safeConfidence > (dup.confidence || 0)) {
                    await prisma.userMemory.update({
                        where: { id: dup.existingId },
                        data: { confidence: safeConfidence, promptVersion: PROMPT_VERSION },
                    });
                }
                continue;
            }

            // Create memory
            const memory = await prisma.userMemory.create({
                data: {
                    userId,
                    type: memoryType as any,
                    title: item.title,
                    content: sanitizedContent,
                    confidence: safeConfidence,
                    fingerprint: createFingerprint(item.title + item.content),
                    sourceCardId: card.id,
                    promptVersion: PROMPT_VERSION,
                },
            });

            createdMemories.push(memory.id);

            // Link card to memory
            await prisma.memorySource.create({
                data: {
                    memoryId: memory.id,
                    cardId: card.id,
                },
            });
        }
    }

    // 6. Update AIJob with cost info
    await prisma.aIJob.updateMany({
        where: { userId, jobType: 'memory_extract', status: 'processing' },
        data: {
            tokenUsed: usage.tokenUsed,
            costEstimate: cost.estimatedCostUSD,
        },
    });

    // 7. Enqueue graph update if memories were created
    if (createdMemories.length > 0) {
        await enqueueJob({
            userId,
            jobType: 'graph_update',
            input: { memoryIds: createdMemories },
            priority: 0,
        });
    }
}

// Register handler for queue
import { registerJobHandler } from './queue';

registerJobHandler('memory_extract', async (job) => {
    const { cardId } = job.input as { cardId: string };
    await extractMemories(cardId, job.userId);
});

export { extractMemories };