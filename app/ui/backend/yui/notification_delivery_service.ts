import { getMorningBrief } from "./brief_service";
import {
  listYuiCalendarEvents,
  listYuiDecisions,
  listYuiEvents,
  listYuiGoals,
  listYuiReflections,
  listYuiConversationsSince,
  listYuiMemories,
} from "./service";
import { refineNotificationWithAI } from "./ai_integration_service";
import type { YuiCalendarEvent, YuiEvent, YuiGoal, YuiNotificationPreview } from "./models";
import { normalizeNotificationCopy } from "./notification_copy";
import { recentBriefs } from "./brief-history";
import { formatTimeInZone, getZonedDayWindow } from "./timezone";
import { isTestContent, isUserActivity, isMemoryCandidateContent } from "@/lib/yui-ux";

function uniqueText(values: Array<string | null | undefined>, limit = 4): string[] {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))].slice(0, limit);
}

function formatSchedule(events: YuiCalendarEvent[], timeZone: string): string {
  if (events.length === 0) return "大きな予定は登録されていません";

  return events
    .slice(0, 4)
    .map((event) => {
      const time = formatTimeInZone(new Date(event.start_at), timeZone);
      return `${time} ${event.title}`;
    })
    .join("、");
}

function goalIdOf(event: YuiEvent): string | null {
  const goalId = event.metadata?.goal_id;
  return typeof goalId === "string" && goalId.trim() ? goalId : null;
}

function isMeaningfulProgressEvent(event: YuiEvent): boolean {
  return isUserActivity(event) && ![
    "conversation",
    "conversation_created",
    "ai_connection_test",
    "ai_request",
    "memory_candidate_created",
    "memory_created",
    "reflection_created",
  ].includes(event.event_type);
}

function buildMorningFallback(input: {
  yesterdaySummary: string;
  priority: string;
  reason: string;
  nextAction: string;
  todayCalendar: YuiCalendarEvent[];
  timeZone: string;
}): string {
  const schedule = formatSchedule(input.todayCalendar, input.timeZone);
  const workloadAdvice = input.todayCalendar.length >= 4
    ? "今日は予定が多めです。新しい仕事を増やすより、重要な一つを終えるための余白を先に守りましょう。"
    : "予定の間に余白があります。連絡対応で埋めず、いちばん考える価値のある仕事に使いましょう。";

  return [
    "おはようございます。",
    `【昨日からの継続】\n${input.yesterdaySummary || "昨日からの明確な持ち越しは記録されていません。"}`,
    `【今日の見通し】\n${schedule}。`,
    `【今日の焦点】\n「${input.priority}」を軸にしましょう。${input.reason}`,
    `【秘書から】\n${workloadAdvice}`,
    `【最初の一手】\n${input.nextAction}`,
  ].join("\n\n");
}

function buildEveningFallback(input: {
  todayEvents: YuiEvent[];
  todayCalendar: YuiCalendarEvent[];
  tomorrowCalendar: YuiCalendarEvent[];
  goals: YuiGoal[];
  insight: string | null;
  decision: string | null;
  nextAction: string | null;
  timeZone: string;
  conversations: string[];
}): string {
  const progressEvents = input.todayEvents.filter(isMeaningfulProgressEvent);
  const activityTitles = uniqueText(progressEvents.map((event) => event.title), 4);
  const calendarTitles = uniqueText(input.todayCalendar.map((event) => event.title), 3);
  const activeGoal = input.goals.find((goal) => goal.status === "active") ?? input.goals[0] ?? null;
  const goalEvents = activeGoal
    ? progressEvents.filter((event) => goalIdOf(event) === activeGoal.id)
    : [];

  const progress = activityTitles.length > 0
    ? `${activityTitles.join("、")}に関する記録が残っています。`
    : calendarTitles.length > 0
      ? `今日は${calendarTitles.join("、")}の予定がありました。実行・完了したかは記録から確認できません。`
      : "今日の活動記録はまだありません。";

  const goalConnection = activeGoal
    ? goalEvents.length > 0
      ? `目的「${activeGoal.title}」につながる動きが${goalEvents.length}件記録されています。現在の進捗は${activeGoal.progress}%です。`
      : ""
    : "";

  const observation = input.insight
    ? `振り返りには「${input.insight}」という気づきが残っています。`
    : input.decision
      ? `今日は「${input.decision}」という決定が記録されています。明日の行動にも反映させましょう。`
      : "";

  const tomorrow = formatSchedule(input.tomorrowCalendar, input.timeZone);
  const advice = input.tomorrowCalendar.length >= 4
    ? "明日は予定が多めです。空き時間をすべて仕事で埋めず、目的に直結する一つを先に確保するのがおすすめです。"
    : input.nextAction
      ? `明日の最初の一手は「${input.nextAction}」です。予定が動く前に、短い時間でも着手できる形まで小さくしておきましょう。`
      : "";

  return [
    `【今日の記録】\n${progress}`,
    input.conversations.length ? `【今日話していたこと】\n${input.conversations.map(text => `「${text}」`).join("\n")}` : "",
    goalConnection ? `【目的とのつながり】\n${goalConnection}` : "",
    observation ? `【今日の気づき・決定】\n${observation}` : "",
    input.tomorrowCalendar.length ? `【明日の予定】\n${tomorrow}。${advice}` : "",
    !activityTitles.length && !input.conversations.length && !observation ? "今日、残しておきたい出来事があれば一言教えてください。" : "",
  ].filter(Boolean).join("\n\n");
}

