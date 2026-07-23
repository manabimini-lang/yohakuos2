import { getMorningBrief } from "./brief_service";
import { listYuiGoals, listYuiEvents, listYuiReflections } from "./service";
import { refineNotificationWithAI } from "./ai_integration_service";
import type { YuiNotificationPreview } from "./models";

export async function generateNotificationPreviews(userId: string): Promise<{
  morning: YuiNotificationPreview;
  evening: YuiNotificationPreview;
}> {
  const now = new Date();
  const isoString = now.toISOString();

  // Define today window for evening events calculation
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [morningBrief, goals, events, reflections] = await Promise.all([
    getMorningBrief(userId),
    listYuiGoals(userId, 10),
    listYuiEvents(userId, 50),
    listYuiReflections(userId, 1),
  ]);

  // Generate Morning Notification Message (Inherits AI refined message if present)
  const morningTitle = "今日の優先事項";
  let morningMessage = `${morningBrief.greeting}。\n\n`;
  if (morningBrief.yesterdaySummary) {
    morningMessage += `${morningBrief.yesterdaySummary}\n\n`;
  }
  morningMessage += `今日は「${morningBrief.summary}」を優先しましょう。\n\n${morningBrief.reason}`;
  if (morningBrief.nextAction) {
    morningMessage += `\n\nまず ${morningBrief.nextAction}`;
  }

  // Calculate today's events for Evening Preview
  const todayEvents = events.filter((evt) => {
    const evtTime = new Date(evt.occurred_at || evt.created_at || 0).getTime();
    return evtTime >= startOfDay.getTime() && evtTime <= endOfDay.getTime();
  });

  // Generate Evening Notification Message
  const eveningTitle = "本日の振り返り";
  let eveningMessage = "こんばんは。\n\n";

  if (todayEvents.length > 0) {
    eveningMessage += `今日はGoalに対して${todayEvents.length}件の進捗イベントがありました。\n\n`;
  } else if (goals.length > 0) {
    const activeGoal = goals[0];
    eveningMessage += `目標「${activeGoal.title}」に向かって一歩ずつ進めていきましょう。\n\n`;
  } else {
    eveningMessage += "今日一日お疲れさまでした。振り返りを記録して明日につなげましょう。\n\n";
  }

  if (reflections.length > 0 && reflections[0].insights?.length > 0) {
    eveningMessage += `直近の振り返り: 「${reflections[0].insights[0]}」\n\n`;
  }

  eveningMessage += "お疲れさまでした。";

  const rawMorningPreview: YuiNotificationPreview = {
    type: "morning",
    title: morningTitle,
    message: morningMessage,
    generatedAt: isoString,
  };

  const rawEveningPreview: YuiNotificationPreview = {
    type: "evening",
    title: eveningTitle,
    message: eveningMessage,
    generatedAt: isoString,
  };

  const [refinedMorning, refinedEvening] = await Promise.all([
    refineNotificationWithAI(userId, rawMorningPreview),
    refineNotificationWithAI(userId, rawEveningPreview),
  ]);

  return {
    morning: refinedMorning,
    evening: refinedEvening,
  };
}
