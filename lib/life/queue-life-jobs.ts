import { prisma } from "@/lib/prisma";
import { checkAIAvailability } from "@/lib/ai/gemini";

/**
 * Queue-based Life OS Job Enqueueing
 * 
 * 人生分析は async nightly queue で実行。
 */

export async function enqueueLifeThemesGeneration(
  userId: string
): Promise<void> {
  const now = new Date();

  // Check if we already have a pending job
  const existingJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "generate_life_themes",
      status: "pending",
    },
  });

  if (existingJob) {
    return; // Skip if already queued
  }

  // Check if we've run this recently (within 24 hours)
  const recentJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "generate_life_themes",
      status: "completed",
      completedAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { completedAt: "desc" },
  });

  if (recentJob) {
    return; // Skip if already ran recently
  }

  // Enqueue new life themes generation job
  await prisma.aIJob.create({
    data: {
      userId,
      jobType: "generate_life_themes",
      status: "pending",
      priority: 2, // Lower priority than content analysis
      input: { type: "life_themes_analysis" },
      maxRetries: 2,
    },
  });
}

export async function enqueuePhilosophyFragmentsExtraction(
  userId: string
): Promise<void> {
  const now = new Date();

  // Check if already queued
  const existingJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "generate_philosophy_fragments",
      status: "pending",
    },
  });

  if (existingJob) {
    return;
  }

  // Check if recently completed (within 48 hours)
  const recentJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "generate_philosophy_fragments",
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
      jobType: "generate_philosophy_fragments",
      status: "pending",
      priority: 2,
      input: { type: "philosophy_extraction" },
      maxRetries: 2,
    },
  });
}

export async function enqueueMemoryGraphUpdate(
  userId: string
): Promise<void> {
  const now = new Date();

  const existingJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "generate_memory_edges",
      status: "pending",
    },
  });

  if (existingJob) {
    return;
  }

  const recentJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "generate_memory_edges",
      status: "completed",
      completedAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { completedAt: "desc" },
  });

  if (recentJob) {
    return;
  }

  await prisma.aIJob.create({
    data: {
      userId,
      jobType: "generate_memory_edges",
      status: "pending",
      priority: 1,
      input: { type: "memory_graph_update" },
      maxRetries: 2,
    },
  });
}

export async function enqueueDailyRitualGeneration(
  userId: string
): Promise<void> {
  const now = new Date();

  const existingJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "generate_daily_ritual",
      status: "pending",
    },
  });

  if (existingJob) {
    return;
  }

  const recentJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "generate_daily_ritual",
      status: "completed",
      completedAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { completedAt: "desc" },
  });

  if (recentJob) {
    return;
  }

  await prisma.aIJob.create({
    data: {
      userId,
      jobType: "generate_daily_ritual",
      status: "pending",
      priority: 2,
      input: { type: "daily_ritual_generation" },
      maxRetries: 2,
    },
  });
}

export async function enqueueReturningThemesDetection(
  userId: string
): Promise<void> {
  const now = new Date();

  // Check if already queued
  const existingJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "detect_returning_themes",
      status: "pending",
    },
  });

  if (existingJob) {
    return;
  }

  // Check if recently completed (within 72 hours - slower cadence)
  const recentJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "detect_returning_themes",
      status: "completed",
      completedAt: { gte: new Date(now.getTime() - 72 * 60 * 60 * 1000) },
    },
    orderBy: { completedAt: "desc" },
  });

  if (recentJob) {
    return;
  }

  await prisma.aIJob.create({
    data: {
      userId,
      jobType: "detect_returning_themes",
      status: "pending",
      priority: 2,
      input: { type: "returning_themes_detection" },
      maxRetries: 2,
    },
  });
}

export async function enqueueLegacySnapshotGeneration(
  userId: string
): Promise<void> {
  const now = new Date();

  const existingJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "generate_legacy_snapshot",
      status: "pending",
    },
  });

  if (existingJob) {
    return;
  }

  const recentJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "generate_legacy_snapshot",
      status: "completed",
      completedAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { completedAt: "desc" },
  });

  if (recentJob) {
    return;
  }

  await prisma.aIJob.create({
    data: {
      userId,
      jobType: "generate_legacy_snapshot",
      status: "pending",
      priority: 2,
      input: { type: "legacy_snapshot" },
      maxRetries: 2,
    },
  });
}

