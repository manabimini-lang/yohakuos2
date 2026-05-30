import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { processAIAnalysis } from "@/app/actions/ai-processing";
import { generateReflectionScript } from "@/lib/audio/generate-reflection-script";
import { generateQuietAudio } from "@/lib/audio/gemini-tts";
import {
  detectReturningFragments,
  detectTemporalEchoes,
  detectCalmResurfacing,
} from "@/lib/memory/return-engine";
import { computeArchiveRevisits } from "@/lib/memory/archive-revisit";
import { generateMemoryEdges } from "@/lib/memory/graph";
import { generateDailyRitual } from "@/lib/memory/ritual";
import { generateLegacySnapshot } from "@/lib/legacy/legacy-engine";
import {
  extractLifeThemes,
  detectReturningThemes,
  extractPhilosophyFragments,
} from "@/lib/life/life-themes-engine";
import "@/lib/companion/queue";
import { registerLifeOSJobHandlers } from "@/lib/lifeos/queue";
import { registerAmbientJobHandlers } from "@/lib/ambient/queue";
import { processQueueBatch } from "@/lib/memory/queue";

export const dynamic = "force-dynamic";

const MAX_CONTENT_ANALYSIS_PER_CRON = 3;
const MAX_AUDIO_REFLECTION_PER_CRON = 1; // Quiet practice: 1 reflection per cron
const MAX_RETURN_DETECTION_PER_CRON = 1; // Quiet return detection happens slowly
const MAX_LIFE_OS_JOBS_PER_CRON = 1; // Life OS analysis is nightly, quiet
const MAX_CONCURRENT_REFLECTIONS_PER_USER = 1;

function getRetryDelayMinutes(retryCount: number): number {
  switch (retryCount) {
    case 1: return 5;
    case 2: return 15;
    case 3: return 60;
    case 4: return 360;
    case 5: return 1440;
    default: return 1440; // 24 hours
  }
}

