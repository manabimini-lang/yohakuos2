import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { processQueueBatch } from "@/lib/memory/queue";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const userId = session.user.id;

  try {
    // Reset all failed landscape jobs of this user to pending
    await prisma.aIJob.updateMany({
      where: {
        userId,
        jobType: {
          in: ["generate_inner_landscape", "returning_questions", "resonance_weather"],
        },
        status: "failed",
      },
      data: {
        status: "pending",
        lastError: null,
        retryCount: 0,
      },
    });

    // Run the process in the background (fire-and-forget) to speed up local dev / response times
    processQueueBatch(5).catch((err) => {
      console.error("[retry-landscape] processQueueBatch error:", err);
    });
  } catch (err) {
    console.error("Retry landscape jobs failed:", err);
  }

  return NextResponse.redirect(new URL("/landscape", request.url));
}
