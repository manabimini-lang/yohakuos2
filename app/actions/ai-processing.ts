"use server";

import { prisma } from "@/lib/prisma";
import { summarizeContent } from "@/lib/ai/summarize";
import { generateContentTags } from "@/lib/ai/tagger";
import { classifyContentItem } from "@/lib/ai/classifier";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { shouldGenerateReflection } from "@/lib/ai/should-generate-reflection";
import { isStarterJourneyUsingSharedKey } from "@/lib/ai/starter-journey";
import { maybeEnqueueLifeOSJobs } from "@/lib/life/queue-life-jobs";
import { maybeEnqueueReturnJobs } from "@/lib/memory/queue-return-jobs";
import { CONTENT_ITEM_SAFE_SELECT } from "@/lib/content-item-safe-select";
import { getExpiresAt } from "@/lib/services/retention.service";

// Current AI version — bump when prompts or models change (enables re-analysis)
const AI_VERSION = "1.0";

export async function processAIAnalysis(
  contentItemId: string,
  userId: string
): Promise<void> {
  console.log("PROCESSING AI ANALYSIS", {
    contentItemId,
    userId,
  });

  // 1. Mark as processing
  await prisma.contentItem.update({
    where: { id: contentItemId },
    data: { aiProcessedAt: null, meaningStatus: "processing" },
  });

  try {
    // 2. Fetch the content item
    const item = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
      select: CONTENT_ITEM_SAFE_SELECT,
    });

    if (!item) {
      throw new Error(`ContentItem not found: ${contentItemId}`);
    }

    // 3. Gather text to analyze
    const textParts = [];
    if (item.reflection) textParts.push(`【ユーザーの保存理由 (Reflection)】\n${item.reflection}`);
    if (item.title) textParts.push(`【タイトル】\n${item.title}`);
    if (item.url || item.fileName) textParts.push(`【コンテンツ情報】\n${item.url ?? item.fileName}`);
    
    const textForAnalysis = textParts.join("\n\n").trim();

    if (!textForAnalysis) {
      await prisma.contentItem.update({
        where: { id: contentItemId },
        data: { aiProcessedAt: new Date(), meaningStatus: "completed" },
      });
      return;
    }

    // 4. Initialize provider (dynamically resolved)
    console.log("LOADING USER API KEY", { userId });
    const { resolveProvider } = await import("@/lib/ai/provider-resolver");
    const provider = await resolveProvider(userId);

    if (!provider) {
      console.log("NO PROVIDER FOUND", { userId });
      // AI is disabled / not connected
      await prisma.contentItem.update({
        where: { id: contentItemId },
        data: { aiProcessedAt: new Date(), meaningStatus: "failed" },
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
    console.log("RUNNING AI TASKS", { contentItemId, userId });
    const [summary, tags, contentType, embedding] = await Promise.allSettled([
      summarizeContent(provider, textForAnalysis),
      generateContentTags(provider, textForAnalysis),
      classifyContentItem(provider, textForAnalysis, item.url ?? undefined),
      generateEmbedding(provider, textForAnalysis),
    ]);

    const resolvedSummary =
      summary.status === "fulfilled" ? summary.value.summary : null;
    const resolvedSuggestedTitle =
      summary.status === "fulfilled" ? summary.value.suggestedTitle : null;
    const resolvedTags =
      tags.status === "fulfilled" ? tags.value : [];
    const resolvedContentType =
      contentType.status === "fulfilled" ? contentType.value : null;
    const resolvedEmbedding =
      embedding.status === "fulfilled" && embedding.value.length > 0
        ? embedding.value
        : null;

    if (resolvedSummary) {
      console.log("SUMMARY GENERATED", {
        contentItemId,
        userId,
        summary: resolvedSummary.slice(0, 120),
        suggestedTitle: resolvedSuggestedTitle,
      });
    } else {
      console.log("SUMMARY FAILED TO GENERATE", { contentItemId, userId });
    }

    // 6. Build update payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      aiVersion: AI_VERSION,
      aiProcessedAt: new Date(),
      meaningStatus: "completed",
      ...(resolvedSummary !== null && { summary: resolvedSummary }),
      ...(resolvedSuggestedTitle !== null &&
        !item.title?.trim() && { title: resolvedSuggestedTitle }),
      ...(resolvedTags.length > 0 && { aiTags: resolvedTags }),
      ...(resolvedContentType !== null && { contentType: resolvedContentType }),
    };

    // Embedding update via raw SQL
    if (resolvedEmbedding && resolvedEmbedding.length > 0) {
      console.log("UPDATING CONTENT EMBEDDING", {
        contentItemId,
        userId,
        embeddingLength: resolvedEmbedding.length,
      });
      const vectorStr = `[${resolvedEmbedding.join(",")}]`;
      await prisma.$executeRaw`
        UPDATE content_items
        SET embedding = ${vectorStr}::vector,
            embedding_model = ${provider.embeddingModel},
            embedding_dimensions = ${provider.embeddingDimensions}
        WHERE id = ${contentItemId}
      `;
    }

    console.log("UPDATING CONTENT", {
      contentItemId,
      userId,
      summary: resolvedSummary !== null,
      tags: resolvedTags.length,
      contentType: resolvedContentType,
      embedding: !!resolvedEmbedding,
    });

    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: updateData,
    });

    async function enqueueAudioReflectionIfEligible(contentItemId: string, userId: string) {
      const contentItem = await prisma.contentItem.findUnique({
        where: { id: contentItemId },
        select: CONTENT_ITEM_SAFE_SELECT,
      });
      if (!contentItem) return;

      const hasReflection = Boolean(contentItem.reflection?.trim());
      const shouldGenerate = await shouldGenerateReflection({
        contentItemId,
        userId,
        hasReflection,
      });
      if (!shouldGenerate) {
        return;
      }

      const { resolveProvider } = await import("@/lib/ai/provider-resolver");
      const provider = await resolveProvider(userId);
      if (!provider) {
        return;
      }

      const isStarter = await isStarterJourneyUsingSharedKey(userId);
      const expiresAt = await getExpiresAt(userId);

      const reflection = await prisma.audioReflection.create({
        data: {
          userId,
          contentItemId,
          script: contentItem.reflection?.trim() || "今夜の思考を、静かに見つめ直す時間です。",
          status: "pending",
          expiresAt,
        },
      });

      await prisma.aIJob.create({
        data: {
          userId,
          jobType: "generate_audio_reflection",
          status: "pending",
          priority: isStarter ? 4 : 2,
          input: {
            reflectionId: reflection.id,
            contentItemId,
          },
          maxRetries: 3,
        },
      });
    }

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

    // 8. Maybe enqueue audio reflection after AI summary is complete
    await enqueueAudioReflectionIfEligible(contentItemId, userId);

    // 9. Generate Memory Resurfacing if applicable
    if (resolvedEmbedding && resolvedEmbedding.length > 0) {
      const { computeMemoryResurfacing } = await import("@/lib/memory/memory-resurfacer");
      await computeMemoryResurfacing(userId, contentItemId);
      await maybeEnqueueReturnJobs(userId);
    }

    // 10. Trigger Life OS analysis if eligible
    await maybeEnqueueLifeOSJobs(userId);
  } catch (error: any) {
    console.error("[processAIAnalysis] failed:", error);

    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: { aiProcessedAt: new Date(), meaningStatus: "failed" },
    });

    await prisma.aIJob.updateMany({
      where: {
        jobType: "content_analysis",
        input: { path: ["contentItemId"], equals: contentItemId },
        status: { in: ["pending", "processing"] },
      },
      data: {
        lastError: String(error?.message || error),
      },
    });

    throw error;
  }
}
