import { prisma } from "@/lib/prisma";
import { generateMeaning } from "@/lib/ai/meaning-generator";

/**
 * YOHAKU Meaning Worker
 * 保存された記録の意味（要約・タグ）をAIで抽出します。
 */
export async function runMeaningWorker() {
  // 1. status=pending のジョブ取得
  const job = await prisma.meaningJob.findFirst({
    where: { status: "pending" },
    include: { contentItem: true },
    orderBy: { createdAt: "asc" },
  });

  if (!job) return;

  // ジョブを処理中に更新
  await prisma.meaningJob.update({
    where: { id: job.id },
    data: { status: "processing" },
  });

  try {
    // 2. AI要約 & タグ & テーマ生成
    const { summary, tags, theme } = await generateMeaning({
      title: job.contentItem.title || "",
      description: job.contentItem.description || "",
      contentType: job.contentItem.contentType || "website",
      metadata: job.contentItem.metadata,
      userId: job.contentItem.userId,
    });

    // 3. ContentItem更新 & meaningStatus=completed
    await prisma.contentItem.update({
      where: { id: job.contentItemId },
      data: {
        summary,
        tags: tags,
        theme: theme, // Theme Engine が抽出したテーマを保存
        meaningStatus: "completed",
        aiProcessedAt: new Date(),
      },
    });

    // 4. Job更新
    await prisma.meaningJob.update({
      where: { id: job.id },
      data: { status: "completed" },
    });

    // Step 8: Meaning Worker 成功後に ConnectionJob を生成
    await prisma.connectionJob.create({
      data: {
        contentItemId: job.contentItemId,
      },
    });

  } catch (error) {
    console.error(`Meaning worker failed for job ${job.id}:`, error);
    await prisma.meaningJob.update({
      where: { id: job.id },
      data: { status: "failed" },
    });
    await prisma.contentItem.update({
      where: { id: job.contentItemId },
      data: { meaningStatus: "failed" },
    });
  }
}