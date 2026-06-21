import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const startTime = Date.now();
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== "development") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const now = new Date();

    console.log(`[CLEANUP] Starting cleanup job at ${now.toISOString()}`);

    // Delete expired ContentItems (cascade deletes CaptureJob, MeaningJob, ConnectionJob, MemoryLink, etc.)
    const deletedContent = await prisma.contentItem.deleteMany({
      where: { expiresAt: { lte: now } },
    });

    // Delete expired AudioReflections
    const deletedAudioReflections = await prisma.audioReflection.deleteMany({
      where: { expiresAt: { lte: now } },
    });

    // Delete expired CompanionConversations (cascade deletes messages, summaries, themes, insights)
    const deletedConversations = await prisma.companionConversation.deleteMany({
      where: { expiresAt: { lte: now } },
    });

    // Delete expired UserMemories
    const deletedMemories = await prisma.userMemory.deleteMany({
      where: { expiresAt: { lte: now } },
    });

    const elapsed = Date.now() - startTime;

    console.log(
      `[CLEANUP] Finished in ${elapsed}ms. Deleted: ContentItems=${deletedContent.count}, AudioReflections=${deletedAudioReflections.count}, Conversations=${deletedConversations.count}, Memories=${deletedMemories.count}`
    );

    return NextResponse.json({
      deletedContentItems: deletedContent.count,
      deletedAudioReflections: deletedAudioReflections.count,
      deletedConversations: deletedConversations.count,
      deletedMemories: deletedMemories.count,
      elapsedMs: elapsed,
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error("[CLEANUP_ERROR]", { error, elapsedMs: elapsed });
    return NextResponse.json(
      { error: "Internal Error", elapsedMs: elapsed },
      { status: 500 }
    );
  }
}

