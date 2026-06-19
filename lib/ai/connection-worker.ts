import { prisma } from "@/lib/prisma";
import { 
  filterCandidates, 
  getAIConnectionJudgments, 
  calculateFinalScore 
} from "@/lib/ai/connection-generator";
import { CONTENT_ITEM_SAFE_SELECT } from "@/lib/content-item-safe-select";

/**
 * Step 2: 重複接続防止のための正規化
 */
function normalizeConnection(sourceId: string, targetId: string) {
  return sourceId < targetId
    ? { sourceId, targetId }
    : { sourceId: targetId, targetId: sourceId };
}

export async function runConnectionWorker() {
  const job = await prisma.connectionJob.findFirst({
    where: { status: "pending" },
    include: { contentItem: true },
    orderBy: { createdAt: "asc" },
  });

  if (!job) return;

  await prisma.connectionJob.update({
    where: { id: job.id },
    data: { status: "processing" },
  });

  try {
    const current = job.contentItem;

    /**
     * 最新100件取得
     * ↓
     * システム側で20件まで圧縮
     * ↓
     * AI判定
     *
     * AIへ100件を直接渡してはいけない
     * 理由:
     * - コスト削減
     * - ノイズ削減
     * - 精度向上
     */
    const latestItems = await prisma.contentItem.findMany({
      where: {
        userId: current.userId,
        id: { not: current.id },
      },
      select: CONTENT_ITEM_SAFE_SELECT,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // システム側で類似度の高い上位20件に絞り込み
    const candidates = filterCandidates(current, latestItems);

    if (candidates.length > 0) {
      // Step 5: AI判定
      const judgments = await getAIConnectionJudgments(current, candidates, current.userId);

      for (const judgment of judgments) {
        const target = candidates.find(c => c.id === judgment.targetId);
        if (!target) continue;

        // Step 6: スコア計算
        const score = calculateFinalScore(current, target);

        if (score >= 0.7) { // Step 5 Threshold
          const normalized = normalizeConnection(current.id, target.id); // Step 2: 重複接続防止のための正規化
          
          await prisma.memoryConnection.upsert({
            where: {
              sourceId_targetId: {
                sourceId: normalized.sourceId,
                targetId: normalized.targetId,
              },
            },
            update: { score, reason: judgment.reason, contextType: judgment.contextType },
            create: { ...normalized, score, reason: judgment.reason, contextType: judgment.contextType },
          });
        }
      }
    }

    await prisma.connectionJob.update({ where: { id: job.id }, data: { status: "completed" } });
  } catch (error) {
    console.error(`Connection worker failed for job ${job.id}:`, error);
    await prisma.connectionJob.update({ where: { id: job.id }, data: { status: "failed" } });
  }
}
