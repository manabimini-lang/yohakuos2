"use server";

import { auth } from "@/lib/auth";
import { generateYohaku } from "@/lib/ai/yohaku-generator";
import type { YohakuResult } from "@/lib/ai/yohaku-generator"; // 型定義のみインポート

export async function generateYohakuAction(): Promise<YohakuResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return await generateYohaku(session.user.id);
}