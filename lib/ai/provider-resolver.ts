import { prisma } from "@/lib/prisma";
import { decryptKey } from "@/lib/encryption";
import { GeminiProvider } from "./gemini-provider";

/**
 * Resolves the user's AI provider.
 * If user has not enabled or configured their own AI settings, returns null.
 */
export async function resolveProvider(userId: string): Promise<GeminiProvider | null> {
  try {
    const settings = await prisma.userAISettings.findUnique({
      where: { userId },
    });

    if (!settings || !settings.isEnabled || !settings.encryptedApiKey) {
      return null;
    }

    const apiKey = decryptKey(settings.encryptedApiKey);
    const model = settings.model || undefined;

    return new GeminiProvider({
      userId,
      apiKey,
      model,
    });
  } catch (error) {
    console.error("[resolveProvider] Error resolving provider:", error);
    return null;
  }
}
