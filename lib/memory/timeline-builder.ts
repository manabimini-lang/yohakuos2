import { prisma } from "@/lib/prisma";
import { CONTENT_ITEM_SAFE_SELECT } from "@/lib/content-item-safe-select";
import type { ContentCardItem } from "@/components/capture/ContentCard";

export interface TimelineMonth {
  year: number;
  month: number;
  items: ContentCardItem[];
  themes: string[]; // Mocked or derived themes for the month
}

export async function buildMemoryTimeline(
  userId: string
): Promise<TimelineMonth[]> {
  try {
    const allItems = await prisma.contentItem.findMany({
      where: {
        userId,
        memoryState: "active",
      },
      select: CONTENT_ITEM_SAFE_SELECT,
      orderBy: { createdAt: "desc" },
    });

    const timelineMap = new Map<string, TimelineMonth>();

    for (const item of allItems) {
      const date = new Date(item.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!timelineMap.has(key)) {
        timelineMap.set(key, {
          year,
          month,
          items: [],
          themes: [],
        });
      }

      timelineMap.get(key)!.items.push(item);
    }

    const result = Array.from(timelineMap.values());

    // For each month, dynamically extract top tags as a "quiet theme" fallback
    // In the future, this can be connected to `MemorySnapshot` of type `monthly`
    for (const monthData of result) {
      const tagCounts: Record<string, number> = {};
      for (const item of monthData.items) {
        if (item.aiTags) {
          for (const tag of item.aiTags) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        }
      }

      const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([tag]) => tag)
        .slice(0, 3);

      monthData.themes = sortedTags;
    }

    return result;
  } catch (error) {
    console.error("Failed to build memory timeline:", error);
    return [];
  }
}
