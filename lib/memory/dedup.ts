import crypto from 'crypto';
import { prisma } from '../prisma';

export function createFingerprint(content: string): string {
    return crypto.createHash('sha256').update(content.trim()).digest('hex');
}

export async function findDuplicates(
    userId: string,
    content: string,
    type?: string
): Promise<{ isDuplicate: boolean; existingId?: string; confidence?: number }> {
    const fingerprint = createFingerprint(content);

    // Exact fingerprint match
    const exactMatch = await prisma.userMemory.findUnique({
        where: { fingerprint },
    });

    if (exactMatch && exactMatch.userId === userId) {
        return {
            isDuplicate: true,
            existingId: exactMatch.id,
            confidence: exactMatch.confidence,
        };
    }

    // Fuzzy match: same user, same type, similar content (using simple text overlap)
    if (type) {
        const similar = await prisma.userMemory.findMany({
            where: {
                userId,
                type: type as any,
                confidence: { gte: 0.3 },
            },
            select: { id: true, title: true, confidence: true },
            take: 20,
        });

        for (const mem of similar) {
            const overlap = calculateTextOverlap(content, mem.title);
            if (overlap > 0.8) {
                return {
                    isDuplicate: true,
                    existingId: mem.id,
                    confidence: mem.confidence,
                };
            }
        }
    }

    return { isDuplicate: false };
}

function calculateTextOverlap(a: string, b: string): number {
    const wordsA = new Set(a.split(/[\s,。、]+/));
    const wordsB = new Set(b.split(/[\s,。、]+/));
    const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
}

// Prune stale memories: confidence < threshold and untouched for N days
export async function pruneStaleMemories(
    userId: string,
    threshold: number = 0.3,
    daysOld: number = 30
): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const result = await prisma.userMemory.updateMany({
        where: {
            userId,
            confidence: { lt: threshold },
            updatedAt: { lt: cutoff },
        },
        data: {
            confidence: 0.0, // Mark as archived (not deleted, for safety)
        },
    });

    return result.count;
}