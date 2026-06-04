"use server";

import { auth } from "@/lib/auth";
import { encryptKey } from "@/lib/encryption";
import { revalidatePath } from "next/cache";
import { updateAiKeySchema } from "@/lib/validators/settings.validator";
import { prisma } from "@/lib/prisma";

export async function updateAiKeyAction(apiKey: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "ログインしてください。" };
    }
    const userId = session.user.id;

    // 1. Validate
    const parsed = updateAiKeySchema.safeParse({ apiKey });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "入力内容が正しくありません。" };
    }

    const validatedKey = parsed.data.apiKey;

    // 2. Encrypt
    const encryptedKey = encryptKey(validatedKey);

    // 3. Save to user_ai_settings (source of truth)
    await prisma.userAISettings.upsert({
      where: { userId },
      update: { encryptedApiKey: encryptedKey, provider: "gemini", isEnabled: true },
      create: { userId, encryptedApiKey: encryptedKey, provider: "gemini", isEnabled: true },
    });

    revalidatePath("/member/settings");
    return { ok: true };
  } catch (error) {
    console.error("[UPDATE_AI_KEY]", error);
    return { ok: false, error: "設定の保存に失敗しました。少し時間を置いてお試しください。" };
  }
}