export async function generateNotificationPreviews(
  userId: string,
  options: { aiTypes?: Array<"morning" | "evening">; timeZone?: string } = {},
): Promise<{
  morning: YuiNotificationPreview;
  evening: YuiNotificationPreview;
}> {
  const now = new Date();
  const isoString = now.toISOString();
  const timeZone = options.timeZone || "Asia/Tokyo";
  const todayWindow = getZonedDayWindow(now, timeZone);
  const tomorrowWindow = getZonedDayWindow(now, timeZone, 1);
  const startOfDay = todayWindow.start;
  const startOfTomorrow = tomorrowWindow.start;
  const endOfTomorrow = tomorrowWindow.end;

  const [morningBrief, goals, events, reflections, decisions, todayCalendar, tomorrowCalendar, conversations, memories] = await Promise.all([
    // The final notification has its own AI synthesis. Re-refining the morning
    // brief here would spend a second request for the same user-facing result.
    getMorningBrief(userId, { useAi: false, timeZone }),
    listYuiGoals(userId, 20),
    listYuiEvents(userId, 100),
    listYuiReflections(userId, 10),
    listYuiDecisions(userId, 20),
    listYuiCalendarEvents(userId, { start: startOfDay, end: startOfTomorrow, limit: 50 }),
    listYuiCalendarEvents(userId, { start: startOfTomorrow, end: endOfTomorrow, limit: 50 }),
    listYuiConversationsSince(userId, startOfDay, 100),
    listYuiMemories(userId, 15),
  ]);
  const todayConversations = conversations.filter(item => item.role === "user" && new Date(item.created_at) < startOfTomorrow && isMemoryCandidateContent(item.content));
  const historicalContext = {
    date: isoString,
    previousBriefs: options.aiTypes?.length ? await recentBriefs(userId) : [],
    pastMemories: memories.filter(item => !isTestContent(`${item.title} ${item.body}`)).map(item => ({ date: item.created_at, title: item.title, content: (item.summary || item.body || "").slice(0, 250) })),
    pastReflections: reflections.filter(item => new Date(item.created_at) < startOfDay).slice(0, 3).map(item => ({ date: item.created_at, summary: item.summary?.slice(0, 250) })),
  };
  const everydayTodayCalendar = todayCalendar.filter((event) => !isTestContent(`${event.title} ${event.description ?? ""}`));
  const everydayTomorrowCalendar = tomorrowCalendar.filter((event) => !isTestContent(`${event.title} ${event.description ?? ""}`));

  // Generate Morning Notification Message (Inherits AI refined message if present)
  const morningTitle = "今日の作戦会議";
  const morningMessage = buildMorningFallback({
    yesterdaySummary: morningBrief.yesterdaySummary,
    priority: morningBrief.priority,
    reason: morningBrief.reason,
    nextAction: morningBrief.nextAction,
    todayCalendar: everydayTodayCalendar,
    timeZone,
  });

  // Calculate today's events for Evening Preview
  const todayEvents = events.filter((evt) => {
    const evtTime = new Date(evt.occurred_at || evt.created_at || 0).getTime();
    return evtTime >= startOfDay.getTime()
      && evtTime < startOfTomorrow.getTime()
      && !isTestContent(`${evt.title} ${evt.content}`);
  });
  const everydayGoals = goals.filter((goal) => !isTestContent(`${goal.title} ${goal.description ?? ""}`));

  // Generate Evening Notification Message
  const todayReflections = reflections.filter((reflection) => {
    const timestamp = new Date(reflection.created_at).getTime();
    return timestamp >= startOfDay.getTime() && timestamp < startOfTomorrow.getTime();
  });
  const todayDecisions = decisions.filter((decision) => {
    const timestamp = new Date(decision.created_at).getTime();
    return timestamp >= startOfDay.getTime() && timestamp < startOfTomorrow.getTime();
  });
  const insight = todayReflections[0]?.insights?.[0] ?? todayReflections[0]?.summary ?? null;
  const decision = todayDecisions[0]?.decision ?? null;
  const nextAction = todayReflections[0]?.next_actions?.[0] ?? morningBrief.nextAction ?? null;

  const eveningTitle = "今日を明日につなぐ振り返り";
  const eveningMessage = buildEveningFallback({
    todayEvents,
    todayCalendar: everydayTodayCalendar,
    tomorrowCalendar: everydayTomorrowCalendar,
    goals: everydayGoals,
    insight,
    decision,
    nextAction,
    timeZone,
    conversations: todayConversations.slice(-4).map(item => item.content.slice(0, 250)),
  });

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

  const activeGoal = everydayGoals.find((goal) => goal.status === "active") ?? everydayGoals[0] ?? null;
  const aiTypes = new Set(options.aiTypes ?? []);
  const [refinedMorning, refinedEvening] = await Promise.all([
    aiTypes.has("morning") ? refineNotificationWithAI(userId, rawMorningPreview, {
      ...historicalContext,
      yesterdaySummary: morningBrief.yesterdaySummary,
      priority: morningBrief.priority,
      priorityReason: morningBrief.reason,
      firstAction: morningBrief.nextAction,
      todayCalendar: everydayTodayCalendar.map((event) => ({ title: event.title, startAt: event.start_at, endAt: event.end_at })),
      activeGoal: activeGoal ? { title: activeGoal.title, description: activeGoal.description, progress: activeGoal.progress } : null,
      priorityItems: morningBrief.priorityItems?.slice(0, 5) ?? [],
    }) : Promise.resolve(rawMorningPreview),
    aiTypes.has("evening") ? refineNotificationWithAI(userId, rawEveningPreview, {
      ...historicalContext,
      todayProgress: todayEvents.filter(isMeaningfulProgressEvent).slice(0, 12).map((event) => ({
        type: event.event_type,
        title: event.title,
        content: event.content,
        goalId: goalIdOf(event),
        occurredAt: event.occurred_at,
      })),
      todayConversationSignals: todayConversations.slice(-6).map(item => ({ content: item.content.slice(0, 350), date: item.created_at })),
      todayCalendar: everydayTodayCalendar.map((event) => ({ title: event.title, startAt: event.start_at, endAt: event.end_at })),
      todayInsights: todayReflections.flatMap((reflection) => reflection.insights).slice(0, 5),
      todayNextActions: todayReflections.flatMap((reflection) => reflection.next_actions).slice(0, 5),
      todayDecisions: todayDecisions.slice(0, 5).map((item) => ({ decision: item.decision, rationale: item.rationale })),
      activeGoal: activeGoal ? { id: activeGoal.id, title: activeGoal.title, description: activeGoal.description, progress: activeGoal.progress } : null,
      tomorrowCalendar: everydayTomorrowCalendar.map((event) => ({ title: event.title, startAt: event.start_at, endAt: event.end_at })),
    }) : Promise.resolve(rawEveningPreview),
  ]);

  return {
    morning: {
      ...refinedMorning,
      message: normalizeNotificationCopy(refinedMorning.message, "morning"),
    },
    evening: {
      ...refinedEvening,
      message: normalizeNotificationCopy(refinedEvening.message, "evening"),
    },
  };
}

export async function generateNotificationPreview(
  userId: string,
  type: "morning" | "evening",
  options: { useAi?: boolean; timeZone?: string } = {},
): Promise<YuiNotificationPreview> {
  const previews = await generateNotificationPreviews(userId, {
    aiTypes: options.useAi === false ? [] : [type],
    timeZone: options.timeZone,
  });
  return previews[type];
}
