"use server";

import { auth } from "@/lib/auth";
import { decryptKey } from "@/lib/encryption";
import { revalidatePath } from "next/cache";
import { generateAiResponseSchema } from "@/lib/validators/ai.validator";
import { userRepository } from "@/lib/repositories/user.repository";
import { subscriptionService } from "@/lib/services/subscription.service";
import { apiKeyRepository } from "@/lib/repositories/api-key.repository";
import { aiService } from "@/lib/services/ai.service";
import { dailyLogRepository } from "@/lib/repositories/daily-log.repository";
import { buildUserMessage, extractSmallAction } from "@/lib/prompts/yohaku-system-prompt";

export async function generateAiResponseAction(input: string, moodTag?: string) {
  try {
    // 1. Validate Input
    const parsed = generateAiResponseSchema.safeParse({ input });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "入力内容が正しくありません。" };
    }
    const validatedInput = parsed.data.input;

    // 2. Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "ログインしてください。" };
    }
    const userId = session.user.id;

    // 3. Check Authorization (Admin or Active Subscription)
    const user = await userRepository.findById(userId);
    if (!user) {
      return { ok: false, error: "ユーザーが見つかりません。" };
    }

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    const hasActiveSub = await subscriptionService.hasActiveSubscription(userId);

    if (!isAdmin && !hasActiveSub) {
      return { ok: false, error: "AI対話機能は有料プランでのみご利用いただけます。" };
    }

    // 4. Fetch API Key
    const apiKeyRecord = await apiKeyRepository.findByUserIdAndProvider(userId, "gemini");
    if (!apiKeyRecord?.encryptedKey) {
      return { ok: false, error: "APIキーが設定されていません。設定画面からGemini APIキーを登録してください。" };
    }

    let apiKey = "";
    try {
      apiKey = decryptKey(apiKeyRecord.encryptedKey);
    } catch (e) {
      return { ok: false, error: "APIキーの復号化に失敗しました。再度設定画面から登録してください。" };
    }

    // 5. Build user message with mood tag context
    const userMessage = buildUserMessage(validatedInput, moodTag);

    // 6. Generate Response via AI Service
    const response = await aiService.createAIResponse("gemini", apiKey, userMessage);

    // 7. Extract structured data from response
    const smallAction = extractSmallAction(response);

    // 8. Save Log via Repository (with moodTag and smallAction)
    const dailyLog = await dailyLogRepository.createLog(
      userId,
      validatedInput,
      response,
      moodTag,
      smallAction
    );

    revalidatePath("/member/ai/history");
    revalidatePath("/member");

    return {
      ok: true,
      data: {
        input: validatedInput,
        response,
        smallAction,
        moodTag,
        createdAt: dailyLog.createdAt,
      },
    };
  } catch (error: any) {
    console.error("[GENERATE_AI_RESPONSE]", error);
    // ユーザーに威圧感を与えないエラーメッセージ
    return { ok: false, error: "AIとの通信がうまくいきませんでした。少し時間を置いて、もう一度試してみてください。" };
  }
}
