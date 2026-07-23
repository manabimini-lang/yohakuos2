import { computeYuiContext } from "./context_service";
import { listYuiCalendarEvents } from "./service";
import { listYuiRecommendations } from "./recommendation_service";

export type YuiMorningBrief = {
  greeting: string;
  summary: string;
  priority: string;
  reason: string;
  nextAction: string;
  todayEventsCount: number;
  recommendationCount: number;
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

  // Define today window for calendar events
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [context, calendarEvents, recommendations] = await Promise.all([
    computeYuiContext(userId),
    listYuiCalendarEvents(userId, { start: startOfDay, end: endOfDay, limit: 50 }),
    listYuiRecommendations(userId, { status: "pending", limit: 50 }),
  ]);

  const greeting = getGreeting(now);
  const summary = `${context.priority}が現在の最優先事項です。`;

  return {
    greeting,
    summary,
    priority: context.priority,
    reason: context.reason,
    nextAction: context.nextAction,
    todayEventsCount: calendarEvents.length,
    recommendationCount: recommendations.length,
  };
}
