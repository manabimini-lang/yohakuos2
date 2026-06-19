import { getUserOwnedApiCredentials } from "./gemini";
import { getApiCredentials } from "./gemini";
import { GeminiProvider } from "./gemini-provider";
import { getStarterJourneyStatus } from "./starter-journey";

/**
 * Resolves the user's AI provider.
 * Prefers the user's own Gemini credentials. If none exist and the user is in an active starter journey,
 * falls back to the system Gemini key for a limited 72-hour experience.
 */
export async function resolveProvider(userId: string): Promise<GeminiProvider | null> {
  const credentials = await getUserOwnedApiCredentials(userId);
  if (credentials) {
    return new GeminiProvider({
      userId,
      apiKey: credentials.apiKey,
      model: credentials.modelName,
    });
  }

  const starterJourney = await getStarterJourneyStatus(userId);
  const starterApiKey = process.env.STARTER_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (starterJourney.active && starterApiKey) {
    return new GeminiProvider({
      apiKey: starterApiKey,
    });
  }

  const fallbackCredentials = await getApiCredentials({ userId, allowEnvFallback: true });
  if (fallbackCredentials.apiKey) {
    return new GeminiProvider({
      userId,
      apiKey: fallbackCredentials.apiKey,
      model: fallbackCredentials.modelName,
    });
  }

  return null;
}
