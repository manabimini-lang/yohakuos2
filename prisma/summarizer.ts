import { getDefaultProvider } from "@/lib/ai/provider";

/**
 * E-2: AI Summary Layer
 * Generates a neutral, objective summary and suggested title.
 */
export async function generateSummary(
  content: string,
  captureReason?: string | null
): Promise<{
  summary: string;
  suggestedTitle: string;
}> {
  const provider = getDefaultProvider();
  const textToSummarize = captureReason ? `保存理由: ${captureReason}\n内容: ${content}` : content;

  try {
    const result = await provider.summarize(textToSummarize);
    return result; // provider.summarize の戻り値が SummarizeResult になったため、そのまま返せる
  } catch (error) {
    console.error("[SUMMARIZER_ERROR] AI summarization failed, returning fallback:", error);
    return { summary: "要約を生成できませんでした。", suggestedTitle: "無題の記録" };
  }
}