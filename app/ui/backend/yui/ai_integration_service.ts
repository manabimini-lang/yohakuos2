import { checkAIAvailability, generateText, generateJSON } from "@/lib/ai/gemini";
import { buildSecretaryPrompt, buildNotificationPrompt } from "./prompt_builder";
import type { YuiMorningBrief } from "./brief_service";
import type { YuiNotificationPreview } from "./models";
import { extractReplyCharLimit, fitReplyToCharLimit } from "@/lib/yui-ux";

export async function isYuiAiEnabled(userId: string): Promise<boolean> {
  try {
    return (await checkAIAvailability(userId)).available;
  } catch (e) {
    return false;
  }
}

export async function refineBriefWithAI(
  userId: string,
  rawBrief: YuiMorningBrief,
): Promise<YuiMorningBrief> {
  const enabled = await isYuiAiEnabled(userId);
  if (!enabled) {
    return rawBrief;
  }

  try {
    const { systemPrompt, userPrompt } = buildSecretaryPrompt({ brief: rawBrief });
    const { text } = await generateText(userPrompt, systemPrompt, {
      userId,
      taskClass: "standard",
    });

    if (!text) {
      return rawBrief;
    }

    const jsonText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonText);

    if (typeof parsed !== "object" || parsed === null) {
      return rawBrief;
    }

    return {
      ...rawBrief,
      greeting: typeof parsed.greeting === "string" ? parsed.greeting : rawBrief.greeting,
      yesterdaySummary: typeof parsed.yesterdaySummary === "string" ? parsed.yesterdaySummary : rawBrief.yesterdaySummary,
      summary: typeof parsed.summary === "string" ? parsed.summary : rawBrief.summary,
      reason: typeof parsed.reason === "string" ? parsed.reason : rawBrief.reason,
      nextAction: typeof parsed.nextAction === "string" ? parsed.nextAction : rawBrief.nextAction,
      contextSummary: rawBrief.contextSummary,
      changeSummary: rawBrief.changeSummary,
      priorityItems: rawBrief.priorityItems,
      nextBestActions: rawBrief.nextBestActions,
    };
  } catch (e) {
    console.error("[YUI AI Integration] Failed to refine brief with AI, fallback to Rule Engine", e);
    return rawBrief;
  }
}

export async function refineNotificationWithAI(
  userId: string,
  rawPreview: YuiNotificationPreview,
  context?: Record<string, unknown>,
): Promise<YuiNotificationPreview> {
  const enabled = await isYuiAiEnabled(userId);
  if (!enabled) {
    return rawPreview;
  }

  try {
    const { systemPrompt, userPrompt } = buildNotificationPrompt({
      type: rawPreview.type,
      title: rawPreview.title,
      message: rawPreview.message,
      context,
    });

    const { text } = await generateText(userPrompt, systemPrompt, {
      userId,
      taskClass: "economy",
    });

    if (!text) {
      return rawPreview;
    }

    const jsonText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonText);

    if (typeof parsed !== "object" || parsed === null || typeof parsed.message !== "string") {
      return rawPreview;
    }

    return {
      ...rawPreview,
      title: typeof parsed.title === "string" ? parsed.title : rawPreview.title,
      message: parsed.message,
    };
  } catch (e) {
    console.error("[YUI AI Integration] Failed to refine notification with AI, fallback to Rule Engine", e);
    return rawPreview;
  }
}

export interface YuiIntentResponse {
  reply: string;
  error?: boolean;
  proposedAction?: {
    type:
      | "create_goal"
      | "update_goal"
      | "delete_goal"
      | "create_milestone"
      | "update_milestone"
      | "delete_milestone"
      | "create_calendar_event";
    params: any;
  } | null;
}

