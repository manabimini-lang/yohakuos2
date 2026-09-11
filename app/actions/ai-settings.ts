"use server";

import { getCurrentSession } from "@/core/auth/server";
import { prisma } from "@/lib/prisma";
import { decryptKey } from "@/lib/encryption";
import { migrateLegacyUserApiKey, normalizeByokKey, providerFromStoredSetting, readUserApiKey, saveUserApiKey } from "@/lib/ai/user-api-keys";
import { revalidatePath } from "next/cache";
import { log } from "@/core/audit/logger";
import { hasPremiumAccess } from "@/lib/constants/plan";

const SUPPORTED_PROVIDERS = new Set(["managed", "gemini", "groq"]);

function normalizeProvider(value: string) {
  if (!SUPPORTED_PROVIDERS.has(value)) throw new Error("対応していないAIサービスです。");
  return value as "managed" | "gemini" | "groq";
}

function modelFor(provider: "gemini" | "groq") {
  return provider === "groq" ? "openai/gpt-oss-20b" : "gemini-2.5-flash";
}

export type AiSettingsInput = {
  provider: string;
  apiKey: string;
  model?: string;
  isEnabled: boolean;
};

export async function saveAISettings(data: AiSettingsInput) {
  try {
    const session = await getCurrentSession();
    if (!session?.id) {
      throw new Error("サインインが必要です。");
    }

    const userId = session.id;

    const requestedProvider = normalizeProvider(data.provider);

    const [existing, user] = await Promise.all([
      prisma.userAISettings.findUnique({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { plan: true, role: true } }),
    ]);
    const isPremium = hasPremiumAccess(user?.plan, user?.role);
    if (requestedProvider === "managed" && !isPremium) {
      throw new Error("YOHAKUの管理AIはPremiumで利用できます。");
    }
    const usesManagedAI = requestedProvider === "managed";
    const keyProvider = requestedProvider === "groq" ? "groq" : "gemini";
    const provider = isPremium && !usesManagedAI ? `byok_${keyProvider}` : requestedProvider;
    const model = modelFor(keyProvider);
    await migrateLegacyUserApiKey(userId, existing).catch((error) => {
      console.warn("[AI_SETTINGS] Legacy key migration was skipped", error instanceof Error ? error.message : error);
    });

    let suppliedKey = false;
    if (!usesManagedAI && data.apiKey && data.apiKey !== "••••••••") {
      await saveUserApiKey(userId, keyProvider, data.apiKey);
      suppliedKey = true;
    }

    if (!usesManagedAI && data.isEnabled && !suppliedKey) {
      const storedKey = await readUserApiKey(userId, keyProvider);
      const legacyProvider = providerFromStoredSetting(existing?.provider);
      const legacyKey = !storedKey && existing?.encryptedApiKey && legacyProvider === keyProvider
        ? normalizeByokKey(keyProvider, decryptKey(existing.encryptedApiKey))
        : null;
      if (!storedKey && !legacyKey) {
        throw new Error("AIを有効にするには、APIキーを入力してください。");
      }
    }

    if (existing) {
      await prisma.userAISettings.update({
        where: { userId },
        data: {
          provider,
          model,
          isEnabled: usesManagedAI || data.isEnabled,
          encryptedApiKey: null,
        },
      });
    } else {
      // If creating a new record, require an API key
      if (!usesManagedAI && data.isEnabled && (!data.apiKey || data.apiKey === "••••••••")) {
        throw new Error("AIを有効にするには、APIキーを入力してください。");
      }

      await prisma.userAISettings.create({
        data: {
          userId,
          provider,
          model,
          isEnabled: usesManagedAI || data.isEnabled,
          encryptedApiKey: null,
        },
      });
    }

    if (data.isEnabled || usesManagedAI) {
      await log({
        actorId: userId,
        category: "ai",
        action: "ai_provider_connected",
        targetType: "user_ai_settings",
        targetId: userId,
        metadata: {
          provider,
          model,
          method: usesManagedAI ? "managed" : suppliedKey ? "api_key" : "saved_setting",
        },
      });
    }

    revalidatePath("/yui/settings");
    return { success: true };
  } catch (error: any) {
    console.error("[AI_SAVE_ERROR]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "設定の保存に失敗しました。しばらくしてからもう一度お試しください。",
    };
  }
}
