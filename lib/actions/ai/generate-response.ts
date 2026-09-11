"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { generateAiResponseSchema } from "@/lib/validators/ai.validator";
import { userRepository } from "@/lib/repositories/user.repository";
import { dailyLogRepository } from "@/lib/repositories/daily-log.repository";
import { buildUserMessage, extractSmallAction, YOHAKU_SYSTEM_PROMPT } from "@/lib/prompts/yohaku-system-prompt";
import { checkAIAvailability, generateText } from "@/lib/ai/gemini";

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

    // 3. Verify user exists
    const user = await userRepository.findById(userId);
    if (!user) {
      return { ok: false, error: "ユーザーが見つかりません。" };
    }

    // 4. Resolve Premium managed AI or the free user's BYOK connection.
    if (!(await checkAIAvailability(userId)).available) {
      return { ok: false, error: "AI接続を利用できません。無料プランの場合は設定画面からGeminiまたはGroq APIキーを登録してください。" };
    }

    // 5. Build user message with mood tag context
    const userMessage = buildUserMessage(validatedInput, moodTag);

    // 6. Generate Response via AI Service
    const { text: response } = await generateText(userMessage, YOHAKU_SYSTEM_PROMPT, { userId, taskClass: "standard" });

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
