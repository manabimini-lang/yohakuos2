"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function deleteAiKeyAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "ログインしてください。" };
    }
    const userId = session.user.id;

    // Remove encrypted key and disable AI in user_ai_settings (source of truth)
    await prisma.userAISettings.updateMany({
      where: { userId },
      data: { encryptedApiKey: null, isEnabled: false },
    });

    revalidatePath("/member/settings");
    return { ok: true };
  } catch (error) {
    console.error("[DELETE_AI_KEY]", error);
    return { ok: false, error: "設定の削除に失敗しました。" };
  }
}
