import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeYuiContext } from "./context_service";
import { computeYuiContinuity } from "./continuity_service";
import { listYuiCalendarEvents, listYuiConversations, listYuiGoals, listYuiReflections } from "./service";
import { listYuiRecommendations } from "./recommendation_service";
import { refineBriefWithAI } from "./ai_integration_service";
import { getGmailInsights } from "./gmail_service";
import { getUnifiedActions } from "./unified_action_service";
import { buildPriorityContext, type YuiPriorityItem } from "./priority_engine";

const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop: keyof SupabaseClient) {
    const target = getSupabaseAdmin();
    const value = target[prop];
    return typeof value === "function" ? value.bind(target) : value;
  },
});

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

function stableJson(value: unknown): string {
  return JSON.stringify(value, (_, item) => {
    if (Array.isArray(item)) {
      return item
        .map((entry) => (typeof entry === "object" && entry !== null ? Object.fromEntries(Object.entries(entry as Record<string, unknown>).sort()) : entry))
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    }

    if (item && typeof item === "object") {
      return Object.fromEntries(Object.entries(item as Record<string, unknown>).sort());
    }

    return item;
  });
}

function buildContextHash(payload: Record<string, unknown>): string {
  return createHash("sha256").update(stableJson(payload)).digest("hex");
}

async function readCachedBrief(userId: string, contextHash: string): Promise<YuiMorningBrief | null> {
  const { data, error } = await supabaseAdmin
    .from("yui_daily_briefs")
    .select("brief")
    .eq("user_id", userId)
    .eq("context_hash", contextHash)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.brief) {
    return null;
  }

  return data.brief as YuiMorningBrief;
}

async function saveCachedBrief(userId: string, brief: YuiMorningBrief, priorityItems: YuiPriorityItem[], contextHash: string) {
  const payload = {
    user_id: userId,
    brief,
    priority_json: priorityItems,
    context_hash: contextHash,
    generated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("yui_daily_briefs")
    .upsert(payload, { onConflict: "user_id,context_hash" });

  if (error) {
    console.error("Failed to cache YUI morning brief", error);
  }
}

export async function refreshMorningBriefCache(userId: string): Promise<YuiMorningBrief> {
  return getMorningBrief(userId);
}

export async function getMorningBrief(userId: string): Promise<YuiMorningBrief> {
  const now = new Date();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [context, continuity, calendarEvents, recommendations, gmailInsights, unifiedActions, priorityItems, goals, reflections, conversations] = await Promise.all([
    computeYuiContext(userId),
    computeYuiContinuity(userId),
    listYuiCalendarEvents(userId, { start: startOfDay, end: endOfDay, limit: 50 }),
    listYuiRecommendations(userId, { status: "pending", limit: 50 }),
    getGmailInsights(userId).catch(() => []),
    getUnifiedActions(userId).catch(() => []),
    buildPriorityContext(userId),
    listYuiGoals(userId, 20),
    listYuiReflections(userId, 10),
    listYuiConversations(userId, 20),
  ]);

  const greeting = getGreeting(now);
  const unreadEmailCount = gmailInsights.length;
  const actionCount = unifiedActions.length;
  const contextHash = buildContextHash({
    calendarEventIds: calendarEvents.map((event) => event.id).sort(),
    gmailInsightIds: gmailInsights.map((email) => email.id).sort(),
    goals: goals.map((goal) => ({ id: goal.id, title: goal.title, description: goal.description ?? null, status: goal.status, updated_at: goal.updated_at ?? null })).sort((a, b) => a.id.localeCompare(b.id)),
    reflections: reflections.map((reflection) => ({ id: reflection.id, summary: reflection.summary, insights: reflection.insights, next_actions: reflection.next_actions, created_at: reflection.created_at })).sort((a, b) => a.id.localeCompare(b.id)),
    conversations: conversations.map((conversation) => ({ id: conversation.id, content: conversation.content, created_at: conversation.created_at })).sort((a, b) => a.id.localeCompare(b.id)),
    unifiedActions: unifiedActions.map((action) => ({ id: action.id, title: action.title, description: action.description, priority: action.priority, actionType: action.actionType })).sort((a, b) => a.id.localeCompare(b.id)),
    priorityItems: priorityItems.map((item) => ({ id: item.id, title: item.title, score: item.score, actionType: item.actionType })).sort((a, b) => a.id.localeCompare(b.id)),
  });

  const cachedBrief = await readCachedBrief(userId, contextHash);
  if (cachedBrief) {
    return cachedBrief;
  }

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

  const refinedBrief = await refineBriefWithAI(userId, rawBrief);
  await saveCachedBrief(userId, refinedBrief, priorityItems, contextHash);
  return refinedBrief;
}
