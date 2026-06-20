"use server";

import { auth } from "@/lib/auth";
import { log } from "@/core/audit/logger";
import { getProvider } from "./providers";
import type { SharePayload } from "./types";

interface ShareReflectionInput {
  title: string;
  content: string;
  createdAt: string;
}

export async function shareReflectionToDiscord(
  input: ShareReflectionInput
): Promise<{ success: boolean; error?: string }> {
  // 1. セッション検証
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "ログインが必要です" };
  }

  // 2. ペイロード構築
  const payload: SharePayload = {
    title: input.title,
    content: input.content,
    createdAt: input.createdAt,
    userName: session.user.name || undefined,
  };

  // 3. Provider経由で送信
  const provider = getProvider("discord");
  const result = await provider.send(payload);

  // 4. 監査ログ記録
  if (result.success) {
    await log({
      actorId: session.user.id,
      category: "admin",
      action: "discord.share.reflection",
      targetType: "reflection",
      targetId: input.title,
      severity: "info",
      metadata: {
        title: input.title,
        contentLength: input.content.length,
      },
    });
  }

  return result;
}
