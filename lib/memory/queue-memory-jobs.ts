/**
 * Queue memory-related jobs for async processing
 */

import { prisma } from "@/lib/prisma";

export async function enqueueMemorySnapshot(userId: string) {
  try {
    await prisma.aIJob.create({
      data: {
        userId,
        jobType: "generate_memory_snapshot",
        status: "pending",
        input: {
          periodDays: 30,
        },
      },
    });
    console.log("[queue-memory] Enqueued memory snapshot");
  } catch (err) {
    console.error("[queue-memory] Failed to enqueue snapshot:", err);
  }
}

export async function enqueueWeeklyReflection(userId: string) {
  try {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // Check if reflection for this week already exists
    const existing = await prisma.weeklyReflection.findFirst({
      where: {
        userId,
        weekStart,
      },
    });

    if (existing) {
      console.log("[queue-memory] Weekly reflection already exists for this week");
      return;
    }

    await prisma.aIJob.create({
      data: {
        userId,
        jobType: "generate_weekly_reflection",
        status: "pending",
        input: {
          weekStart: weekStart.toISOString(),
        },
      },
    });
    console.log("[queue-memory] Enqueued weekly reflection");
  } catch (err) {
    console.error("[queue-memory] Failed to enqueue weekly reflection:", err);
  }
}

/**
 * Maybe enqueue both jobs if eligible
 * Called after content save completes
 */
export async function maybeEnqueueMemoryJobs(userId: string) {
  try {
    // Check if we should generate these jobs
    const lastSnapshot = await prisma.memorySnapshot.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const lastWeeklyReflection = await prisma.weeklyReflection.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Enqueue snapshot if older than 24 hours
    if (!lastSnapshot || new Date().getTime() - lastSnapshot.createdAt.getTime() > 24 * 60 * 60 * 1000) {
      await enqueueMemorySnapshot(userId);
    }

    // Enqueue weekly reflection if it doesn't exist for this week
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    if (!lastWeeklyReflection || lastWeeklyReflection.weekStart < weekStart) {
      await enqueueWeeklyReflection(userId);
    }
  } catch (err) {
    console.error("[queue-memory] Error in maybeEnqueueMemoryJobs:", err);
  }
}
