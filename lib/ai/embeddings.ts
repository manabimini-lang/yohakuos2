/**
 * YOHAKU AI Embeddings
 * 768次元ベクトル生成。将来の類似検索・人生テーマ分析・Companion Layerに使用。
 * Providerを通じて呼び出すこと。
 */
import type { AIProvider } from "./provider";

export async function generateEmbedding(
  provider: AIProvider,
  text: string
): Promise<number[]> {
  return provider.embed(text);
}
