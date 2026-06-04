import { prisma } from "@/lib/prisma";
import { getStarterJourneyStatus } from "@/lib/ai/starter-journey";
import { enqueueArchiveRevisitGeneration } from "./archive-revisit";
import { checkAIAvailability } from "@/lib/ai/gemini";

/**
 * Queue-based Return Job Enqueueing
 * 
 * 不要な再計算を避けるため、
 * 静かな戻りの検出も非同期ジョブ化。
 */

export async function enqueueReturnFragmentDetection(
  userId: string
): Promise<void> {
  const now = new Date();

  // Check if we already have a pending return job
  const existingJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "detect_returning_fragments",
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
      jobType: "detect_returning_fragments",
      status: "completed",
      completedAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { completedAt: "desc" },
  });

  if (recentJob) {
    return; // Skip if already ran recently
  }

  // Enqueue new return fragment detection job
  await prisma.aIJob.create({
    data: {
      userId,
      jobType: "detect_returning_fragments",
      status: "pending",
      priority: 2, // Lower priority than content analysis
      input: { type: "return_fragment_detection" },
      maxRetries: 3,
    },
  });
}

export async function enqueueTemporalEchoDetection(
  userId: string
): Promise<void> {
  const now = new Date();

  // Check if we already have a pending job
  const existingJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "detect_temporal_echoes",
      status: "pending",
    },
  });

  if (existingJob) {
    return;
  }

  // Check if we've run this recently (within 48 hours)
  const recentJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "detect_temporal_echoes",
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
      jobType: "detect_temporal_echoes",
      status: "pending",
      priority: 2,
      input: { type: "temporal_echo_detection" },
      maxRetries: 3,
    },
  });
}

export async function enqueueResurfacingDetection(
  userId: string
): Promise<void> {
  const now = new Date();

  // Check if already queued
  const existingJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "detect_calm_resurfacing",
      status: "pending",
    },
  });

  if (existingJob) {
    return;
  }

  // Check if recently completed (within 36 hours)
  const recentJob = await prisma.aIJob.findFirst({
    where: {
      userId,
      jobType: "detect_calm_resurfacing",
      status: "completed",
      completedAt: { gte: new Date(now.getTime() - 36 * 60 * 60 * 1000) },
    },
    orderBy: { completedAt: "desc" },
  });

  if (recentJob) {
    return;
  }

  await prisma.aIJob.create({
    data: {
      userId,
      jobType: "detect_calm_resurfacing",
      status: "pending",
      priority: 2,
      input: { type: "resurfacing_detection" },
      maxRetries: 3,
    },
  });
}

/**
 * Smart enqueueing: only if user has enough data and AI is enabled
 */
export async function maybeEnqueueReturnJobs(userId: string): Promise<void> {
  // Check AI availability: user_ai_settings / OAuth / Legacy 統一判定
  const aiResult = await checkAIAvailability(userId);
  const starterJourney = await getStarterJourneyStatus(userId);
  const starterJourneyActive = starterJourney.active;

  console.log("[AI_AVAILABILITY]", {
    userId,
    available: aiResult.available || starterJourneyActive,
    source: aiResult.available ? aiResult.source : starterJourneyActive ? "starter" : null,
  });

  if (!aiResult.available && !starterJourneyActive) {
    return; // Skip if AI disabled and no starter journey active
  }

  const itemCount = await prisma.contentItem.count({
    where: {
      userId,
      memoryState: "active",
    },
  });

  if (starterJourneyActive) {
    if (itemCount < 3) {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const oldItem = await prisma.contentItem.findFirst({
        where: {
          userId,
          createdAt: { lte: twoDaysAgo },
        },
      });

      if (!oldItem) {
        return;
      }
    }
  } else if (itemCount < 20) {
    return; // Not enough data yet
  }

  const recentActivity = await prisma.contentItem.findFirst({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });

  if (!recentActivity) {
    return; // No recent activity
  }

  await Promise.all([
    enqueueReturnFragmentDetection(userId),
    enqueueTemporalEchoDetection(userId),
    enqueueResurfacingDetection(userId),
    enqueueArchiveRevisitGeneration(userId),
  ]);
}
