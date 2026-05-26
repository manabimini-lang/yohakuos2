import { prisma } from "@/lib/prisma";
import { findSimilarContent } from "./similarity-search";
import { getDefaultProvider } from "@/lib/ai/provider";

const RESURFACING_SYSTEM_PROMPT = `あなたはユーザーの記憶を静かにつなげるAIです。
過去の記録と現在の記録の間に見られる共通点やテーマを、「静かな再発見」として言語化してください。

以下のルールを絶対厳守すること：
- 最大80文字程度で非常に短く簡潔に。
- 説教、自己改善の提案、アドバイス、コーチング感は「絶対に」出さない。
- 分析感（「あなたは〜という傾向があります」「〜と分析できます」）を出さない。
- 主観的な判断（「良いですね」「素晴らしいですね」）を含めない。
- 「以前の余白が、今の思考と静かにつながっています。」のような、静かで詩的なトーンを維持する。
- ユーザーに何かを問いかけない。

出力例:
- 「3ヶ月前にも、似たような『学び』についての記録が残されていました。」
- 「以前残した余白と、今の興味が静かにつながっているようです。」
- 「過去の言葉が、今の思考と共鳴しています。」`;

export async function computeMemoryResurfacing(
  userId: string,
  contentItemId: string
) {
  try {
    const currentItem = await prisma.contentItem.findUnique({
      where: { id: contentItemId, userId },
    });

    if (!currentItem || !currentItem.embedding) {
      return null;
    }

    // 1. Find similar past content (threshold ~0.75 for ambiguity/serendipity)
    const similarItems = await findSimilarContent(
      userId,
      currentItem.embedding as unknown as number[],
      1,
      0.75
    );

    if (similarItems.length === 0) {
      return null;
    }

    const relatedItem = await prisma.contentItem.findUnique({
      where: { id: similarItems[0].id },
    });

    if (!relatedItem) return null;

    // 2. Generate a quiet connection message using AI
    const provider = getDefaultProvider();
    
    // Construct user prompt with minimal context
    const userPrompt = `
現在の記録:
タイトル: ${currentItem.title || "無題"}
タグ: ${currentItem.aiTags.join(", ")}
振り返り: ${currentItem.reflection || "なし"}

過去の記録 (類似度: ${similarItems[0].similarityScore.toFixed(2)}):
タイトル: ${relatedItem.title || "無題"}
タグ: ${relatedItem.aiTags.join(", ")}
振り返り: ${relatedItem.reflection || "なし"}
`;

    const message = await provider.generateInsight(
      RESURFACING_SYSTEM_PROMPT,
      userPrompt
    );

    if (!message) return null;

    // 3. Save to MemoryResurfacing table
    const resurfacing = await prisma.memoryResurfacing.create({
      data: {
        userId,
        sourceContentId: currentItem.id,
        relatedContentId: relatedItem.id,
        message: message,
        similarityScore: similarItems[0].similarityScore,
        // Set an expiration of 30 days for this resurfacing cache
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return resurfacing;
  } catch (error) {
    console.error("Failed to compute memory resurfacing:", error);
    return null;
  }
}
