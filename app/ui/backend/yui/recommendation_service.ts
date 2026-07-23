import { supabaseAdmin } from "@/lib/supabase/admin";
import { createYuiEvent, createYuiSuggestedTimeBlock, ensureYuiCalendarActionFromTimeBlock, listYuiCalendarEvents, listYuiDecisionsSince, listYuiGoals, listYuiMemoriesSince, listYuiSuggestedTimeBlocks, listYuiConversationsSince, listYuiEvents, getYuiProfile } from "./service";
import type {
  CreateYuiRecommendationInput,
  YuiCalendarEvent,
  YuiConversation,
  YuiDecision,
  YuiEvent,
  YuiGoal,
  YuiMemory,
  YuiRecommendation,
  YuiSuggestedTimeBlock,
  YuiSuggestedTimeBlockInput,
  YuiProfile,
} from "./models";

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

type RecommendationContent = {
  summary: string;
  proposed_start_at: string;
  proposed_end_at: string;
  proposed_label: string;
  topic: string;
  context_excerpt: string;
  goal_title: string | null;
};

type RecommendationContext = {
  profile: YuiProfile | null;
  currentGoal: YuiGoal | null;
  memories: YuiMemory[];
  decisions: YuiDecision[];
  conversations: YuiConversation[];
  events: YuiEvent[];
  calendarEvents: YuiCalendarEvent[];
  focusText: string;
};

function ensureText(value?: string | null) {
  return String(value ?? "").trim();
}

function normalizeRecommendationType(value?: string) {
  const type = ensureText(value).toLowerCase().replace(/\s+/g, "_");
  if (type === "time_block" || type === "decision" || type === "task" || type === "reflection") {
    return type;
  }
  return "time_block";
}

function normalizeRecommendationStatus(value?: string) {
  const status = ensureText(value).toLowerCase().replace(/\s+/g, "_");
  if (status === "pending" || status === "accepted" || status === "rejected" || status === "completed") {
    return status;
  }
  return "pending";
}

function normalizeRecommendationText(value: string) {
  return String(value ?? "").trim();
}

