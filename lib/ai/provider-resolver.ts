import { getUserOwnedApiCredentials } from "./gemini";
import { GeminiProvider } from "./gemini-provider";

/**
 * Resolves the user's AI provider.
 * If user has not enabled or configured their own AI settings, returns null.
 */
export async function resolveProvider(userId: string): Promise<GeminiProvider | null> {
  const credentials = await getUserOwnedApiCredentials(userId);
  if (!credentials) {
    return null;
  }

  return new GeminiProvider({
    userId,
    apiKey: credentials.apiKey,
    model: credentials.modelName,
  });
}
