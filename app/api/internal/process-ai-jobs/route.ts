import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { processAIAnalysis } from "@/app/actions/ai-processing";

export const dynamic = "force-dynamic";

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
    // 1. Process pending/retrying AIJobs (Content Analysis, Resurfacing, etc.)
    const jobsToProcess = await prisma.aIJob.findMany({
      where: {
        status: { in: ["pending"] },
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: new Date() } }
        ]
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "asc" },
      ],
      take: 5,
    });

    for (const job of jobsToProcess) {
      // Mark as processing (Processing Lock)
      const updatedJob = await prisma.aIJob.updateMany({
        where: { id: job.id, status: "pending" },
        data: {
          status: "processing",
          startedAt: new Date(),
        },
      });

      if (updatedJob.count === 0) {
        continue; // Job was already picked up by another worker
      }

      try {
        // Execute job logic based on jobType
        if (job.jobType === "content_analysis") {
          const contentItemId = (job.input as any)?.contentItemId;
          if (contentItemId) {
            // Actually call the AI processing action
            await processAIAnalysis(contentItemId, job.userId);
          }
        }
        // Additional job types (theme_extraction, memory_resurfacing) will be handled here
      } catch (err: any) {
        // Handle failure with exponential backoff retry scheduling
        const nextRetryCount = job.retryCount + 1;
        const maxRetries = job.maxRetries || 5;

        if (nextRetryCount <= maxRetries) {
          const delayMinutes = getRetryDelayMinutes(nextRetryCount);
          const nextScheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);

          await prisma.aIJob.update({
            where: { id: job.id },
            data: {
              status: "pending", // rescheduled
              retryCount: nextRetryCount,
              scheduledAt: nextScheduledAt,
              lastError: err.message || "Unknown error",
            },
          });
        } else {
          // Permanently failed
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

    return NextResponse.json({ success: true, processedCount: jobsToProcess.length });
  } catch (error) {
    console.error("Cron Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
