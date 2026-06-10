import type {
  AIProvider,
  SummarizeOptions,
  SummarizeResult,
} from "./provider";

export async function summarizeContent(
  provider: AIProvider,
  text: string,
  options?: SummarizeOptions
): Promise<SummarizeResult> {
  return provider.summarize(text, options);
}
