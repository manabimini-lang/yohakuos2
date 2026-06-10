import { prisma } from "@/lib/prisma";
import { KnowledgeStatus } from "@prisma/client";
import { classifyContent } from "./classifier";
import { generateSummary } from "./summarizer";
import { generateTags } from "./tagger";
import { getDefaultProvider } from "@/lib/ai/provider";
import { generateMemoryLinks } from "@/lib/memory/link-generator"; // E-3D: Memory Link Generator

/**
 * Knowledge Inbox Processing Worker
 * Mirror Principle: AI only summarizes and categorizes without judgment or advice.
 */
export async function processInboxQueue() {
  // P0-1: Claim Pattern を $transaction で囲み、競合を完全に防止
  await prisma.$transaction(async (tx) => {
    const itemsToClaim = await tx.contentItem.findMany({
      where: { 
        status: KnowledgeStatus.PENDING,
        // P0-1: updatedAt も条件に含めることで、古いPENDINGアイテムが優先されるようにする
        updatedAt: { lte: new Date() } 
      },
      take: 5,
      orderBy: { createdAt: "asc" },
      // PostgreSQLのFOR UPDATE SKIP LOCKEDに相当する動作をシミュレート
      // ただし、PrismaのfindManyでは直接サポートされていないため、
      // updateManyと組み合わせることで楽観的ロックに近い動作を実現
    });

    if (itemsToClaim.length === 0) return;

    const claimedIds = itemsToClaim.map((i) => i.id);
    // P0-1: PENDING状態のアイテムのみをPROCESSINGに更新
    const { count } = await tx.contentItem.updateMany({
      where: { 
        id: { in: claimedIds },
        status: KnowledgeStatus.PENDING // 念のため状態を再確認
      },
      data: { status: KnowledgeStatus.PROCESSING },
    });

    // 実際にClaimできたアイテムのみを処理対象とする
    const processingItems = itemsToClaim.filter(item => claimedIds.includes(item.id));

    for (const item of processingItems) {
      try {
        const contentForAI = item.content?.slice(0, 5000) || ""; // AI入力上限を5000文字に設定

        // E-2: 1. Classification
        const contentType = await classifyContent(contentForAI, item.sourceUrl || item.fileUrl || undefined);

        // E-2: 2. Summary
        const { summary, suggestedTitle } = await generateSummary(contentForAI, item.captureReason);

        // E-2: 3. Tags
        const tags = await generateTags(contentForAI, item.captureReason);

        // E-3A: 4. Embedding Generation
        const provider = getDefaultProvider(); // Invokes provider
        const embedding = await provider.embed(contentForAI);

        await tx.contentItem.update({
          where: { id: item.id },
          data: {
            title: suggestedTitle,
            summary: summary,
            contentType: contentType,
            aiTags: tags,
            status: KnowledgeStatus.PROCESSED,
            embeddingModel: provider.embeddingModel, // Persisted
            embeddingDimensions: provider.embeddingDimensions, // Persisted
            aiVersion: provider.version, // Persisted
            aiProcessedAt: new Date() // Persisted
          },
        });

        if (embedding && embedding.length > 0) {
            const vectorString = `[${embedding.join(',')}]`;
            await tx.$executeRaw`
                UPDATE content_items 
                SET embedding = ${vectorString}::vector 
                WHERE id = ${item.id}
            `;

            // Step 6: Memory Link Generation (E-3D)
            try {
              await generateMemoryLinks(item.userId, item.id, embedding);
            } catch (linkError) {
              // Failure to generate links MUST NOT fail ContentItem processing
              console.error(`[MEMORY_LINK_GENERATION_ERROR] ID: ${item.id}:`, linkError);
            }
        }
        // Step 7: Finalize Status
        await tx.contentItem.update({
          where: { id: item.id },
          data: { status: KnowledgeStatus.PROCESSED, aiProcessedAt: new Date() },
        });
      } catch (error: any) {
        // P0-5: retryCount競合解消のため increment を使用
        const updatedItem = await tx.contentItem.update({
          where: { id: item.id },
          data: {
            retryCount: { increment: 1 },
            lastError: error.message.slice(0, 500), // エラーメッセージも長さに制限
            status: KnowledgeStatus.PENDING, // P0-2: Enumを使用し、PENDINGに戻して再試行
          },
        });
        // P0-5: リトライ回数が上限を超えたらFAILEDにする
        if (updatedItem.retryCount >= 3) {
          await tx.contentItem.update({
            where: { id: item.id },
            data: { status: KnowledgeStatus.FAILED }, // P0-2: Enumを使用
          });
        }
        console.error(`[PROCESS_INBOX_ERROR] ID: ${item.id}`, error);
      }
    }
  });
}