"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function recordMemoryInteraction(itemId: string, type: "view" | "click") {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  const item = await prisma.contentItem.findUnique({
    where: { id: itemId, userId: session.user.id },
    select: { metadata: true }
  });

  if (!item) return { success: false };

  // Parse existing metadata
  const currentMetadata = typeof item.metadata === "object" && item.metadata !== null 
    ? item.metadata as Record<string, any> 
    : {};

  // Increment counters
  if (type === "view") {
    currentMetadata.viewCount = (typeof currentMetadata.viewCount === "number" ? currentMetadata.viewCount : 0) + 1;
  } else if (type === "click") {
    currentMetadata.clickCount = (typeof currentMetadata.clickCount === "number" ? currentMetadata.clickCount : 0) + 1;
  }

  // Update DB
  await prisma.contentItem.update({
    where: { id: itemId },
    data: { metadata: currentMetadata }
  });

  return { success: true };
}

export async function trackRelatedMemoryClick(itemId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  const item = await prisma.contentItem.findUnique({
    where: { id: itemId, userId: session.user.id },
    select: { metadata: true }
  });

  if (!item) return { success: false };

  const currentMetadata = typeof item.metadata === "object" && item.metadata !== null 
    ? item.metadata as Record<string, any> 
    : {};

  currentMetadata.relatedClicks = (typeof currentMetadata.relatedClicks === "number" ? currentMetadata.relatedClicks : 0) + 1;

  await prisma.contentItem.update({
    where: { id: itemId },
    data: { metadata: currentMetadata }
  });

  return { success: true };
}
