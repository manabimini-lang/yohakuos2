import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { processAIAnalysis } from "@/app/actions/ai-processing";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const contentItemId = params.id;

  try {
    const item = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
    });

    if (item && item.userId === session.user.id) {
      // Re-mark the item's aiStatus as "pending"
      await prisma.contentItem.update({
        where: { id: contentItemId },
        data: { aiStatus: "pending" },
      });

      // Find corresponding content_analysis AIJob and reset it
      await prisma.aIJob.updateMany({
        where: {
          userId: session.user.id,
          jobType: "content_analysis",
          input: { path: ["contentItemId"], equals: contentItemId },
        },
        data: {
          status: "pending",
          lastError: null,
          retryCount: 0,
        },
      });

      // Re-run the process in the background (fire-and-forget)
      processAIAnalysis(contentItemId, session.user.id).catch((err) => {
        console.error("[retry] processAIAnalysis error:", err);
      });
    }
  } catch (err) {
    console.error("Retry content analysis failed:", err);
  }

  return NextResponse.redirect(new URL(`/inbox/${contentItemId}`, request.url));
}
