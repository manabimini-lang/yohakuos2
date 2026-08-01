import { computeYuiContext } from "./context_service";
import { computeYuiContinuity } from "./continuity_service";
import { listYuiCalendarEvents } from "./service";
import { listYuiRecommendations } from "./recommendation_service";
import { refineBriefWithAI } from "./ai_integration_service";
import { getGmailInsights } from "./gmail_service";
import { getUnifiedActions } from "./unified_action_service";
import { buildPriorityContext, type YuiPriorityItem } from "./priority_engine";

export type YuiMorningBrief = {
  greeting: string;
  yesterdaySummary: string;
  summary: string;
  priority: string;
  reason: string;
  nextAction: string;
  todayEventsCount: number;
  recommendationCount: number;
  contextSummary?: string;
  changeSummary?: string;
  priorityItems?: YuiPriorityItem[];
  nextBestActions?: YuiPriorityItem[];
};

function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return "おはようございます";
  }
  if (hour >= 12 && hour < 18) {
    return "こんにちは";
  }
  return "こんばんは";
}

export async function getMorningBrief(userId: string): Promise<YuiMorningBrief> {
  const now = new Date();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [context, continuity, calendarEvents, recommendations, gmailInsights, unifiedActions, priorityItems] = await Promise.all([
    computeYuiContext(userId),
    computeYuiContinuity(userId),
    listYuiCalendarEvents(userId, { start: startOfDay, end: endOfDay, limit: 50 }),
    listYuiRecommendations(userId, { status: "pending", limit: 50 }),
    getGmailInsights(userId).catch(() => []),
    getUnifiedActions(userId).catch(() => []),
    buildPriorityContext(userId),
  ]);

  const greeting = getGreeting(now);
  const unreadEmailCount = gmailInsights.length;
  const actionCount = unifiedActions.length;
  const summary = `${greeting}。今日は${calendarEvents.length}件の予定があり、未読メールは${unreadEmailCount}件です。${context.priority}を軸に、${context.nextAction.toLowerCase()}。`;
  const changeSummary = `新しい情報は${Math.max(0, calendarEvents.length)}件の予定と${Math.max(0, unreadEmailCount)}件の未読メールです。優先事項は${context.priority}に更新されました。`;

  const nextBestActions = priorityItems.slice(0, 3);
  const rawBrief: YuiMorningBrief = {
    greeting,
    yesterdaySummary: continuity.yesterdaySummary,
    summary,
    priority: context.priority,
    reason: context.reason,
    nextAction: context.nextAction,
    todayEventsCount: calendarEvents.length,
    recommendationCount: recommendations.length,
    contextSummary: `Goals / Memory / Reflection / Calendar / Gmail / Unified Actions を踏まえ、${context.priority}を今日の中心に据えます。提案件数は${Math.max(0, actionCount)}件です。`,
    changeSummary,
    priorityItems,
    nextBestActions,
  };

  return refineBriefWithAI(userId, rawBrief);
}
