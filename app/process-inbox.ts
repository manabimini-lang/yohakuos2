import { prisma } from "@/lib/prisma";
import { classifyContentItem } from "@/lib/ai/classifier";
import { generateContentTags } from "@/lib/ai/tagger";
import { generateSummary } from "@/prisma/summarizer";
import { getDefaultProvider } from "@/lib/ai/provider";
import { generateMemoryLinks } from "@/lib/memory/link-generator"; // E-3D: Memory Link Generator

async function generateTags(content: string, _context?: string) {
  const provider = getDefaultProvider();
  return generateContentTags(provider, content);
}

/**
 * Knowledge Inbox Processing Worker
 * Mirror Principle: AI only summarizes and categorizes without judgment or advice.
 */
export async function processInboxQueue() {
  await prisma.$transaction(async (tx: any) => {
    const itemsToClaim = await tx.contentItem.findMany({
      where: {
        aiProcessedAt: null,
        memoryState: "active",
      },
      take: 5,
      orderBy: { createdAt: "asc" },
    });

    if (itemsToClaim.length === 0) return;

    for (const item of itemsToClaim) {
      try {
        if (item.aiProcessedAt !== null) continue;

        const contentForAI = [
          item.reflection,
          item.title,
          item.url ?? item.fileName,
        ]
          .filter(Boolean)
          .join("\n\n")
          .trim();

        if (!contentForAI) {
          await tx.contentItem.update({
            where: { id: item.id },
            data: { aiProcessedAt: new Date() },
          });
          continue;
        }

        const provider = getDefaultProvider();
        const contentType = await classifyContentItem(
          provider,
          contentForAI,
          item.url ?? item.fileUrl ?? undefined
        );

        // E-2: 2. Summary
        const { summary, suggestedTitle } = await generateSummary(contentForAI, item.title || "");

        // E-2: 3. Tags
        const tags = await generateTags(contentForAI, item.title || "");

        // E-3A: 4. Embedding Generation
        const embedding = await provider.embed(contentForAI);

        await tx.contentItem.update({
          where: { id: item.id },
          data: {
            title: suggestedTitle,
            summary: summary,
            contentType: contentType,
            aiTags: tags,
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
          data: { aiProcessedAt: new Date() }, // Mark as processed
        });
      } catch (error: any) {
        console.error(`[PROCESS_INBOX_ERROR] ID: ${item.id}`, error);
      }
    }
  });
}