function normalizeIds(values?: string[]) {
  if (!values) return [];
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function parseRecommendationContent(content: string): RecommendationContent | null {
  try {
    const data = JSON.parse(content);
    if (!data || typeof data !== "object") return null;
    const record = data as Record<string, unknown>;
    return {
      summary: ensureText(record.summary as string | null),
      proposed_start_at: ensureText(record.proposed_start_at as string | null),
      proposed_end_at: ensureText(record.proposed_end_at as string | null),
      proposed_label: ensureText(record.proposed_label as string | null),
      topic: ensureText(record.topic as string | null),
      context_excerpt: ensureText(record.context_excerpt as string | null),
      goal_title: record.goal_title == null ? null : ensureText(record.goal_title as string),
    };
  } catch {
    return null;
  }
}

function buildRecommendationContent(input: RecommendationContent) {
  return JSON.stringify(input);
}

function getWindowStart(reference = new Date()) {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getWindowEnd(reference = new Date(), days = 14) {
  const end = getWindowStart(reference);
  end.setDate(end.getDate() + days);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getWorkDayWindow(date: Date) {
  const start = new Date(date);
  start.setHours(9, 0, 0, 0);
  const end = new Date(date);
  end.setHours(18, 0, 0, 0);
  return { start, end };
}

function clampToRange(value: Date, min: Date, max: Date) {
  return new Date(Math.min(Math.max(value.getTime(), min.getTime()), max.getTime()));
}

function mergeCalendarEvents(events: YuiCalendarEvent[]) {
  const sorted = [...events].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  const merged: Array<{ start: Date; end: Date }> = [];

  for (const event of sorted) {
    const start = new Date(event.start_at);
    const end = new Date(event.end_at);
    const last = merged[merged.length - 1];

    if (!last || start.getTime() > last.end.getTime()) {
      merged.push({ start, end });
      continue;
    }

    if (end.getTime() > last.end.getTime()) {
      last.end = end;
    }
  }

  return merged;
}

function findBestGap(calendarEvents: YuiCalendarEvent[], reference = new Date()) {
  const searchStart = getWindowStart(reference);
  const searchEnd = getWindowEnd(reference, 14);
  const days: Array<{ start: Date; end: Date }> = [];
  const current = new Date(searchStart);

  while (current.getTime() <= searchEnd.getTime()) {
    const dayWindow = getWorkDayWindow(current);
    days.push(dayWindow);
    current.setDate(current.getDate() + 1);
  }

  const merged = mergeCalendarEvents(calendarEvents);
  const gaps: Array<{ start: Date; end: Date; minutes: number }> = [];

  for (const day of days) {
    const occupied = merged
      .map((range) => ({
        start: clampToRange(range.start, day.start, day.end),
        end: clampToRange(range.end, day.start, day.end),
      }))
      .filter((range) => range.end.getTime() > range.start.getTime());

    let cursor = new Date(day.start);
    for (const range of occupied) {
      if (range.start.getTime() > cursor.getTime()) {
        const minutes = Math.floor((range.start.getTime() - cursor.getTime()) / 60000);
        if (minutes >= 60) {
          gaps.push({ start: new Date(cursor), end: new Date(range.start), minutes });
        }
      }

      if (range.end.getTime() > cursor.getTime()) {
        cursor = new Date(range.end);
      }
    }

    if (cursor.getTime() < day.end.getTime()) {
      const minutes = Math.floor((day.end.getTime() - cursor.getTime()) / 60000);
      if (minutes >= 60) {
        gaps.push({ start: new Date(cursor), end: new Date(day.end), minutes });
      }
    }
  }

  return gaps.sort((a, b) => {
    if (b.minutes !== a.minutes) return b.minutes - a.minutes;
    return a.start.getTime() - b.start.getTime();
  })[0] ?? null;
}

function buildFallbackGap(reference = new Date()) {
  const start = new Date(reference);
  start.setDate(start.getDate() + 1);
  start.setHours(15, 0, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 90);
  return { start, end, minutes: 90 };
}

function buildTopic(context: RecommendationContext) {
  const focusText = context.focusText;
  const currentGoal = context.currentGoal?.title?.trim() || "";
  const topMemory = context.memories[0]?.title?.trim() || "";
  const topDecision = context.decisions[0]?.question?.trim() || "";

  const keywords = [
    /教材作成/.test(focusText) ? "教材作成" : null,
    /資格/.test(focusText) ? "資格勉強" : null,
    /勉強/.test(focusText) ? "学習" : null,
    /作業/.test(focusText) ? "作業" : null,
    currentGoal,
    topMemory,
    topDecision,
  ].filter((value): value is string => Boolean(value));

  return keywords[0] ?? "集中";
}

function extractRelatedDecisions(context: RecommendationContext) {
  const terms = [context.focusText, context.currentGoal?.title ?? "", context.currentGoal?.description ?? ""]
    .join(" ")
    .toLowerCase();
  const keywords = ["教材", "作成", "勉強", "学習", "時間", "予定", "確保", "集中", "来週"];

  return context.decisions
    .map((decision) => {
      const text = `${decision.question} ${decision.context} ${decision.decision} ${decision.rationale}`.toLowerCase();
      let matchScore = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword) && terms.includes(keyword)) {
          matchScore += 1;
        }
      }
      if (matchScore > 0) return { decision, score: matchScore };
      return { decision, score: 0 };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => entry.decision.id);
}

function extractRelatedMemories(context: RecommendationContext) {
  const terms = [context.focusText, context.currentGoal?.title ?? "", context.currentGoal?.description ?? ""]
    .join(" ")
    .toLowerCase();
  const keywords = ["教材", "作成", "勉強", "学習", "時間", "予定", "確保", "集中", "来週"];

  return context.memories
    .map((memory) => {
      const text = `${memory.title} ${memory.summary} ${memory.body} ${memory.tags.join(" ")}`.toLowerCase();
      let matchScore = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword) && terms.includes(keyword)) {
          matchScore += 1;
        }
      }
      return { memory, score: matchScore };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => entry.memory.id);
}

