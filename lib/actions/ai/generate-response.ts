"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptKey } from "@/lib/encryption";
import { generateYohakuResponse } from "@/lib/ai/gemini";
import { revalidatePath } from "next/cache";

export async function generateAiResponseAction(input: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { ok: false, error: "ログインしてください。" };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, encryptedGeminiKey: true },
    });

    if (!user) {
      return { ok: false, error: "ユーザーが見つかりません。" };
    }

    // MVP: Only paid members can use AI
    if (user.role !== "PAID_MEMBER" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return { ok: false, error: "AI対話機能は有料会員限定です。" };
    }

    if (!user.encryptedGeminiKey) {
      return { ok: false, error: "APIキーが設定されていません。設定画面からGemini APIキーを登録してください。" };
    }

    let apiKey = "";
    try {
      apiKey = decryptKey(user.encryptedGeminiKey);
    } catch (e) {
      return { ok: false, error: "APIキーの復号化に失敗しました。再度設定画面から登録してください。" };
    }

    // Generate response
    const response = await generateYohakuResponse(apiKey, input);

    // Save log
    const aiLog = await prisma.aILog.create({
      data: {
        userId: user.id,
        input,
        response,
      },
    });

    revalidatePath("/member/ai/history");

    return { ok: true, data: { input, response, createdAt: aiLog.createdAt } };
  } catch (error: any) {
    console.error("[GENERATE_AI_RESPONSE]", error);
    return { ok: false, error: error.message || "AIの応答生成中にエラーが発生しました。" };
  }
}
