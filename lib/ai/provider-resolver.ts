import { getApiCredentials } from "./gemini";
import { GeminiProvider } from "./gemini-provider";

/**
 * Resolves the user's AI provider.
 * Premium resolves to YOHAKU's managed key. Free accounts resolve only to the
 * API key registered by that user; there is no shared-key fallback.
 */
export async function resolveProvider(userId: string): Promise<GeminiProvider | null> {
  try {
    await getApiCredentials({ userId, allowEnvFallback: true });
    return new GeminiProvider({
      userId,
      allowEnvFallback: true,
    });
  } catch {
    return null;
  }
}
