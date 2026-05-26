"use server";

import { prisma } from "@/lib/prisma";
import { summarizeContent } from "@/lib/ai/summarize";
import { generateContentTags } from "@/lib/ai/tagger";
import { classifyContentItem } from "@/lib/ai/classifier";
import { generateEmbedding } from "@/lib/ai/embeddings";

// Current AI version — bump when prompts or models change (enables re-analysis)
const AI_VERSION = "1.0";

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

    // 4. Initialize provider (dynamically resolved)
    const { resolveProvider } = await import("@/lib/ai/provider-resolver");
    const provider = await resolveProvider(userId);

    if (!provider) {
      // AI is disabled / not connected
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
        data: { status: "completed", completedAt: new Date() }, // completed because AI is disabled
      });
      return;
    }

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

    // Embedding update via raw SQL
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

    // 7. Mark corresponding AIJob as completed
    await prisma.aIJob.updateMany({
      where: {
        userId,
        jobType: "content_analysis",
        input: { path: ["contentItemId"], equals: contentItemId },
        status: { in: ["pending", "processing"] },
      },
      data: { status: "completed", completedAt: new Date() },
    });

    // 8. Generate Memory Resurfacing if applicable
    if (resolvedEmbedding && resolvedEmbedding.length > 0) {
      const { computeMemoryResurfacing } = await import("@/lib/memory/memory-resurfacer");
      await computeMemoryResurfacing(userId, contentItemId);
    }
  } catch (error: any) {
    console.error("[processAIAnalysis] failed:", error);

    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: { aiStatus: "failed" },
    });

    throw error;
  }
}
