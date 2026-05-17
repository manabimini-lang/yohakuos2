"use server";

import { auth } from "@/lib/auth";
import { encryptKey } from "@/lib/encryption";
import { revalidatePath } from "next/cache";
import { updateAiKeySchema } from "@/lib/validators/settings.validator";
import { apiKeyRepository } from "@/lib/repositories/api-key.repository";

export async function updateAiKeyAction(apiKey: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "ログインしてください。" };
    }

    
    // 1. Validate
    const parsed = updateAiKeySchema.safeParse({ apiKey });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "入力内容が正しくありません。" };
    }

    const validatedKey = parsed.data.apiKey;

    // 2. Encrypt
    const encryptedKey = encryptKey(validatedKey);

    // 3. Save via Repository
    await apiKeyRepository.upsert(session.user.id, encryptedKey, "gemini");

    revalidatePath("/member/settings");
    return { ok: true };
  } catch (error) {
    console.error("[UPDATE_AI_KEY]", error);
    return { ok: false, error: "設定の保存に失敗しました。少し時間を置いてお試しください。" };
  }
}
