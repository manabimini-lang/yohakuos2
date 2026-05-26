"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getRelatedContent(contentItemId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];

    const currentItem = await prisma.contentItem.findUnique({
      where: { id: contentItemId, userId: session.user.id },
      select: { aiTags: true, contentType: true },
    });

    if (!currentItem) return [];

    // Find items with similar tags or same content type
    // Simple implementation for Phase 2: exact match on tags or contentType
    // In Phase 3, this will use pgvector for semantic search
    const relatedItems = await prisma.contentItem.findMany({
      where: {
        userId: session.user.id,
        id: { not: contentItemId },
        OR: [
          {
            aiTags: {
              hasSome: currentItem.aiTags && currentItem.aiTags.length > 0 ? currentItem.aiTags : [""],
            },
          },
          {
            contentType: currentItem.contentType ?? "unknown_type",
          },
        ],
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    return relatedItems;
  } catch (error) {
    console.error("Failed to get related content:", error);
    return [];
  }
}
