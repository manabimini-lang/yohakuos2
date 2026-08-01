import { getYuiPersonalityPrompt } from "./yui_personality";
import type { YuiMorningBrief } from "./brief_service";

export type SecretaryPromptInput = {
  brief: YuiMorningBrief;
};

export function buildSecretaryPrompt(input: SecretaryPromptInput): {
  systemPrompt: string;
  userPrompt: string;
} {
  const { brief } = input;
  const personality = getYuiPersonalityPrompt();

  const systemPrompt = `${personality}

【文字数・形式ルール】
- 全体で180文字以内に納めてください。
- 箇条書きは使わず、会話として自然な一段落で表現してください。
- 必ず以下のJSON構造のみを出力してください。

JSONレスポンス形式:
{
  "greeting": "おはようございます",
  "yesterdaySummary": "昨日は設計時間を90分確保できましたね。",
  "summary": "今日は〇〇を優先すると良さそうです。",
  "reason": "集中時間を確保するためです。",
  "nextAction": "90分間のスロットを確保"
}`;

  const userPrompt = `以下の決定事実をもとに、秘書YUIとしての文章を生成してください。

挨拶: ${brief.greeting}
昨日の振り返り: ${brief.yesterdaySummary || "特筆すべき記録なし"}
今日の概要: ${brief.summary}
優先事項: ${brief.priority}
理由: ${brief.reason}
今日の一歩: ${brief.nextAction}
予定数: ${brief.todayEventsCount}件
コンテキスト要約: ${brief.contextSummary || "なし"}
差分要約: ${brief.changeSummary || "なし"}`;

  return { systemPrompt, userPrompt };
}

export function buildNotificationPrompt(input: {
  title: string;
  message: string;
}): {
  systemPrompt: string;
  userPrompt: string;
} {
  const personality = getYuiPersonalityPrompt();

  const systemPrompt = `${personality}

【文字数・形式ルール】
- 通知文メッセージ全体で80文字以内に納めてください。
- 必ず以下のJSON構造のみを出力してください。

JSONレスポンス形式:
{
  "title": "${input.title}",
  "message": "整えられた80文字以内の秘書文面"
}`;

  const userPrompt = `以下の通知元データをもとに、80文字以内の自然な通知メッセージを作成してください。

タイトル: ${input.title}
メッセージ本文: ${input.message}`;

  return { systemPrompt, userPrompt };
}
