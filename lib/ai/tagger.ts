/**
 * YOHAKU AI Tagger
 * 3〜5個の控えめなタグを生成。
 * Providerを通じて呼び出すこと。
 */
import type { AIProvider, TagOptions } from "./provider";

export async function generateContentTags(
  provider: AIProvider,
  text: string,
  options?: TagOptions
): Promise<string[]> {
  return provider.generateTags(text, options);
}