export async function GET(request: Request) {
  // Validate CRON_SECRET to prevent unauthorized access
  const authHeader = request.headers.get("Authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (process.env.NODE_ENV === "production") {
    if (!authHeader) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    try {
      const a = Buffer.from(authHeader);
      const b = Buffer.from(expectedAuth);
      
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    } catch (err) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  try {
    registerLifeOSJobHandlers();
    registerAmbientJobHandlers();

    console.log("CRON INVOKED", {
      now: new Date().toISOString(),
      env: process.env.NODE_ENV,
    });

    // Process content analysis jobs (priority 1)
    const contentJobs = await prisma.aIJob.findMany({
      where: {
        jobType: "content_analysis",
        status: "pending",
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: new Date() } }
        ]
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "asc" },
      ],
      take: MAX_CONTENT_ANALYSIS_PER_CRON,
    });

    let processedContentCount = 0;
    for (const job of contentJobs) {
      console.log("JOB PICKED", {
        jobId: job.id,
        jobType: job.jobType,
        userId: job.userId,
        content: job.input,
      });

      const updatedJob = await prisma.aIJob.updateMany({
        where: { id: job.id, status: "pending" },
        data: {
          status: "processing",
          startedAt: new Date(),
        },
      });

      if (updatedJob.count === 0) continue;

      try {
        const contentItemId = (job.input as any)?.contentItemId;
        if (contentItemId) {
          await processAIAnalysis(contentItemId, job.userId);
        }
        
        await prisma.aIJob.update({
          where: { id: job.id },
          data: { status: "completed", completedAt: new Date() }
        });
        processedContentCount++;
      } catch (err: any) {
        console.error("JOB PROCESSING FAILED", {
          jobId: job.id,
          userId: job.userId,
          error: err.message || err,
          retryCount: job.retryCount,
        });

        const nextRetryCount = job.retryCount + 1;
        const maxRetries = job.maxRetries || 5;

        if (nextRetryCount <= maxRetries) {
          const delayMinutes = getRetryDelayMinutes(nextRetryCount);
          const nextScheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);

          await prisma.aIJob.update({
            where: { id: job.id },
            data: {
              status: "pending",
              retryCount: nextRetryCount,
              scheduledAt: nextScheduledAt,
              lastError: err.message || "Unknown error",
            },
          });
        } else {
          await prisma.aIJob.update({
            where: { id: job.id },
            data: {
              status: "failed",
              retryCount: nextRetryCount,
              lastError: err.message || "Max retries exceeded",
            },
          });
        }
      }
    }

    // Process audio reflection jobs (priority 2)
    // Check for concurrent reflections per user to avoid spam
    const audioJobs = await prisma.aIJob.findMany({
      where: {
        jobType: "generate_audio_reflection",
        status: "pending",
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: new Date() } }
        ]
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "asc" },
      ],
      take: MAX_AUDIO_REFLECTION_PER_CRON,
    });

    let processedAudioCount = 0;
    for (const job of audioJobs) {
      const { reflectionId, contentItemId } = job.input as any;
      
      if (!reflectionId) {
        await prisma.aIJob.update({
          where: { id: job.id },
          data: {
            status: "failed",
            lastError: "Missing reflectionId",
          },
        });
        continue;
      }

      // Check if user already has processing reflection
      const existingProcessing = await prisma.audioReflection.count({
        where: {
          userId: job.userId,
          status: "pending",
          id: { not: reflectionId },
        },
      });

      if (existingProcessing >= MAX_CONCURRENT_REFLECTIONS_PER_USER) {
        // Reschedule for later
        const nextScheduledAt = new Date(Date.now() + 5 * 60 * 1000);
        await prisma.aIJob.update({
          where: { id: job.id },
          data: {
            status: "pending",
            scheduledAt: nextScheduledAt,
          },
        });
        continue;
      }

      const updatedJob = await prisma.aIJob.updateMany({
        where: { id: job.id, status: "pending" },
        data: {
          status: "processing",
          startedAt: new Date(),
        },
      });

      if (updatedJob.count === 0) continue;

      try {
        // Fetch reflection and generate audio
        const reflection = await prisma.audioReflection.findUnique({
          where: { id: reflectionId },
        });

        if (!reflection) {
          throw new Error("Reflection not found");
        }

        const audioUrl = await generateQuietAudio(reflection.script, job.userId);
        
        if (!audioUrl) {
          throw new Error("Failed to generate audio");
        }

        // Update reflection with audio URL and mark as completed
        await prisma.audioReflection.update({
          where: { id: reflectionId },
          data: {
            audioUrl,
            status: "completed",
          },
        });

        await prisma.aIJob.update({
          where: { id: job.id },
          data: { status: "completed", completedAt: new Date() }
        });
        processedAudioCount++;
      } catch (err: any) {
        // Mark reflection as failed
        await prisma.audioReflection.update({
          where: { id: reflectionId },
          data: { status: "failed" },
        });

        const nextRetryCount = job.retryCount + 1;
        const maxRetries = job.maxRetries || 3; // Fewer retries for TTS

        if (nextRetryCount <= maxRetries) {
          const delayMinutes = getRetryDelayMinutes(nextRetryCount);
          const nextScheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);

          await prisma.aIJob.update({
            where: { id: job.id },
            data: {
              status: "pending",
              retryCount: nextRetryCount,
              scheduledAt: nextScheduledAt,
              lastError: err.message || "Unknown error",
            },
          });
        } else {
          await prisma.aIJob.update({
            where: { id: job.id },
            data: {
              status: "failed",
              retryCount: nextRetryCount,
              lastError: err.message || "Max retries exceeded",
            },
          });
        }
      }
    }

    // Process return detection jobs (priority 3 - quiet background)
    // These run infrequently to detect quiet returns
    const returnJobs = await prisma.aIJob.findMany({
      where: {
        jobType: {
          in: [
            "detect_returning_fragments",
            "detect_temporal_echoes",
            "detect_calm_resurfacing",
          ],
        },
        status: "pending",
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: new Date() } }
        ]
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "asc" },
      ],
      take: MAX_RETURN_DETECTION_PER_CRON,
    });

    let processedReturnCount = 0;
    for (const job of returnJobs) {
      const updatedJob = await prisma.aIJob.updateMany({
        where: { id: job.id, status: "pending" },
        data: {
          status: "processing",
          startedAt: new Date(),
        },
      });

      if (updatedJob.count === 0) continue;

      try {
        // Execute appropriate return detection based on job type
        if (job.jobType === "detect_returning_fragments") {
          await detectReturningFragments(job.userId);
        } else if (job.jobType === "detect_temporal_echoes") {
          await detectTemporalEchoes(job.userId);
        } else if (job.jobType === "detect_calm_resurfacing") {
          await detectCalmResurfacing(job.userId);
        }

        await prisma.aIJob.update({
          where: { id: job.id },
          data: { status: "completed", completedAt: new Date() }
        });
        processedReturnCount++;
      } catch (err: any) {
        const nextRetryCount = job.retryCount + 1;
        const maxRetries = job.maxRetries || 3;

        if (nextRetryCount <= maxRetries) {
          const delayMinutes = getRetryDelayMinutes(nextRetryCount);
          const nextScheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);

          await prisma.aIJob.update({
            where: { id: job.id },
            data: {
              status: "pending",
              retryCount: nextRetryCount,
              scheduledAt: nextScheduledAt,
              lastError: err.message || "Unknown error",
            },
          });
        } else {
          await prisma.aIJob.update({
            where: { id: job.id },
            data: {
              status: "failed",
              retryCount: nextRetryCount,
              lastError: err.message || "Max retries exceeded",
            },
          });
        }
      }
    }

    // Process life OS jobs (priority 3 - nightly, quiet)
    const lifeJobs = await prisma.aIJob.findMany({
      where: {
        jobType: {
          in: [
            "generate_life_themes",
            "generate_philosophy_fragments",
            "extract_philosophy_fragments",
            "generate_daily_ritual",
            "detect_returning_themes",
            "generate_memory_edges",
            "generate_archive_revisits",
            "generate_legacy_snapshot",
            "generate_life_chapters",
          ],
        },
        status: "pending",
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: new Date() } }
        ]
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "asc" },
      ],
      take: MAX_LIFE_OS_JOBS_PER_CRON,
    });

    let processedLifeOSCount = 0;
    for (const job of lifeJobs) {
      const updatedJob = await prisma.aIJob.updateMany({
        where: { id: job.id, status: "pending" },
        data: {
          status: "processing",
          startedAt: new Date(),
        },
      });

      if (updatedJob.count === 0) continue;

      try {
        // Execute appropriate life OS analysis based on job type
        if (job.jobType === "generate_life_themes") {
          await extractLifeThemes(job.userId, 6);
        } else if (job.jobType === "generate_philosophy_fragments" || job.jobType === "extract_philosophy_fragments") {
          await extractPhilosophyFragments(job.userId);
        } else if (job.jobType === "generate_daily_ritual") {
          await generateDailyRitual(job.userId);
        } else if (job.jobType === "generate_legacy_snapshot") {
          await generateLegacySnapshot(job.userId);
        } else if (job.jobType === "generate_life_chapters") {
          await generateLegacySnapshot(job.userId);
        } else if (job.jobType === "generate_memory_edges") {
          await generateMemoryEdges(job.userId);
        } else if (job.jobType === "generate_archive_revisits") {
          await computeArchiveRevisits(job.userId);
        } else if (job.jobType === "detect_returning_themes") {
          await detectReturningThemes(job.userId);
        }

        await prisma.aIJob.update({
          where: { id: job.id },
          data: { status: "completed", completedAt: new Date() }
        });
        processedLifeOSCount++;
      } catch (err: any) {
        const nextRetryCount = job.retryCount + 1;
        const maxRetries = job.maxRetries || 2;

        if (nextRetryCount <= maxRetries) {
          const delayMinutes = getRetryDelayMinutes(nextRetryCount);
          const nextScheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);

          await prisma.aIJob.update({
            where: { id: job.id },
            data: {
              status: "pending",
              retryCount: nextRetryCount,
              scheduledAt: nextScheduledAt,
              lastError: err.message || "Unknown error",
            },
          });
        } else {
          await prisma.aIJob.update({
            where: { id: job.id },
            data: {
              status: "failed",
              retryCount: nextRetryCount,
              lastError: err.message || "Max retries exceeded",
            },
          });
        }
      }
    }

    // Process custom registered jobs (5 at a time)
    const processedCustomQueueCount = await processQueueBatch(5);

    return NextResponse.json({ 
      success: true, 
      processedContentCount,
      processedAudioCount,
      processedReturnCount,
      processedLifeOSCount,
      processedCustomQueueCount,
    });
  } catch (error) {
    console.error("Cron Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