export async function enqueueLifeChaptersGeneration(
  userId: string
): Promise<void> {
  const now = new Date();

  const existingJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "generate_life_chapters",
      status: "pending",
    },
  });

  if (existingJob) {
    return;
  }

  const recentJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "generate_life_chapters",
      status: "completed",
      completedAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { completedAt: "desc" },
  });

  if (recentJob) {
    return;
  }

  await prisma.aIJob.create({
    data: {
      userId,
      jobType: "generate_life_chapters",
      status: "pending",
      priority: 2,
      input: { type: "life_chapters" },
      maxRetries: 2,
    },
  });
}

export async function enqueueInnerLandscapeGeneration(userId: string, period?: string): Promise<void> {
  const now = new Date();

  const existingJob = await prisma.aIJob.findFirst({
    where: { userId, jobType: "generate_inner_landscape", status: "pending" },
  });
  if (existingJob) return;

  const recentJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "generate_inner_landscape",
      status: "completed",
      completedAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { completedAt: "desc" },
  });
  if (recentJob) return;

  await prisma.aIJob.create({
    data: {
      userId,
      jobType: "generate_inner_landscape",
      status: "pending",
      priority: 2,
      input: { type: "inner_landscape", period: period || null },
      maxRetries: 2,
    },
  });
}

export async function enqueueReturningQuestionsExtraction(userId: string): Promise<void> {
  const now = new Date();

  const existingJob = await prisma.aIJob.findFirst({
    where: { userId, jobType: "returning_questions", status: "pending" },
  });
  if (existingJob) return;

  const recentJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "returning_questions",
      status: "completed",
      completedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { completedAt: "desc" },
  });
  if (recentJob) return;

  await prisma.aIJob.create({
    data: {
      userId,
      jobType: "returning_questions",
      status: "pending",
      priority: 2,
      input: { type: "returning_questions" },
      maxRetries: 2,
    },
  });
}

export async function enqueueResonanceWeatherGeneration(userId: string): Promise<void> {
  const now = new Date();

  const existingJob = await prisma.aIJob.findFirst({
    where: { userId, jobType: "resonance_weather", status: "pending" },
  });
  if (existingJob) return;

  const recentJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "resonance_weather",
      status: "completed",
      completedAt: { gte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { completedAt: "desc" },
  });
  if (recentJob) return;

  await prisma.aIJob.create({
    data: {
      userId,
      jobType: "resonance_weather",
      status: "pending",
      priority: 2,
      input: { type: "resonance_weather" },
      maxRetries: 2,
    },
  });
}

/**
 * Smart enqueueing: only if user has enough data and AI is enabled
 */
export async function maybeEnqueueLifeOSJobs(userId: string): Promise<void> {
  // Check if AI is enabled
  const hasAiConnection = await checkAIAvailability(userId);

  if (!hasAiConnection) {
    return; // Skip if AI disabled
  }

  // Check if user has enough recorded items (>20 for meaningful patterns)
  const itemCount = await prisma.contentItem.count({
    where: {
      userId,
      memoryState: "active",
    },
  });

  if (itemCount < 20) {
    return; // Not enough data yet
  }

  // Check if user has been active recently (within 7 days)
  const recentActivity = await prisma.contentItem.findFirst({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });

  if (!recentActivity) {
    return; // No recent activity
  }

  // Enqueue all life OS jobs
  await Promise.all([
    enqueueLifeThemesGeneration(userId),
    enqueuePhilosophyFragmentsExtraction(userId),
    enqueueMemoryGraphUpdate(userId),
    enqueueDailyRitualGeneration(userId),
    enqueueReturningThemesDetection(userId),
    enqueueLegacySnapshotGeneration(userId),
    enqueueLifeChaptersGeneration(userId),
    enqueueInnerLandscapeGeneration(userId),
    enqueueReturningQuestionsExtraction(userId),
    enqueueResonanceWeatherGeneration(userId),
  ]);
}