function buildReason(params: {
  currentGoal: YuiGoal | null;
  gap: { start: Date; end: Date; minutes: number } | null;
  relatedDecisions: string[];
  relatedMemories: string[];
  contextText: string;
}) {
  const pieces = [
    params.currentGoal ? `現在のGoal「${params.currentGoal.title}」に沿っています。` : "今の文脈に合うテーマです。",
    params.relatedDecisions.length > 0 ? "最近のDecisionとつながっています。" : null,
    params.relatedMemories.length > 0 ? "関連するMemoryが見つかっています。" : null,
    params.gap ? `空き時間は ${params.gap.minutes} 分あります。` : "まだはっきりした空き時間は見つかっていません。",
    params.contextText ? `相談内容: ${params.contextText}` : null,
  ].filter((value): value is string => Boolean(value));

  return pieces.join(" ");
}

function computeScore(params: {
  currentGoal: YuiGoal | null;
  gap: { start: Date; end: Date; minutes: number } | null;
  relatedDecisions: string[];
  relatedMemories: string[];
  conversations: YuiConversation[];
  currentGoalProgress: number;
}) {
  let score = 0;

  if (params.currentGoal) score += 30;
  if (params.relatedDecisions.length > 0) score += 25;
  if (params.relatedMemories.length > 0) score += 20;
  if (params.gap) score += 20;
  if (params.currentGoalProgress < 100) score += 10;
  if (params.conversations.length > 0) score += 5;

  return Math.max(0, Math.min(100, score));
}

function buildContent(params: {
  topic: string;
  gap: { start: Date; end: Date; minutes: number } | null;
  currentGoal: YuiGoal | null;
  contextText: string;
}) {
  const proposed_start_at = params.gap?.start.toISOString() ?? "";
  const proposed_end_at = params.gap?.end.toISOString() ?? "";
  const proposed_label = params.gap
    ? `${params.gap.start.toLocaleDateString("ja-JP", { weekday: "short", month: "numeric", day: "numeric" })} ${params.gap.start.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false })}〜${params.gap.end.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false })}`
    : "候補時間なし";

  const summary = params.gap
    ? `${proposed_label}なら${params.topic}の時間を確保できます。`
    : `${params.topic}の時間を作る提案です。`;

  return buildRecommendationContent({
    summary,
    proposed_start_at,
    proposed_end_at,
    proposed_label,
    topic: params.topic,
    context_excerpt: params.contextText.slice(0, 160),
    goal_title: params.currentGoal?.title ?? null,
  });
}

function buildRecommendationTitle(topic: string) {
  return `${topic}の時間を作る`;
}

function recommendationEventTypeForStatus(status: string) {
  if (status === "accepted") return "recommendation_accepted";
  if (status === "rejected") return "recommendation_rejected";
  if (status === "completed") return "recommendation_completed";
  return "recommendation_status_updated";
}

async function writeRecommendationEvent(
  user: SessionUser,
  recommendation: YuiRecommendation,
  action: "created" | "accepted" | "rejected" | "completed" | "updated",
) {
  const parsed = parseRecommendationContent(recommendation.content);
  await createYuiEvent(user, {
    event_type:
      action === "created"
        ? "recommendation_created"
        : recommendationEventTypeForStatus(recommendation.status),
    source: "yui",
    title: recommendation.title,
    content: parsed?.summary || recommendation.reason || recommendation.content || recommendation.title,
    metadata: {
      recommendation_id: recommendation.id,
      recommendation_type: recommendation.type,
      recommendation_status: recommendation.status,
      recommendation_score: recommendation.score,
      related_goal_id: recommendation.related_goal_id,
      related_decision_ids: recommendation.related_decision_ids,
      related_memory_ids: recommendation.related_memory_ids,
      action,
    },
    occurred_at: new Date().toISOString(),
  });
}

