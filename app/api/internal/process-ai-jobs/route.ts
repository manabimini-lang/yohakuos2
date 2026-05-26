import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import crypto from "crypto";
import { processAIAnalysis } from "@/app/actions/ai-processing";

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
    // Lock jobs by updating status from pending to processing (atomic in a transaction if needed, but here we'll fetch then update and check if it was pending to prevent duplicate processing)
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
        // Handle failure
        await prisma.aIJob.update({
          where: { id: job.id },
          data: {
            status: "failed",
            lastError: err.message,
            retryCount: { increment: 1 },
          },
        });
      }
    }

    return NextResponse.json({ success: true, processedCount: jobsToProcess.length });
  } catch (error) {
    console.error("Cron Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
