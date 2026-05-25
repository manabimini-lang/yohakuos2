import { prisma } from '../prisma';
import { generateJSON } from '../ai/gemini';
import { registerJobHandler, enqueueJob } from './queue';

interface RelationJudgment {
    fromId: string;
    toId: string;
    relation: 'supports' | 'contradicts' | 'causes' | 'results_in' | 'similar_to' | 'evolved_to' | 'influenced_by';
    strength: number;
}

async function updateMemoryGraph(
    userId: string,
    newMemoryIds: string[]
): Promise<void> {
    if (newMemoryIds.length === 0) return;

    // 1. Get new memories
    const newMemories = await prisma.userMemory.findMany({
        where: { id: { in: newMemoryIds } },
    });

    // 2. Get existing high-confidence memories for relation candidates
    const existingMemories = await prisma.userMemory.findMany({
        where: {
            userId,
            id: { notIn: newMemoryIds },
            confidence: { gte: 0.3 },
        },
        orderBy: { confidence: 'desc' },
        take: 30,
    });

    if (existingMemories.length === 0) return;

    // 3. Batch relation judgment via AI
    const newSummary = newMemories
        .map((m) => `[ID:${m.id}] [${m.type}] ${m.title}: ${m.content.slice(0, 100)}`)
        .join('\n');
    const existingSummary = existingMemories
        .map((m) => `[ID:${m.id}] [${m.type}] ${m.title}`)
        .join('\n');

    const prompt = `あなたはメモリーグラフの関係性判断エキスパートです。
新しい記憶と既存の記憶の間の関係を判断してください。

新しい記憶:
${newSummary}

既存の記憶:
${existingSummary}

ルール:
- 本当に関連があるペアのみを出力
- 関連の強さ (strength) を0.0~1.0で評価
- 最大10ペアまで
- 関係タイプ: supports, contradicts, causes, results_in, similar_to, evolved_to, influenced_by

出力形式（JSONのみ）:
{
  "relations": [
    {
      "fromId": "新しい記憶のID",
      "toId": "既存の記憶のID",
      "relation": "supports",
      "strength": 0.8
    }
  ]
}`;

    try {
        const { data } = await generateJSON<{ relations: RelationJudgment[] }>(prompt);
        const relations = data.relations || [];

        // 4. Create edges
        for (const rel of relations) {
            if (rel.strength < 0.3) continue;

            try {
                await prisma.memoryGraphEdge.upsert({
                    where: {
                        fromMemoryId_toMemoryId_relation: {
                            fromMemoryId: rel.fromId,
                            toMemoryId: rel.toId,
                            relation: rel.relation,
                        },
                    },
                    update: { strength: rel.strength },
                    create: {
                        fromMemoryId: rel.fromId,
                        toMemoryId: rel.toId,
                        relation: rel.relation,
                        strength: rel.strength,
                        userId,
                    },
                });
            } catch {
                // Skip if IDs don't exist (race condition)
                continue;
            }
        }
    } catch (error) {
        console.error('Graph update failed:', error);
        // Non-critical: graph update failure should not block the pipeline
    }
}

// Register handler
registerJobHandler('graph_update', async (job) => {
    const { memoryIds } = job.input as { memoryIds: string[] };
    await updateMemoryGraph(job.userId, memoryIds);
});

export { updateMemoryGraph };

// Query helpers for UI

export async function getMemoryGraph(userId: string, limit: number = 50) {
    const edges = await prisma.memoryGraphEdge.findMany({
        where: { userId },
        include: {
            fromMemory: {
                select: { id: true, type: true, title: true, confidence: true },
            },
            toMemory: {
                select: { id: true, type: true, title: true, confidence: true },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });

    const nodes = new Map<string, any>();
    const graphEdges = edges.map((e) => {
        // Add nodes
        if (!nodes.has(e.fromMemory.id)) {
            nodes.set(e.fromMemory.id, { ...e.fromMemory, id: e.fromMemory.id });
        }
        if (!nodes.has(e.toMemory.id)) {
            nodes.set(e.toMemory.id, { ...e.toMemory, id: e.toMemory.id });
        }

        return {
            id: e.id,
            source: e.fromMemoryId,
            target: e.toMemoryId,
            relation: e.relation,
            strength: e.strength,
        };
    });

    return {
        nodes: Array.from(nodes.values()),
        edges: graphEdges,
    };
}