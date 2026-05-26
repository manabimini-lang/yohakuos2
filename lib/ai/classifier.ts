/**
 * YOHAKU AI Classifier
 * URLと本文からコンテンツ種類を判定。
 * URLベースの高速パスを持ち、AIは曖昧なケースにのみ使用。
 */
import type { AIProvider, ContentItemType } from "./provider";

export async function classifyContentItem(
  provider: AIProvider,
  text: string,
  url?: string
): Promise<ContentItemType> {
  return provider.classify(text, url);
}