async function ensureSuggestedTimeBlockFromRecommendation(
  user: SessionUser,
  recommendation: YuiRecommendation,
) {
  if (recommendation.type !== "time_block") {
    return null;
  }

  const parsed = parseRecommendationContent(recommendation.content);
  if (!parsed?.proposed_start_at || !parsed?.proposed_end_at) {
    return null;
  }

  const existing = await listYuiSuggestedTimeBlocks(user.id, {
    start: new Date(parsed.proposed_start_at),
    end: new Date(parsed.proposed_end_at),
    limit: 20,
  });

  const matched = existing.find((block) => {
    const goalIdMatches = (recommendation.related_goal_id ?? null) === (block.goal_id ?? null);
    return goalIdMatches && block.title === recommendation.title && block.start_at === parsed.proposed_start_at && block.end_at === parsed.proposed_end_at;
  });

  if (matched) {
    await ensureYuiCalendarActionFromTimeBlock(user, matched);
    return matched;
  }

  const blockInput: YuiSuggestedTimeBlockInput = {
    goal_id: recommendation.related_goal_id ?? null,
    title: recommendation.title,
    reason: recommendation.reason,
    start_at: parsed.proposed_start_at,
    end_at: parsed.proposed_end_at,
    source: "goal_priority",
    status: "approved",
  };

  return createYuiSuggestedTimeBlock(user, blockInput);
}

async function getRecommendationContext(userId: string, contextText: string): Promise<RecommendationContext> {
  const since14 = getWindowStart();
  since14.setDate(since14.getDate() - 14);
  const since30 = getWindowStart();
  since30.setDate(since30.getDate() - 30);
  const future14Start = getWindowStart();
  const future14End = getWindowEnd();

  const [profile, goals, memories, decisions, conversations, events, calendarEvents] = await Promise.all([
    getYuiProfile(userId),
    listYuiGoals(userId, 20),
    listYuiMemoriesSince(userId, since30, 50),
    listYuiDecisionsSince(userId, since14, 30),
    listYuiConversationsSince(userId, since14, 30),
    listYuiEvents(userId, 20),
    listYuiCalendarEvents(userId, { start: future14Start, end: future14End, limit: 100 }),
  ]);

  const currentGoal = goals.find((goal) => goal.status === "active") ?? goals[0] ?? null;
  return {
    profile,
    currentGoal,
    memories,
    decisions,
    conversations,
    events,
    calendarEvents,
    focusText: contextText,
  };
}

