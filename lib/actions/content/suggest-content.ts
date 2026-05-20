"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SuggestContentInput = {
  url: string;
  title: string;
  description?: string;
  road: string;
  tags: string[];
  type: "note" | "youtube" | "blog" | "book" | "tool";
};

export type SuggestContentActionResult = {
  ok: boolean;
  error?: string;
};

export async function suggestContentAction(
  payload: SuggestContentInput
): Promise<SuggestContentActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "ログインが必要です。" };
  }

  const { url, title, description, road, tags, type } = payload;

  if (!url || !title || !road || !type) {
    return { ok: false, error: "必須入力項目が不足しています。" };
  }

  // URL simple format check
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return { ok: false, error: "URLは http:// または https:// から入力してください。" };
  }

  try {
    await prisma.suggestedContent.create({
      data: {
        title,
        url,
        type,
        road,
        tags: tags || [],
        description: description || null,
        createdBy: session.user.id,
      },
    });

    return { ok: true };
  } catch (error) {
    console.error("[SUGGEST_CONTENT_ACTION_ERROR]", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "コンテンツの共有に失敗しました。",
    };
  }
}
