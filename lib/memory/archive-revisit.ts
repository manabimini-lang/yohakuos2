import { prisma } from "@/lib/prisma";
import { computeMemoryResurfacing } from "./memory-resurfacer";

export async function computeArchiveRevisits(userId: string) {
  try {
    const archiveCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const recentWindow = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const candidateItems = await prisma.contentItem.findMany({
      where: {
        userId,
        memoryState: "active",
        createdAt: { lte: archiveCutoff },
      },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    for (const item of candidateItems) {
      const existingResurfacing = await prisma.memoryResurfacing.findFirst({
        where: {
          userId,
          sourceContentId: item.id,
          createdAt: { gte: recentWindow },
        },
      });

      if (existingResurfacing) {
        continue;
      }

      await computeMemoryResurfacing(userId, item.id);
    }
  } catch (error) {
    console.error("Failed to compute archive revisits:", error);
  }
}

export async function enqueueArchiveRevisitGeneration(userId: string): Promise<void> {
  const now = new Date();

  const existingJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "generate_archive_revisits",
      status: "pending",
    },
  });

  if (existingJob) {
    return;
  }

  const recentJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "generate_archive_revisits",
      status: "completed",
      completedAt: { gte: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
    },
    orderBy: { completedAt: "desc" },
  });

  if (recentJob) {
    return;
  }

  await prisma.aIJob.create({
    data: {
      userId,
      jobType: "generate_archive_revisits",
      status: "pending",
      priority: 2,
      input: { type: "archive_revisit" },
      maxRetries: 3,
    },
  });
}