async function insertRecommendation(
  userId: string,
  payload: Omit<YuiRecommendation, "id" | "user_id" | "created_at">,
) {
  const { data, error } = await supabaseAdmin
    .from("yui_recommendations")
    .insert({
      user_id: userId,
      type: payload.type,
      title: payload.title,
      content: payload.content,
      reason: payload.reason,
      score: payload.score,
      related_goal_id: payload.related_goal_id,
      related_decision_ids: payload.related_decision_ids,
      related_memory_ids: payload.related_memory_ids,
      status: payload.status,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as YuiRecommendation;
}

export async function listYuiRecommendations(
  userId: string,
  options?: {
    status?: string;
    limit?: number;
  },
): Promise<YuiRecommendation[]> {
  const limit = options?.limit ?? 20;
  let query = supabaseAdmin
    .from("yui_recommendations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.status) {
    query = query.eq("status", normalizeRecommendationStatus(options.status));
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as YuiRecommendation[];
}

export async function createYuiRecommendation(
  user: SessionUser,
  input: CreateYuiRecommendationInput,
): Promise<YuiRecommendation> {
  const type = normalizeRecommendationType(input.type);
  const recommendation = await insertRecommendation(user.id, {
    type,
    title: normalizeRecommendationText(input.title ?? "YUI recommendation"),
    content: normalizeRecommendationText(input.content ?? ""),
    reason: normalizeRecommendationText(input.reason ?? ""),
    score: Number.isFinite(input.score) ? Math.max(0, Math.min(100, Math.trunc(input.score ?? 0))) : 0,
    related_goal_id: input.related_goal_id ?? null,
    related_decision_ids: normalizeIds(input.related_decision_ids),
    related_memory_ids: normalizeIds(input.related_memory_ids),
    status: normalizeRecommendationStatus(input.status),
  });

  await writeRecommendationEvent(user, recommendation, "created");
  return recommendation;
}

export async function generateYuiRecommendation(
  user: SessionUser,
  input?: CreateYuiRecommendationInput & { context?: string },
): Promise<YuiRecommendation> {
  const focusText = input?.content || input?.title || input?.reason || input?.context || "";
  const context = await getRecommendationContext(user.id, focusText);
  const topic = buildTopic(context);
  const gap = findBestGap(context.calendarEvents) ?? buildFallbackGap();
  const relatedDecisionIds = extractRelatedDecisions(context);
  const relatedMemoryIds = extractRelatedMemories(context);
  const score = computeScore({
    currentGoal: context.currentGoal,
    gap,
    relatedDecisions: relatedDecisionIds,
    relatedMemories: relatedMemoryIds,
    conversations: context.conversations,
    currentGoalProgress: context.currentGoal?.progress ?? 0,
  });
  const title = buildRecommendationTitle(topic);
  const reason = buildReason({
    currentGoal: context.currentGoal,
    gap,
    relatedDecisions: relatedDecisionIds,
    relatedMemories: relatedMemoryIds,
    contextText: focusText,
  });
  const content = buildContent({
    topic,
    gap,
    currentGoal: context.currentGoal,
    contextText: focusText,
  });
  const duplicate = (await listYuiRecommendations(user.id, { status: "pending", limit: 20 })).find(
    (recommendation) =>
      recommendation.type === "time_block"
      && recommendation.title === title
      && recommendation.reason === reason
      && recommendation.content === content,
  );

  if (duplicate) {
    return duplicate;
  }

  const recommendation = await insertRecommendation(user.id, {
    type: "time_block",
    title,
    content,
    reason,
    score,
    related_goal_id: context.currentGoal?.id ?? null,
    related_decision_ids: relatedDecisionIds,
    related_memory_ids: relatedMemoryIds,
    status: "pending",
  });

  await writeRecommendationEvent(user, recommendation, "created");
  return recommendation;
}

export async function updateYuiRecommendationStatus(
  user: SessionUser,
  recommendationId: string,
  status: string,
): Promise<YuiRecommendation> {
  const normalizedStatus = normalizeRecommendationStatus(status);

  const { data: existing, error: readError } = await supabaseAdmin
    .from("yui_recommendations")
    .select("*")
    .eq("user_id", user.id)
    .eq("id", recommendationId)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  if (!existing) {
    throw new Error("Recommendation not found");
  }

  const { data, error } = await supabaseAdmin
    .from("yui_recommendations")
    .update({ status: normalizedStatus })
    .eq("user_id", user.id)
    .eq("id", recommendationId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (normalizedStatus === "accepted") {
    await ensureSuggestedTimeBlockFromRecommendation(user, data as YuiRecommendation);
  }

  if (normalizedStatus === "accepted" || normalizedStatus === "rejected" || normalizedStatus === "completed") {
    await writeRecommendationEvent(user, data as YuiRecommendation, normalizedStatus);
  } else {
    await writeRecommendationEvent(user, data as YuiRecommendation, "updated");
  }

  return data as YuiRecommendation;
}