export async function generateYuiResponse(
  userId: string,
  userMessage: string,
  chatHistory: { role: string; content: string }[],
): Promise<YuiIntentResponse> {
  const requestedCharLimit = extractReplyCharLimit(userMessage);
  const enabled = await isYuiAiEnabled(userId);
  if (!enabled) {
    return {
      error: true,
      reply: "AI相談が未接続です。無料プランでは設定画面からご自身のGeminiまたはGroq APIキーを登録してください。PremiumではAPIキーは不要です。",
    };
  }

  const systemInstruction = `
あなたはユーザーを支えるパーソナルAIアシスタント「YUI」です。
ユーザーの発言を理解し、共感を持って簡潔に回答してください。また、ユーザーが「目標（Goal）の作成・更新・削除」「マイルストーンの作成・更新・削除」「カレンダーの予定（イベント）作成」を望んでいる場合、その意図（Intent）を検出してアクションを提案してください。

カレンダーの予定（日付・時間）を検出した場合は、必ず年・月・日・開始時刻・終了時刻を特定し、params に timezone (Asia/Tokyo) や ISO形式 (YYYY-MM-DDTHH:mm:ssZ) の日時の値を含めてください。
目標やマイルストーンの更新・削除で対象IDが分からない場合は、params に title_hint を入れてください。YUIは勝手に実行せず、必ず確認を求める文章にしてください。
現在時刻は: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })} です。
${requestedCharLimit ? `ユーザーは回答を${requestedCharLimit}字以内と指定しています。replyは挨拶や依頼の言い換えを省き、必ず${requestedCharLimit}字以内にしてください。` : "ユーザーが文字数・件数・形式を指定した場合は、その条件を優先して守ってください。"}

返却するJSONのスキーマ:
{
  "reply": "ユーザーへの分かりやすい対話の返答テキスト。カレンダーや目標を変更する場合は、これから実行する予定であることを明示し、確認を求める。",
  "proposedAction": {
    "type": "create_goal" | "update_goal" | "delete_goal" | "create_milestone" | "update_milestone" | "delete_milestone" | "create_calendar_event",
    "params": {
      // type が "create_goal" の場合: { "title": "目標タイトル", "description": "説明" }
      // type が "update_goal" の場合: { "goal_id": "分かる場合のみ", "title_hint": "対象名のヒント", "title": "新タイトル", "description": "説明", "status": "active|paused|completed", "progress": 0-100 }
      // type が "delete_goal" の場合: { "goal_id": "分かる場合のみ", "title_hint": "対象名のヒント" }
      // type が "create_milestone" の場合: { "goal_id": "分かる場合のみ", "title": "マイルストーン名" }
      // type が "update_milestone" の場合: { "milestone_id": "分かる場合のみ", "title_hint": "対象名のヒント", "title": "新タイトル", "status": "pending|completed" }
      // type が "delete_milestone" の場合: { "milestone_id": "分かる場合のみ", "title_hint": "対象名のヒント" }
      // type が "create_calendar_event" の場合: { "title": "予定名", "description": "詳細", "start_at": "ISO形式", "end_at": "ISO形式" }
    }
  }
}
また、上記に該当しない日常会話の場合は、proposedAction を null に設定してください。
`;

  const historyText = chatHistory
    .slice(-10)
    .map((h) => `${h.role === "user" ? "ユーザー" : "YUI"}: ${h.content.slice(0, 300)}`)
    .join("\n");

  const prompt = `
これまでの対話履歴:
${historyText}

最新のユーザーメッセージ:
ユーザー: ${userMessage}

上記のやり取りから、YUIとしての対話返答と、もしアクション（目標・マイルストーン・予定の作成）が要求されていればそのパラメータをJSONで抽出してください。
`;

  try {
    const { data } = await generateJSON<YuiIntentResponse>(prompt, systemInstruction, {
      userId,
      allowEnvFallback: true,
      taskClass: "standard",
    });
    if (requestedCharLimit && !data.proposedAction && typeof data.reply === "string") {
      return { ...data, reply: fitReplyToCharLimit(data.reply, requestedCharLimit) };
    }
    return data;
  } catch (e) {
    console.error("[YUI AI] Failed to generate Yui response", e);
    return {
      error: true,
      reply: "すみません、少し考えがまとまりませんでした。もう一度話しかけてみてください。",
    };
  }
}
