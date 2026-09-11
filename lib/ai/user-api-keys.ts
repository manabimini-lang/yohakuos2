import { prisma } from "@/lib/prisma";
import { decryptKey, encryptKey } from "@/lib/encryption";
import { normalizeGeminiApiKey } from "./gemini-key";
import { normalizeGroqApiKey } from "./groq-key";

export type ByokProvider = "gemini" | "groq";

export function normalizeByokKey(provider: ByokProvider, value: unknown) {
  return provider === "groq" ? normalizeGroqApiKey(value) : normalizeGeminiApiKey(value);
}

export async function readUserApiKey(userId: string, provider: ByokProvider): Promise<string | null> {
  const saved = await prisma.userApiKey.findUnique({
    where: { userId_apiProvider: { userId, apiProvider: provider } },
    select: { encryptedKey: true },
  });
  if (!saved) return null;
  return normalizeByokKey(provider, decryptKey(saved.encryptedKey));
}

export async function saveUserApiKey(userId: string, provider: ByokProvider, value: unknown) {
  const normalized = normalizeByokKey(provider, value);
  const encryptedKey = encryptKey(normalized);
  await prisma.userApiKey.upsert({
    where: { userId_apiProvider: { userId, apiProvider: provider } },
    update: { encryptedKey },
    create: { userId, apiProvider: provider, encryptedKey },
  });
  return normalized;
}

export function providerFromStoredSetting(value: string | null | undefined): ByokProvider {
  return value === "groq" || value === "byok_groq" ? "groq" : "gemini";
}

export async function migrateLegacyUserApiKey(
  userId: string,
  settings: { provider: string; encryptedApiKey: string | null } | null,
) {
  if (!settings?.encryptedApiKey) return;
  const provider = providerFromStoredSetting(settings.provider);
  const existing = await readUserApiKey(userId, provider);
  if (existing) return;
  await saveUserApiKey(userId, provider, decryptKey(settings.encryptedApiKey));
}
