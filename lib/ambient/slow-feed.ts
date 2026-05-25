import { prisma } from "@/lib/prisma";
import { SlowFeedEntryInfo, SlowFeedEntryType } from "./types";

export async function getSlowFeed(
    userId: string,
    limit: number = 20,
    includeRead: boolean = false
): Promise<SlowFeedEntryInfo[]> {
    const where: any = { userId };
    if (!includeRead) where.isRead = false;

    const entries = await prisma.slowFeedEntry.findMany({
        where,
        orderBy: [{ priority: "desc" }, { surfacedAt: "desc" }],
        take: limit,
    });

    return entries.map((e) => ({
        id: e.id,
        entryType: e.entryType as SlowFeedEntryType,
        title: e.title,
        content: e.content,
        sourceType: e.sourceType,
        sourceId: e.sourceId,
        isRead: e.isRead,
        isSaved: e.isSaved,
        confidence: e.confidence,
        priority: e.priority,
        surfacedAt: e.surfacedAt,
        readAt: e.readAt,
        createdAt: e.createdAt,
    }));
}

export async function markFeedEntryRead(entryId: string): Promise<void> {
    await prisma.slowFeedEntry.update({
        where: { id: entryId },
        data: { isRead: true, readAt: new Date() },
    });
}

export async function toggleFeedEntrySaved(entryId: string): Promise<void> {
    const entry = await prisma.slowFeedEntry.findUnique({
        where: { id: entryId },
        select: { isSaved: true },
    });
    if (!entry) return;

    await prisma.slowFeedEntry.update({
        where: { id: entryId },
        data: { isSaved: !entry.isSaved },
    });
}

export async function getUnreadFeedCount(userId: string): Promise<number> {
    return prisma.slowFeedEntry.count({
        where: { userId, isRead: false },
    });
}

export async function clearOldFeedEntries(
    userId: string,
    olderThanDays: number = 30
): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const result = await prisma.slowFeedEntry.deleteMany({
        where: {
            userId,
            createdAt: { lt: cutoff },
            isRead: true,
        },
    });
    return result.count;
}