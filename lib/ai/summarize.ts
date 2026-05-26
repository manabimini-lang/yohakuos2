/**
 * YOHAKU AI Summarize
 * 最大120文字の落ち着いた短文要約。
 * Providerを通じて呼び出すこと。
 */
import type { AIProvider, SummarizeOptions } from "./provider";

export async function summarizeContent(
  provider: AIProvider,
  text: string,
  options?: SummarizeOptions
): Promise<string> {
  return provider.summarize(text, options);
}
