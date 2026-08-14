"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptKey } from "@/lib/encryption";
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
    console.log("[AI_SAVE_START]", { userId: session?.user?.id });
    console.log("[AI_SAVE_INPUT]", data);

    // Validate input
    if (!data.provider) {
      throw new Error("プロバイダーが選択されていません。");
    }

    let encryptedApiKey: string | undefined = undefined;
    if (data.apiKey && data.apiKey !== "••••••••") {
      // Basic verification of key format for Gemini keys (starts with AIza or AQ, or is sufficient length)
      if (!data.apiKey.startsWith("AIza") && !data.apiKey.startsWith("AQ.") && data.apiKey.length < 20) {
        throw new Error("無効なGemini APIキーの形式です（通常、AIza... または AQ... から始まります）。");
      }
      encryptedApiKey = encryptKey(data.apiKey);
    }

    console.log("[AI_SAVE_DB_FIND_START]", userId)
    const existing = await prisma.userAISettings.findUnique({
      where: { userId },
    });
    console.log("[AI_SAVE_EXISTING]", existing);

    if (existing) {
      console.log("[AI_SAVE_WRITE]", { mode: "update" });
      console.log("[AI_SAVE_DB_WRITE_ATTEMPT]", {
        mode: "update",
        userId,
        isEnabled: data.isEnabled,
        hasApiKey: !!data.apiKey
      })
      await prisma.userAISettings.update({
        where: { userId },
        data: {
          provider: data.provider,
          model: FORCED_GEMINI_MODEL,
          isEnabled: data.isEnabled,
          ...(encryptedApiKey !== undefined ? { encryptedApiKey } : {}),
        },
      });
      console.log("[AI_SAVE_DB_WRITE_SUCCESS]")
    } else {
      console.log("[AI_SAVE_WRITE]", { mode: "create" });
      // If creating a new record, require an API key
      if (data.isEnabled && (!data.apiKey || data.apiKey === "••••••••")) {
        throw new Error("AIを有効にするには、APIキーを入力してください。");
      }

      console.log("[AI_SAVE_DB_WRITE_ATTEMPT]", {
        mode: "create",
        userId,
        isEnabled: data.isEnabled,
        hasApiKey: !!data.apiKey
      })
      await prisma.userAISettings.create({
        data: {
          userId,
          provider: data.provider,
          model: FORCED_GEMINI_MODEL,
          isEnabled: data.isEnabled,
          encryptedApiKey: encryptedApiKey || null,
        },
      });
      console.log("[AI_SAVE_DB_WRITE_SUCCESS]")
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
