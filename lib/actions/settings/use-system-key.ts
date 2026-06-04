"use server";

import { auth } from "@/lib/auth";
import { encryptKey } from "@/lib/encryption";
import { revalidatePath } from "next/cache";
import { userRepository } from "@/lib/repositories/user.repository";
import { subscriptionService } from "@/lib/services/subscription.service";
import { prisma } from "@/lib/prisma";

export async function useSystemApiKeyAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "ログインしてください。" };
    }
    const userId = session.user.id;

    // Verify user profile
    const user = await userRepository.findById(userId);
    if (!user) {
      return { ok: false, error: "ユーザーが見つかりません。" };
    }

    let systemKey = process.env.GEMINI_API_KEY;
    if (!systemKey || systemKey.trim() === "") {
      systemKey = "AIzaSyDummyGeminiKeyForYohakuOSLocalTesting";
    }

    // Encrypt and save to user_ai_settings (source of truth)
    const encryptedKey = encryptKey(systemKey);
    await prisma.userAISettings.upsert({
      where: { userId },
      update: { encryptedApiKey: encryptedKey, provider: "gemini", isEnabled: true },
      create: { userId, encryptedApiKey: encryptedKey, provider: "gemini", isEnabled: true },
    });

    revalidatePath("/member/settings");
    return { ok: true, apiKey: systemKey };
  } catch (error) {
    console.error("[USE_SYSTEM_API_KEY]", error);
    return { ok: false, error: "標準キーの設定に失敗しました。" };
  }
}
