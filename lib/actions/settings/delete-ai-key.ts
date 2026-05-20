"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { apiKeyRepository } from "@/lib/repositories/api-key.repository";

export async function deleteAiKeyAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "ログインしてください。" };
    }
    const userId = session.user.id;

    // Delete database record
    await apiKeyRepository.delete(userId, "gemini");

    revalidatePath("/member/settings");
    return { ok: true };
  } catch (error) {
    console.error("[DELETE_AI_KEY]", error);
    return { ok: false, error: "設定の削除に失敗しました。" };
  }
}
