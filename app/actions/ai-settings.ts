"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptKey, encryptKey } from "@/lib/encryption";
import { normalizeGeminiApiKey } from "@/lib/ai/gemini-key";
import { revalidatePath } from "next/cache";
import { log } from "@/core/audit/logger";

const FORCED_GEMINI_MODEL = "gemini-2.5-flash";

export type AiSettingsInput = {
  provider: string;
  apiKey: string;
  model?: string;
  isEnabled: boolean;
};

export async function saveAISettings(data: AiSettingsInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("サインインが必要です。");
    }

    const userId = session.user.id;

    // Validate input
    if (!data.provider) {
      throw new Error("プロバイダーが選択されていません。");
    }

    let encryptedApiKey: string | undefined = undefined;
    if (data.apiKey && data.apiKey !== "••••••••") {
      encryptedApiKey = encryptKey(normalizeGeminiApiKey(data.apiKey));
    }

    const existing = await prisma.userAISettings.findUnique({
      where: { userId },
    });

    if (data.isEnabled && encryptedApiKey === undefined) {
      if (!existing?.encryptedApiKey) {
        throw new Error("AIを有効にするには、APIキーを入力してください。");
      }
      normalizeGeminiApiKey(decryptKey(existing.encryptedApiKey));
    }

    if (existing) {
      await prisma.userAISettings.update({
        where: { userId },
        data: {
          provider: data.provider,
          model: FORCED_GEMINI_MODEL,
          isEnabled: data.isEnabled,
          ...(encryptedApiKey !== undefined ? { encryptedApiKey } : {}),
        },
      });
    } else {
      // If creating a new record, require an API key
      if (data.isEnabled && (!data.apiKey || data.apiKey === "••••••••")) {
        throw new Error("AIを有効にするには、APIキーを入力してください。");
      }

      await prisma.userAISettings.create({
        data: {
          userId,
          provider: data.provider,
          model: FORCED_GEMINI_MODEL,
          isEnabled: data.isEnabled,
          encryptedApiKey: encryptedApiKey || null,
        },
      });
    }

    if (data.isEnabled) {
      await log({
        actorId: userId,
        category: "ai",
        action: "gemini_connected",
        targetType: "user_ai_settings",
        targetId: userId,
        metadata: {
          provider: data.provider,
          model: FORCED_GEMINI_MODEL,
          method: encryptedApiKey ? "api_key" : "saved_setting",
        },
      });
    }

    revalidatePath("/member/settings");
    return { success: true };
  } catch (error: any) {
    console.error("[AI_SAVE_ERROR]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "設定の保存に失敗しました。しばらくしてからもう一度お試しください。",
    };
  }
}
