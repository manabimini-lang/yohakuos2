"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptKey } from "@/lib/encryption";
import { revalidatePath } from "next/cache";
import { log } from "@/core/audit/logger";

export type AiSettingsInput = {
  provider: string;
  apiKey: string;
  model: string;
  isEnabled: boolean;
};

export async function saveAISettings(data: AiSettingsInput) {
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
    // Basic verification of key format for Gemini keys (typically starts with AIzaSy)
    if (!data.apiKey.startsWith("AIzaSy")) {
      throw new Error("無効なGemini APIキーの形式です（通常、AIzaSyから始まります）。");
    }
    encryptedApiKey = encryptKey(data.apiKey);
  }

  const existing = await prisma.userAISettings.findUnique({
    where: { userId },
  });

  if (existing) {
    await prisma.userAISettings.update({
      where: { userId },
      data: {
        provider: data.provider,
        model: data.model || null,
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
        model: data.model || null,
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
        model: data.model,
        method: encryptedApiKey ? "api_key" : "saved_setting",
      },
    });
  }

  revalidatePath("/settings/ai");
  return { success: true };
}
