import {
  listYuiReflections,
  listYuiDecisions,
  listYuiConversations,
  listYuiEvents,
  listYuiCalendarEvents,
  listYuiGoals,
} from "./service";
import { computeYuiContext } from "./context_service";
import type { YuiContinuitySummary } from "./models";

export async function computeYuiContinuity(userId: string): Promise<YuiContinuitySummary> {
  const now = new Date();

  // Define yesterday window in JST (00:00:00 to 23:59:59 of yesterday)
  const startOfYesterday = new Date(now);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  startOfYesterday.setHours(0, 0, 0, 0);

  const endOfYesterday = new Date(now);
  endOfYesterday.setDate(endOfYesterday.getDate() - 1);
  endOfYesterday.setHours(23, 59, 59, 999);

  const yesterdayStartMs = startOfYesterday.getTime();
  const yesterdayEndMs = endOfYesterday.getTime();

  const [reflections, decisions, conversations, events, calendarEvents, goals, context] =
    await Promise.all([
      listYuiReflections(userId, 10),
      listYuiDecisions(userId, 10),
      listYuiConversations(userId, 20),
      listYuiEvents(userId, 50),
      listYuiCalendarEvents(userId, { limit: 50 }),
      listYuiGoals(userId, 10),
      computeYuiContext(userId),
    ]);

  // 1. Check yesterday's Reflection
  const yesterdayReflections = reflections.filter((r) => {
    const t = new Date(r.created_at).getTime();
    return t >= yesterdayStartMs && t <= yesterdayEndMs;
  });

  // 2. Check yesterday's Decisions
  const yesterdayDecisions = decisions.filter((d) => {
    const t = new Date(d.created_at).getTime();
    return t >= yesterdayStartMs && t <= yesterdayEndMs;
  });

  // 3. Check yesterday's Conversations
  const yesterdayConversations = conversations.filter((c) => {
    const t = new Date(c.created_at).getTime();
    return t >= yesterdayStartMs && t <= yesterdayEndMs;
  });

  // 4. Check yesterday's Events / Calendar Events
  const yesterdayEvents = events.filter((e) => {
    const t = new Date(e.occurred_at || e.created_at).getTime();
    return t >= yesterdayStartMs && t <= yesterdayEndMs;
  });

  const yesterdayCalendarEvents = calendarEvents.filter((ce) => {
    const t = new Date(ce.start_at).getTime();
    return t >= yesterdayStartMs && t <= yesterdayEndMs;
  });

  // Build yesterday's summary
  let yesterdaySummary = "昨日は静かな一日でした。今日からまた始めましょう。";

  if (yesterdayReflections.length > 0) {
    const ref = yesterdayReflections[0];
    const insight = ref.insights?.[0] || ref.summary;
    yesterdaySummary = `昨日は「${insight}」の振り返りを行いましたね。`;
  } else if (yesterdayDecisions.length > 0) {
    const dec = yesterdayDecisions[0];
    yesterdaySummary = `昨日は意志決定「${dec.question}」に取り組み、方針を整理しました。`;
  } else if (yesterdayCalendarEvents.length > 0 || yesterdayEvents.length > 0) {
    const totalCount = yesterdayCalendarEvents.length + yesterdayEvents.length;
    yesterdaySummary = `昨日は ${totalCount}件の予定やアクティビティに取り組みました。`;
  } else if (yesterdayConversations.length > 0) {
    yesterdaySummary = `昨日はチャットを通じてたくさん思考や対話を整理しましたね。`;
  } else if (goals.some((g) => new Date(g.updated_at).getTime() >= yesterdayStartMs)) {
    yesterdaySummary = `昨日は目標に向かって一歩前進しました。`;
  }

  // Build continuity message (Yesterday -> Today -> Next Action)
  const todayFocus = context.priority;
  let continuityMessage = `${yesterdaySummary}\n\n今日は「${todayFocus}」に注力し、${context.nextAction}`;

  return {
    yesterdaySummary,
    todayFocus,
    continuityMessage,
  };
}
