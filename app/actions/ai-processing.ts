"use server";

import { prisma } from "@/lib/prisma";
import { createGeminiProvider } from "@/lib/ai/gemini-provider";
import { summarizeContent } from "@/lib/ai/summarize";
import { generateContentTags } from "@/lib/ai/tagger";
import { classifyContentItem } from "@/lib/ai/classifier";
import { generateEmbedding } from "@/lib/ai/embeddings";

// Current AI version — bump when prompts or models change (enables re-analysis)
const AI_VERSION = "1.0";

// ===================================================
// AI Analysis Job Runner
// ===================================================
// 将来的にWorker化できる構造で設計。
// 現状はServer Action内から非同期で呼ばれる。
//
// Flow:
//   Save Content → AIJob create (status: pending)
//   → processAIAnalysis() → processing → completed / failed
// ===================================================

export async function processAIAnalysis(
  contentItemId: string,
  userId: string
): Promise<void> {
  // 1. Mark as processing
  await prisma.contentItem.update({
    where: { id: contentItemId },
    data: { aiStatus: "processing" },
  });

  try {
    // 2. Fetch the content item
    const item = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
    });

    if (!item) {
      throw new Error(`ContentItem not found: ${contentItemId}`);
    }

    // 3. Gather text to analyze
    //    Priority: reflection → title → URL
    //    For PDF: file name is used as context; OCR is Phase 3+
    const textForAnalysis = [
      item.reflection,
      item.title,
      item.url ?? item.fileName,
    ]
      .filter(Boolean)
      .join("\n\n")
      .trim();

    if (!textForAnalysis) {
      await prisma.contentItem.update({
        where: { id: contentItemId },
        data: { aiStatus: "completed", aiProcessedAt: new Date() },
      });
      return;
    }

    // 4. Initialize provider (uses env GEMINI_API_KEY or user's key)
    if (!process.env.GEMINI_API_KEY) {
      await prisma.contentItem.update({
        where: { id: contentItemId },
        data: { aiStatus: "disabled", aiProcessedAt: new Date() },
      });
      await prisma.aIJob.updateMany({
        where: {
          userId,
          jobType: "content_analysis",
          input: { path: ["contentItemId"], equals: contentItemId },
          status: { in: ["pending", "processing"] },
        },
        data: { status: "completed", completedAt: new Date() },
      });
      return;
    }
    const provider = createGeminiProvider(userId);

    // 5. Run all AI tasks in parallel
    const [summary, tags, contentType, embedding] = await Promise.allSettled([
      summarizeContent(provider, textForAnalysis),
      generateContentTags(provider, textForAnalysis),
      classifyContentItem(provider, textForAnalysis, item.url ?? undefined),
      generateEmbedding(provider, textForAnalysis),
    ]);

    const resolvedSummary =
      summary.status === "fulfilled" ? summary.value : null;
    const resolvedTags =
      tags.status === "fulfilled" ? tags.value : [];
    const resolvedContentType =
      contentType.status === "fulfilled" ? contentType.value : null;
    const resolvedEmbedding =
      embedding.status === "fulfilled" && embedding.value.length > 0
        ? embedding.value
        : null;

    // 6. Build update payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      aiStatus: "completed",
      aiVersion: AI_VERSION,
      aiProcessedAt: new Date(),
      ...(resolvedSummary !== null && { summary: resolvedSummary }),
      ...(resolvedTags.length > 0 && { aiTags: resolvedTags }),
      ...(resolvedContentType !== null && { contentType: resolvedContentType }),
    };

    // Embedding update via raw SQL (Prisma doesn't support vector natively)
    if (resolvedEmbedding && resolvedEmbedding.length > 0) {
      const vectorStr = `[${resolvedEmbedding.join(",")}]`;
      await prisma.$executeRaw`
        UPDATE content_items
        SET embedding = ${vectorStr}::vector,
            embedding_model = ${provider.embeddingModel},
            embedding_dimensions = ${provider.embeddingDimensions}
        WHERE id = ${contentItemId}
      `;
    }

    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: updateData,
    });

    // 7. Mark corresponding AIJob as completed (if exists)
    await prisma.aIJob.updateMany({
      where: {
        userId,
        jobType: "content_analysis",
        input: { path: ["contentItemId"], equals: contentItemId },
        status: { in: ["pending", "processing"] },
      },
      data: { status: "completed", completedAt: new Date() },
    });

    // 8. Generate Memory Resurfacing if applicable (Phase 3)
    if (resolvedEmbedding && resolvedEmbedding.length > 0) {
      // Import dynamically to avoid circular dependencies if any
      const { computeMemoryResurfacing } = await import("@/lib/memory/memory-resurfacer");
      await computeMemoryResurfacing(userId, contentItemId);
    }
  } catch (error) {
    console.error("[processAIAnalysis] failed:", error);

    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: { aiStatus: "failed" },
    });

    await prisma.aIJob.updateMany({
      where: {
        userId,
        jobType: "content_analysis",
        input: { path: ["contentItemId"], equals: contentItemId },
        status: { in: ["pending", "processing"] },
      },
      data: {
        status: "failed",
        lastError: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}
