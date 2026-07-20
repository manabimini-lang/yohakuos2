import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  CreateYuiGoalInput,
  CreateYuiConversationInput,
  CreateYuiMemoryInput,
  CreateYuiMilestoneInput,
  CreateYuiEventInput,
  CreateYuiCalendarEventInput,
  CreateYuiSuggestedTimeBlockInput,
  CreateYuiReflectionInput,
  UpdateYuiGoalInput,
  YuiCurrentPosition,
  YuiDecisionCard,
  YuiDecisionInput,
  YuiDailyBrief,
  YuiCalendarEvent,
  YuiSuggestedTimeBlock,
  YuiGoal,
  YuiMemoryCandidateDraft,
  YuiMemoryCandidate,
  YuiConversation,
  YuiMilestone,
  YuiEvent,
  YuiConnection,
  YuiConnectionInput,
  YuiMemory,
  YuiProfile,
  YuiProfileSettings,
  YuiReflection,
  YuiToday,
  YuiDecision,
} from "./models";

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

function getFallbackDisplayName(user: SessionUser) {
  const name = user.name?.trim();
  if (name) return name;

  const emailPrefix = user.email?.split("@")[0]?.trim();
  if (emailPrefix) return emailPrefix;

  return "YUI";
}

function normalizeTags(tags?: string[]) {
  if (!tags) return [];
  return tags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function normalizeTextArray(values?: string[]) {
  if (!values) return [];
  return values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function normalizeImportance(value?: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(5, Math.trunc(value ?? 0))) : 0;
}

function getPreferences(profile?: YuiProfile | null) {
  return (profile?.preferences ?? {}) as Record<string, unknown>;
}

function getNotificationSettings(profile?: YuiProfile | null) {
  return (profile?.notification_settings ?? {}) as Record<string, unknown>;
}

export function toYuiProfileSettings(profile?: YuiProfile | null): YuiProfileSettings {
  const preferences = getPreferences(profile);
  const notificationSettings = getNotificationSettings(profile);

  return {
    display_name: profile?.display_name ?? "",
    assistant_name: profile?.assistant_name ?? "",
    tone: profile?.tone ?? "",
    life_theme: profile?.life_theme ?? "",
    focus_area: profile?.focus_area ?? "",
    notification_strength: String(notificationSettings.notification_strength ?? "normal"),
    summary_frequency: String(notificationSettings.summary_frequency ?? "daily"),
    timezone: String(preferences.timezone ?? "Asia/Tokyo"),
  };
}

export function makeYuiProfilePayload(input: Partial<YuiProfileSettings>) {
  const notificationStrength = String(input.notification_strength ?? "normal").trim() || "normal";
  const summaryFrequency = String(input.summary_frequency ?? "daily").trim() || "daily";
  const timezone = String(input.timezone ?? "Asia/Tokyo").trim() || "Asia/Tokyo";
  const displayName = String(input.display_name ?? "").trim();
  const assistantName = String(input.assistant_name ?? "").trim();
  const tone = String(input.tone ?? "").trim();
  const lifeTheme = String(input.life_theme ?? "").trim();
  const focusArea = String(input.focus_area ?? "").trim();

  return {
    display_name: displayName || null,
    assistant_name: assistantName || null,
    tone: tone || null,
    life_theme: lifeTheme || null,
    focus_area: focusArea || null,
    preferences: { timezone },
    notification_settings: {
      notification_strength: notificationStrength,
      summary_frequency: summaryFrequency,
    },
  };
}

export async function createYuiEvent(
  user: SessionUser,
  input: CreateYuiEventInput,
): Promise<YuiEvent> {
  await ensureYuiProfile(user);

  const title = String(input.title ?? "").trim();
  const content = String(input.content ?? title).trim();

  const { data, error } = await supabaseAdmin
    .from("events")
    .insert({
      user_id: user.id,
      event_type: normalizeEventType(input.event_type),
      source: normalizeEventSource(input.source),
      title: title || "Event",
      content: content || title || "Event",
      metadata: normalizeEventMetadata(input.metadata),
      occurred_at: normalizeEventOccurredAt(input.occurred_at),
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as YuiEvent;
}

export async function listYuiEvents(userId: string, limit = 50): Promise<YuiEvent[]> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("user_id", userId)
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as YuiEvent[];
}

export async function getRecentYuiEvents(userId: string, limit = 10): Promise<YuiEvent[]> {
  return listYuiEvents(userId, limit);
}

export async function listYuiCalendarEvents(
  userId: string,
  options?: {
    start?: Date;
    end?: Date;
    connectionId?: string;
    limit?: number;
  },
): Promise<YuiCalendarEvent[]> {
  const limit = options?.limit ?? 50;
  let query = supabaseAdmin
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .order("start_at", { ascending: true })
    .limit(limit);

  if (options?.start) {
    query = query.gte("start_at", options.start.toISOString());
  }

  if (options?.end) {
    query = query.lt("start_at", options.end.toISOString());
  }

  if (options?.connectionId) {
    query = query.eq("connection_id", options.connectionId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as YuiCalendarEvent[];
}

export async function getRecentYuiCalendarEvents(userId: string, limit = 10): Promise<YuiCalendarEvent[]> {
  return listYuiCalendarEvents(userId, { limit });
}

export async function createYuiCalendarEvent(
  user: SessionUser,
  input: CreateYuiCalendarEventInput,
): Promise<YuiCalendarEvent> {
  await ensureYuiProfile(user);

  const connectionId = String(input.connection_id ?? "").trim();
  if (!connectionId) {
    throw new Error("connection_id is required");
  }

  const { data: connection, error: connectionError } = await supabaseAdmin
    .from("connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("id", connectionId)
    .maybeSingle();

  if (connectionError) {
    throw connectionError;
  }

  if (!connection) {
    throw new Error("Connection not found");
  }

  const startAt = normalizeCalendarEventDateTime(input.start_at);
  const endAt = normalizeCalendarEventDateTime(input.end_at);

  if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
    throw new Error("end_at must be after start_at");
  }

  const { data, error } = await supabaseAdmin
    .from("calendar_events")
    .insert({
      user_id: user.id,
      connection_id: connection.id,
      provider: normalizeConnectionProvider(input.provider || connection.provider),
      external_id: normalizeCalendarEventText(input.external_id),
      title: normalizeCalendarEventText(input.title) || "Calendar Event",
      description: normalizeCalendarEventText(input.description ?? ""),
      start_at: startAt,
      end_at: endAt,
      location: normalizeCalendarEventLocation(input.location),
      status: normalizeCalendarEventStatus(input.status),
      metadata: normalizeConnectionMap(input.metadata),
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as YuiCalendarEvent;
}

export async function listYuiSuggestedTimeBlocks(
  userId: string,
  options?: {
    status?: string;
    start?: Date;
    end?: Date;
    limit?: number;
  },
): Promise<YuiSuggestedTimeBlock[]> {
  const limit = options?.limit ?? 20;
  let query = supabaseAdmin
    .from("suggested_time_blocks")
    .select("*")
    .eq("user_id", userId)
    .order("start_at", { ascending: true })
    .limit(limit);

  if (options?.status) {
    query = query.eq("status", normalizeSuggestedTimeBlockStatus(options.status));
  }

  if (options?.start) {
    query = query.gte("start_at", options.start.toISOString());
  }

  if (options?.end) {
    query = query.lt("start_at", options.end.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as YuiSuggestedTimeBlock[];
}

export async function createYuiSuggestedTimeBlock(
  user: SessionUser,
  input: CreateYuiSuggestedTimeBlockInput,
): Promise<YuiSuggestedTimeBlock> {
  await ensureYuiProfile(user);

  const title = normalizeSuggestedTimeBlockText(input.title);
  const reason = normalizeSuggestedTimeBlockText(input.reason);
  const startAt = normalizeSuggestedTimeBlockDateTime(input.start_at);
  const endAt = normalizeSuggestedTimeBlockDateTime(input.end_at);

  if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
    throw new Error("end_at must be after start_at");
  }

  let goalId: string | null = null;
  if (input.goal_id) {
    const { data: goal, error: goalError } = await supabaseAdmin
      .from("goals")
      .select("id")
      .eq("user_id", user.id)
      .eq("id", input.goal_id)
      .maybeSingle();

    if (goalError) {
      throw goalError;
    }

    if (!goal) {
      throw new Error("Goal not found");
    }

    goalId = goal.id;
  }

  const { data, error } = await supabaseAdmin
    .from("suggested_time_blocks")
    .insert({
      user_id: user.id,
      goal_id: goalId,
      title: title || "YUI提案の時間",
      reason,
      start_at: startAt,
      end_at: endAt,
      source: normalizeSuggestedTimeBlockSource(input.source),
      status: normalizeSuggestedTimeBlockStatus(input.status),
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as YuiSuggestedTimeBlock;
}

export async function updateYuiSuggestedTimeBlockStatus(
  user: SessionUser,
  blockId: string,
  status: string,
): Promise<YuiSuggestedTimeBlock> {
  await ensureYuiProfile(user);

  const { data, error } = await supabaseAdmin
    .from("suggested_time_blocks")
    .update({ status: normalizeSuggestedTimeBlockStatus(status) })
    .eq("user_id", user.id)
    .eq("id", blockId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as YuiSuggestedTimeBlock;
}

export async function listYuiConnections(userId: string): Promise<YuiConnection[]> {
  const { data, error } = await supabaseAdmin
    .from("connections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as YuiConnection[];
}

export async function createYuiConnection(
  user: SessionUser,
  input: YuiConnectionInput,
): Promise<YuiConnection> {
  await ensureYuiProfile(user);
  const status = normalizeConnectionStatus(input.status);

  const { data, error } = await supabaseAdmin
    .from("connections")
    .insert({
      user_id: user.id,
      provider: normalizeConnectionProvider(input.provider),
      status,
      permissions: normalizeConnectionMap(input.permissions),
      metadata: normalizeConnectionMap(input.metadata),
      connected_at: status === "connected"
        ? normalizeEventOccurredAt(input.connected_at)
        : input.connected_at
          ? normalizeEventOccurredAt(input.connected_at)
          : null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as YuiConnection;
}

export async function updateYuiConnectionStatus(
  user: SessionUser,
  connectionId: string,
  status: string,
): Promise<YuiConnection> {
  await ensureYuiProfile(user);

  const normalizedStatus = normalizeConnectionStatus(status);
  const payload: Record<string, unknown> = {
    status: normalizedStatus,
    connected_at: normalizedStatus === "connected" ? new Date().toISOString() : null,
  };

  const { data, error } = await supabaseAdmin
    .from("connections")
    .update(payload)
    .eq("user_id", user.id)
    .eq("id", connectionId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as YuiConnection;
}

function summarizeConversation(content: string) {
  const text = content.trim();
  const firstSentence = text.split(/[。\.!?！？\n]/).map((part) => part.trim()).find(Boolean) ?? text;
  return firstSentence.length > 80 ? `${firstSentence.slice(0, 77)}...` : firstSentence;
}

function deriveCandidateDraft(content: string): YuiMemoryCandidateDraft {
  const text = content.trim();
  const summary = summarizeConversation(text);
  const genericFallback: YuiMemoryCandidateDraft = {
    title: "会話の記録",
    summary,
    reason: "会話の文脈を後から参照しやすくするため",
    importance: 1,
  };

  const rules: Array<{
    test: RegExp;
    draft: (match: RegExpMatchArray) => YuiMemoryCandidateDraft;
  }> = [
    {
      test: /私は(.+?)です/,
      draft: (match) => ({
        title: "自己紹介",
        summary: summarizeConversation(match[1]),
        reason: "自己紹介は今後の会話で参照価値が高いため",
        importance: 4,
      }),
    },
    {
      test: /今後(.+?)(?:したい|やりたい|始めたい|続けたい)/,
      draft: (match) => ({
        title: "今後やりたいこと",
        summary: summarizeConversation(match[1]),
        reason: "将来の意向は会話の文脈として重要なため",
        importance: 4,
      }),
    },
    {
      test: /(.+?)が好き/,
      draft: (match) => ({
        title: "好きなこと",
        summary: summarizeConversation(match[1]),
        reason: "好みは今後の提案や返答に役立つため",
        importance: 3,
      }),
    },
    {
      test: /(.+?)(?:を|をぜひ|をそろそろ)?(?:始める|始めたい)/,
      draft: (match) => ({
        title: "始めたいこと",
        summary: summarizeConversation(match[1]),
        reason: "新しく始めることは継続的に参照されやすいため",
        importance: 3,
      }),
    },
    {
      test: /(.+?)をやめたい/,
      draft: (match) => ({
        title: "やめたいこと",
        summary: summarizeConversation(match[1]),
        reason: "避けたい対象は今後の提案の精度に役立つため",
        importance: 3,
      }),
    },
  ];

  for (const rule of rules) {
    const match = text.match(rule.test);
    if (match) {
      return rule.draft(match);
    }
  }

  return genericFallback;
}

function deriveMemoryTags(content: string, title: string) {
  const tags = new Set<string>();
  const text = content.trim();

  if (/私は/.test(text) || title === "自己紹介") tags.add("identity");
  if (/好き|好み/.test(text) || title === "好きなこと") tags.add("preference");
  if (/したい|やりたい|始めたい|続けたい/.test(text)) tags.add("goal");
  if (/始める|始めたい/.test(text) || title === "始めたいこと") tags.add("start");
  if (/やめたい/.test(text)) tags.add("avoid");
  if (tags.size === 0) tags.add("conversation");

  return [...tags];
}

function getDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function normalizeDecisionConfidence(value?: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.trunc(value ?? 0))) : 50;
}

function normalizeDecisionText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeGoalStatus(value?: string) {
  const status = String(value ?? "active").trim().toLowerCase();
  if (status === "active" || status === "paused" || status === "completed") {
    return status;
  }
  return "active";
}

function normalizeMilestoneStatus(value?: string) {
  const status = String(value ?? "pending").trim().toLowerCase();
  if (status === "pending" || status === "completed") {
    return status;
  }
  return "pending";
}

function normalizeGoalProgress(value?: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.trunc(value ?? 0))) : 0;
}

function normalizeEventType(value: string) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  return normalized || "manual_note";
}

function normalizeEventSource(value: string) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  if (!normalized) return "manual";
  if (normalized === "yui_proposed") return "yui";
  return normalized;
}

function normalizeEventMetadata(value?: Record<string, unknown>) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeEventOccurredAt(value?: string | null) {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeConnectionStatus(value?: string) {
  const status = String(value ?? "pending").trim().toLowerCase();
  if (status === "pending" || status === "connected" || status === "disconnected") {
    return status;
  }
  return "pending";
}

function normalizeConnectionProvider(value: string) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}

function normalizeConnectionMap(value?: Record<string, unknown>) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeCalendarEventStatus(value?: string) {
  const status = String(value ?? "confirmed").trim().toLowerCase();
  if (status === "confirmed" || status === "tentative" || status === "cancelled") {
    return status;
  }
  return "confirmed";
}

function normalizeCalendarEventText(value: string) {
  return String(value ?? "").trim();
}

function normalizeCalendarEventLocation(value?: string | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function normalizeCalendarEventDateTime(value: string) {
  const date = new Date(String(value ?? "").trim());
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid calendar event datetime");
  }
  return date.toISOString();
}

function normalizeSuggestedTimeBlockStatus(value?: string) {
  const status = String(value ?? "pending").trim().toLowerCase();
  if (status === "pending" || status === "approved" || status === "rejected" || status === "created") {
    return status;
  }
  return "pending";
}

function normalizeSuggestedTimeBlockSource(value?: string) {
  const source = String(value ?? "yui_analysis").trim().toLowerCase().replace(/\s+/g, "_");
  if (!source) return "yui_analysis";
  return source;
}

function normalizeSuggestedTimeBlockText(value: string) {
  return String(value ?? "").trim();
}

function normalizeSuggestedTimeBlockDateTime(value: string) {
  const date = new Date(String(value ?? "").trim());
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid time block datetime");
  }
  return date.toISOString();
}

function getLocalDayWindow(reference = new Date()) {
  const start = new Date(reference);
  start.setHours(9, 0, 0, 0);
  const end = new Date(reference);
  end.setHours(18, 0, 0, 0);
  return { start, end };
}

function getTodayWindow() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

async function syncSuggestedTimeBlocksFromAnalysis(
  userId: string,
  params: {
    profile: YuiProfile | null;
    currentGoal: YuiGoal | null;
    memories: YuiMemory[];
    decisions: YuiDecision[];
    events: YuiEvent[];
    calendarEvents: YuiCalendarEvent[];
    window: { start: Date; end: Date };
  },
) {
  const drafts = buildSuggestedTimeBlockDrafts({
    profile: params.profile,
    currentGoal: params.currentGoal,
    memories: params.memories,
    decisions: params.decisions,
    events: params.events,
    calendarEvents: params.calendarEvents,
  });

  const existing = await listYuiSuggestedTimeBlocks(userId, {
    start: params.window.start,
    end: params.window.end,
    limit: 50,
  });

  const existingKeys = new Set(
    existing.map((block) => [
      block.title.trim(),
      String(block.goal_id ?? ""),
      block.start_at,
      block.end_at,
      block.source,
    ].join("::")),
  );

  for (const draft of drafts) {
    const key = [
      draft.title.trim(),
      String(draft.goal_id ?? ""),
      draft.start_at,
      draft.end_at,
      draft.source,
    ].join("::");

    if (existingKeys.has(key)) {
      continue;
    }

    const { error } = await supabaseAdmin
      .from("suggested_time_blocks")
      .insert({
        user_id: userId,
        goal_id: draft.goal_id,
        title: draft.title,
        reason: draft.reason,
        start_at: draft.start_at,
        end_at: draft.end_at,
        source: draft.source,
        status: draft.status,
      });

    if (error) {
      throw error;
    }
  }

  return listYuiSuggestedTimeBlocks(userId, {
    start: params.window.start,
    end: params.window.end,
    limit: 20,
  });
}

function clampDate(date: Date, min: Date, max: Date) {
  const time = date.getTime();
  return new Date(Math.min(Math.max(time, min.getTime()), max.getTime()));
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

function findFreeTimeRanges(calendarEvents: YuiCalendarEvent[], reference = new Date()) {
  const workWindow = getLocalDayWindow(reference);
  const merged = mergeCalendarEvents(calendarEvents)
    .map((range) => ({
      start: clampDate(range.start, workWindow.start, workWindow.end),
      end: clampDate(range.end, workWindow.start, workWindow.end),
    }))
    .filter((range) => range.end.getTime() > range.start.getTime());

  const gaps: Array<{ start: Date; end: Date; minutes: number }> = [];
  let cursor = new Date(workWindow.start);

  for (const range of merged) {
    if (range.start.getTime() > cursor.getTime()) {
      const gapEnd = new Date(range.start);
      const minutes = Math.floor((gapEnd.getTime() - cursor.getTime()) / 60000);
      if (minutes >= 45) {
        gaps.push({ start: new Date(cursor), end: gapEnd, minutes });
      }
    }

    if (range.end.getTime() > cursor.getTime()) {
      cursor = new Date(range.end);
    }
  }

  if (cursor.getTime() < workWindow.end.getTime()) {
    const minutes = Math.floor((workWindow.end.getTime() - cursor.getTime()) / 60000);
    if (minutes >= 45) {
      gaps.push({ start: new Date(cursor), end: new Date(workWindow.end), minutes });
    }
  }

  return gaps;
}

function buildSuggestedTimeBlockDrafts(params: {
  profile: YuiProfile | null;
  currentGoal: YuiGoal | null;
  memories: YuiMemory[];
  decisions: YuiDecision[];
  events: YuiEvent[];
  calendarEvents: YuiCalendarEvent[];
}): Array<Omit<YuiSuggestedTimeBlock, "id" | "user_id" | "created_at" | "updated_at">> {
  const { profile, currentGoal, memories, decisions, events, calendarEvents } = params;
  const gaps = findFreeTimeRanges(calendarEvents);
  const leadMemory = memories[0] ?? null;
  const leadDecision = decisions[0] ?? null;
  const leadEvent = events[0] ?? null;
  const drafts = gaps.slice(0, 2).map((gap) => {
    const durationMinutes = Math.min(gap.minutes, 90);
    const end = new Date(Math.min(gap.start.getTime() + durationMinutes * 60000, gap.end.getTime()));
    const goalTitle = currentGoal?.title?.trim() || profile?.focus_area?.trim() || "考える時間";
    const title = currentGoal ? `${goalTitle}の集中時間` : "YUI提案の時間";
    const reasonParts = [
      currentGoal ? `現在の重点「${currentGoal.title}」に使いやすい空き時間です。` : "今は特定の目的がないので、考えを整える余白に向いています。",
      leadDecision?.question ? `最近のDecision「${leadDecision.question}」を整理すると次の一歩が見えやすくなります。` : null,
      leadMemory?.title ? `記憶「${leadMemory.title}」が最近のテーマとして残っています。` : null,
      leadEvent?.title ? `直近の出来事「${leadEvent.title}」も踏まえて時間を使えます。` : null,
    ].filter((value): value is string => Boolean(value));

    return {
      goal_id: currentGoal?.id ?? null,
      title,
      reason: reasonParts.join(" "),
      start_at: gap.start.toISOString(),
      end_at: end.toISOString(),
      source: currentGoal ? "goal_priority" : "calendar_gap",
      status: "pending",
    };
  });

  if (drafts.length === 0) {
    const fallbackStart = new Date();
    fallbackStart.setHours(13, 0, 0, 0);
    const fallbackEnd = new Date(fallbackStart);
    fallbackEnd.setHours(fallbackEnd.getHours() + 1);
    drafts.push({
      goal_id: currentGoal?.id ?? null,
      title: currentGoal ? `${currentGoal.title}の整理時間` : "YUI提案の時間",
      reason: currentGoal
        ? `今日は空き時間が見つかりませんでしたが、「${currentGoal.title}」を整理する1時間を確保する提案です。`
        : "今日は空き時間が見つからなかったため、考えを整える短い時間を提案します。",
      start_at: fallbackStart.toISOString(),
      end_at: fallbackEnd.toISOString(),
      source: "yui_analysis",
      status: "pending",
    });
  }

  return drafts;
}

function makeCardId(question: string) {
  return `card-${question.toLowerCase().replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9faf]+/gi, "-").replace(/^-+|-+$/g, "") || "decision"}`;
}

function uniqueBy(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function countStrings(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = value.trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function extractConversationSignals(conversations: YuiConversation[]) {
  const signals: string[] = [];

  for (const conversation of conversations) {
    const content = conversation.content.trim();
    if (!content) continue;

    if (/私は/.test(content)) signals.push("自己理解");
    if (/好き|好み/.test(content)) signals.push("嗜好");
    if (/したい|やりたい|始めたい|続けたい/.test(content)) signals.push("意向");
    if (/やめたい|避けたい/.test(content)) signals.push("避けたいこと");
    if (/\?|？/.test(content)) signals.push("問い");
    if (/TODO|タスク|やる|確認/.test(content)) signals.push("未完了");
  }

  return signals;
}

function buildTrendLabels(memories: YuiMemory[], conversations: YuiConversation[], decisions: YuiDecision[]) {
  const tagSignals = countStrings(memories.flatMap((memory) => memory.tags));
  const sourceSignals = countStrings(memories.map((memory) => memory.source_type));
  const conversationSignals = countStrings(extractConversationSignals(conversations));
  const decisionSignals = countStrings(decisions.map((decision) => decision.decision));

  const trends = [
    tagSignals[0]?.[0] ? `よく出るテーマ: ${tagSignals[0][0]}` : null,
    sourceSignals[0]?.[0] ? `保存経路の傾向: ${sourceSignals[0][0]}` : null,
    conversationSignals[0]?.[0] ? `会話の傾向: ${conversationSignals[0][0]}` : null,
    decisionSignals[0]?.[0] ? `判断の傾向: ${decisionSignals[0][0]}` : null,
  ].filter((value): value is string => Boolean(value));

  return uniqueBy(trends).slice(0, 3);
}

function buildNextThoughts(
  pendingTasks: string[],
  recentInsights: string[],
  recentTrends: string[],
  decisions: YuiDecision[],
) {
  const thoughts = [
    pendingTasks[0] ? `未完了の流れとして「${pendingTasks[0]}」を先に片づける` : null,
    recentTrends[0] ? `最近の傾向「${recentTrends[0]}」を一度言葉にする` : null,
    recentInsights[0] ? `最近の気づき「${recentInsights[0]}」を次の判断材料にする` : null,
    decisions[0]?.question ? `直近の判断「${decisions[0].question}」を振り返る` : null,
  ].filter((value): value is string => Boolean(value));

  return uniqueBy(thoughts).slice(0, 3);
}

function buildRecommendedActions(
  recentTrends: string[],
  pendingTasks: string[],
  recentInsights: string[],
) {
  const actions = [
    recentTrends[0] ? `${recentTrends[0]}を1つ深掘りする` : null,
    pendingTasks[0] ? `「${pendingTasks[0]}」の次の一歩を決める` : null,
    recentInsights[0] ? `気づき「${recentInsights[0]}」をメモに残す` : null,
  ].filter((value): value is string => Boolean(value));

  return uniqueBy(actions).slice(0, 3);
}

function buildDecisionCards(params: {
  profile: YuiProfile | null;
  recentTrends: string[];
  pendingTasks: string[];
  recommendedActions: string[];
  recentInsights: string[];
  decisions: YuiDecision[];
}): YuiDecisionCard[] {
  const { profile, recentTrends, pendingTasks, recommendedActions, recentInsights, decisions } = params;
  const name = profile?.display_name?.trim() || "あなた";
  const cards: YuiDecisionCard[] = [];

  const priorityQuestion = `${name}さん、今どれを先に考えるべきですか？`;
  cards.push({
    id: makeCardId(priorityQuestion),
    question: priorityQuestion,
    background: recentTrends[0]
      ? `最近は「${recentTrends[0]}」の話題が増えています。`
      : "最近の会話や記憶から、優先すべきテーマを整理します。",
    choices: [
      { label: recommendedActions[0] ?? "いまの関心を深掘りする", rationale: "直近の流れをそのまま伸ばせるため" },
      { label: recommendedActions[1] ?? "未完了のことを片づける", rationale: "未完了の状態は頭の負荷になりやすいため" },
      { label: "まだ決めない", rationale: "判断を急がず、観察を続ける選択も有効なため" },
    ],
    reason: pendingTasks[0]
      ? `未完了の流れが「${pendingTasks[0]}」として見えているため`
      : "判断材料はそろいつつありますが、まだ整理の余地があるため",
    confidence: pendingTasks.length > 0 ? 68 : 54,
  });

  const reflectionQuestion = `${name}さん、次にどんな形で振り返りますか？`;
  cards.push({
    id: makeCardId(reflectionQuestion),
    question: reflectionQuestion,
    background: recentInsights[0]
      ? `最近の気づきとして「${recentInsights[0]}」が出ています。`
      : "最近の記録から、次の振り返り方を選べます。",
    choices: [
      { label: "最近の気づきを整理する", rationale: "思考のまとまりを作ると次の判断がしやすくなるため" },
      { label: "行動の次の一歩を決める", rationale: "振り返りを行動に接続しやすくするため" },
      { label: "今は保留する", rationale: "無理に結論を出さない選択も維持できるため" },
    ],
    reason: recentInsights.length > 0
      ? `最近の気づきが ${recentInsights.length} 件あるため`
      : "まだ振り返りの材料が少ないため",
    confidence: recentInsights.length > 0 ? 62 : 45,
  });

  if (decisions[0]?.question) {
    const decisionQuestion = `直近の判断「${decisions[0].question}」をどう扱いますか？`;
    cards.push({
      id: makeCardId(decisionQuestion),
      question: decisionQuestion,
      background: `直近の判断履歴として「${decisions[0].decision}」が残っています。`,
      choices: [
        { label: "そのまま進める", rationale: "すでに方向性が定まっているため" },
        { label: "少し見直す", rationale: "判断の精度を上げる余地があるため" },
        { label: "一度保留する", rationale: "今日の優先度を再確認できるため" },
      ],
      reason: decisions[0].rationale || "直近の判断を次の行動に繋げるため",
      confidence: decisions[0].confidence,
    });
  }

  return cards.slice(0, 3);
}

function buildReflectionFromWindow(
  memories: YuiMemory[],
  conversations: YuiConversation[],
  profile: YuiProfile | null,
) {
  const topMemory = memories[0];
  const topConversation = conversations.find((conversation) => conversation.role === "user");
  const memoryCount = memories.length;
  const conversationCount = conversations.length;
  const name = profile?.display_name?.trim() || "あなた";

  const summary = topMemory
    ? `${name}さんの直近7日を振り返ると、${topMemory.title} を中心に考えがまとまりつつあります。`
    : `${name}さんの直近7日は、会話と記録の積み重ねを整理するタイミングです。`;

  const insights = uniqueBy([
    topMemory ? `重要な記憶の中心は「${topMemory.title}」です。` : "まだ強いテーマは少ない状態です。",
    topConversation ? `会話では「${summarizeConversation(topConversation.content)}」が目立ちます。` : "会話の蓄積はまだ少なめです。",
    memoryCount > 0 ? `7日間で ${memoryCount} 件の記憶が見えました。` : "7日間で記憶はまだありません。",
  ]).slice(0, 3);

  const nextActions = uniqueBy([
    topMemory ? `「${topMemory.title}」を次の判断材料として使う。` : "ひとつだけ大事なテーマを決める。",
    conversationCount > 0 ? "会話の中の未完了な問いを1件選ぶ。" : "YUIに相談したいことを1件置く。",
    "判断履歴を見て、次の一歩を固定する。",
  ]).slice(0, 3);

  return { summary, insights, nextActions };
}

function buildDailyBrief(params: {
  profile: YuiProfile | null;
  memories: YuiMemory[];
  conversations: YuiConversation[];
  decisions: YuiDecision[];
  currentGoal: YuiGoal | null;
  milestones: YuiMilestone[];
}): YuiDailyBrief {
  const { profile, memories, conversations, decisions, currentGoal, milestones } = params;
  const name = profile?.display_name?.trim() || "あなた";
  const oneDayAgo = getDaysAgo(1);
  const twoDaysAgo = getDaysAgo(2);
  const orderedMilestones = [...milestones].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const yesterdayMemories = memories.filter((memory) => new Date(memory.created_at).getTime() >= oneDayAgo.getTime());
  const previousMemories = memories.filter((memory) => {
    const createdAt = new Date(memory.created_at).getTime();
    return createdAt >= twoDaysAgo.getTime() && createdAt < oneDayAgo.getTime();
  });

  const yesterdayConversations = conversations.filter(
    (conversation) => new Date(conversation.created_at).getTime() >= oneDayAgo.getTime(),
  );
  const previousConversations = conversations.filter((conversation) => {
    const createdAt = new Date(conversation.created_at).getTime();
    return createdAt >= twoDaysAgo.getTime() && createdAt < oneDayAgo.getTime();
  });

  const yesterdayDecisions = decisions.filter((decision) => new Date(decision.created_at).getTime() >= oneDayAgo.getTime());
  const previousDecisions = decisions.filter((decision) => {
    const createdAt = new Date(decision.created_at).getTime();
    return createdAt >= twoDaysAgo.getTime() && createdAt < oneDayAgo.getTime();
  });

  const pendingMilestones = orderedMilestones.filter((milestone) => milestone.status !== "completed");

  const yesterdayChanges = uniqueBy([
    `記憶は昨日 ${yesterdayMemories.length} 件、前日は ${previousMemories.length} 件でした。`,
    `会話は昨日 ${yesterdayConversations.length} 件、前日は ${previousConversations.length} 件でした。`,
    `判断は昨日 ${yesterdayDecisions.length} 件、前日は ${previousDecisions.length} 件でした。`,
    currentGoal
      ? `目的「${currentGoal.title}」は ${currentGoal.progress}% 進んでいます。`
      : "まだ目的は設定されていません。",
  ]).slice(0, 4);

  const importantMemories = uniqueBy(
    [...memories]
      .sort((a, b) => {
        if (b.importance !== a.importance) return b.importance - a.importance;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 3)
      .map((memory) => memory.title || memory.summary)
      .filter(Boolean),
  ).slice(0, 3);

  const pendingItems = uniqueBy([
    ...pendingMilestones.slice(0, 2).map((milestone) => milestone.title),
    ...conversations
      .filter((conversation) => conversation.role === "user")
      .slice(0, 2)
      .map((conversation) => summarizeConversation(conversation.content)),
  ]).slice(0, 3);

  const recommendedActions = uniqueBy([
    currentGoal ? `目的「${currentGoal.title}」の次の一歩を進める` : "目的を1つ決める",
    pendingMilestones[0]
      ? `マイルストーン「${pendingMilestones[0].title}」を片づける`
      : "最初のマイルストーンを作る",
    decisions[0]?.question ? `直近の判断「${decisions[0].question}」を見直す` : "今日の判断を1件整理する",
  ]).slice(0, 3);

  const goalSentence = currentGoal
    ? `目的は「${currentGoal.title}」で、現在は ${currentGoal.progress}% まで進んでいます。`
    : "まだ目的は設定されていません。";
  const trendSentence = [
    yesterdayChanges[0],
    yesterdayChanges[1],
    yesterdayChanges[2],
  ].filter(Boolean).join(" ");
  const memorySentence = importantMemories[0]
    ? `今は「${importantMemories[0]}」が重要な記憶として前に出ています。`
    : "重要な記憶はまだ少なめです。";
  const actionSentence = recommendedActions[0]
    ? `今日の最初の一歩は「${recommendedActions[0]}」です。`
    : "今日は一つだけ進めることを決めるのが良さそうです。";

  const summary = `${name}さん、今日の要点です。${goalSentence}${trendSentence}${memorySentence}${actionSentence}`;

  return {
    summary,
    yesterdayChanges,
    importantMemories,
    pendingItems,
    recommendedActions,
  };
}

function buildCurrentPosition(goal: YuiGoal | null, milestones: YuiMilestone[]): YuiCurrentPosition {
  const pendingMilestone =
    [...milestones]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .find((milestone) => milestone.status !== "completed") ?? null;
  const completedCount = milestones.filter((milestone) => milestone.status === "completed").length;
  const progress = goal ? normalizeGoalProgress(goal.progress) : 0;
  const effectiveProgress = goal ? Math.max(progress, Math.round((completedCount / Math.max(milestones.length, 1)) * 100)) : 0;

  return {
    purpose: goal?.title?.trim() || "まだ目的はありません",
    current: goal ? `${effectiveProgress}%` : "0%",
    nextStep: pendingMilestone?.title?.trim() || (goal ? "次のマイルストーンを作る" : "目的を設定する"),
    progress: effectiveProgress,
  };
}

export async function ensureYuiProfile(user: SessionUser): Promise<YuiProfile | null> {
  const displayName = getFallbackDisplayName(user);

  const { data: existing, error: readError } = await supabaseAdmin
    .from("yui_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  if (existing) {
    return existing as YuiProfile;
  }

  const { data, error } = await supabaseAdmin
    .from("yui_profiles")
    .insert({
      user_id: user.id,
      display_name: displayName,
      assistant_name: displayName,
      tone: null,
      life_theme: null,
      focus_area: null,
      preferences: {},
      notification_settings: {},
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as YuiProfile;
}

export async function getYuiProfile(userId: string): Promise<YuiProfile | null> {
  const { data, error } = await supabaseAdmin
    .from("yui_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as YuiProfile | null;
}

export async function updateYuiProfile(
  user: SessionUser,
  input: Partial<YuiProfileSettings>,
): Promise<YuiProfile> {
  await ensureYuiProfile(user);

  const payload = makeYuiProfilePayload(input);

  const { data, error } = await supabaseAdmin
    .from("yui_profiles")
    .update(payload)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as YuiProfile;
}

export async function listYuiMemories(userId: string, limit = 20): Promise<YuiMemory[]> {
  const { data, error } = await supabaseAdmin
    .from("memories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as YuiMemory[];
}

export async function createYuiMemory(
  user: SessionUser,
  input: CreateYuiMemoryInput,
): Promise<YuiMemory> {
  await ensureYuiProfile(user);

  const importance = normalizeImportance(input.importance);

  const { data, error } = await supabaseAdmin
    .from("memories")
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      summary: input.summary.trim(),
      body: input.body.trim(),
      importance,
      tags: normalizeTags(input.tags),
      source_type: input.source_type?.trim() || "manual",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await createYuiEvent(user, {
    event_type: "memory_created",
    source: input.source_type?.trim() || "manual",
    title: data.title,
    content: data.summary,
    metadata: {
      memory_id: data.id,
      importance: data.importance,
      source_type: data.source_type,
    },
    occurred_at: data.created_at,
  });

  return data as YuiMemory;
}

export async function createYuiMemoryFromCandidate(
  user: SessionUser,
  candidate: YuiMemoryCandidate,
): Promise<YuiMemory> {
  const { data: conversation, error: conversationError } = await supabaseAdmin
    .from("conversations")
    .select("*")
    .eq("id", candidate.conversation_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (conversationError) {
    throw conversationError;
  }

  const conversationContent = (conversation?.content ?? candidate.summary).trim();
  const { data, error } = await supabaseAdmin
    .from("memories")
    .insert({
      user_id: user.id,
      title: candidate.title,
      summary: candidate.summary,
      body: conversationContent,
      importance: normalizeImportance(candidate.importance),
      tags: deriveMemoryTags(conversationContent, candidate.title),
      source_type: "yui_proposed",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await createYuiEvent(user, {
    event_type: "memory_created",
    source: "yui",
    title: data.title,
    content: data.summary,
    metadata: {
      memory_id: data.id,
      conversation_id: candidate.conversation_id,
      importance: data.importance,
      source_type: data.source_type,
    },
    occurred_at: data.created_at,
  });

  return data as YuiMemory;
}

export async function listYuiConversations(userId: string, limit = 50): Promise<YuiConversation[]> {
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as YuiConversation[];
}

export async function createYuiConversation(
  user: SessionUser,
  input: CreateYuiConversationInput,
): Promise<{ conversation: YuiConversation; memoryCandidate: YuiMemoryCandidate | null }> {
  await ensureYuiProfile(user);

  const { data, error } = await supabaseAdmin
    .from("conversations")
    .insert({
      user_id: user.id,
      role: input.role.trim(),
      content: input.content.trim(),
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const conversation = data as YuiConversation;
  const memoryCandidate = await createYuiMemoryCandidate(user, conversation);

  await createYuiEvent(user, {
    event_type: "conversation",
    source: "yui",
    title: summarizeConversation(conversation.content),
    content: conversation.content,
    metadata: {
      conversation_id: conversation.id,
      role: conversation.role,
      memory_candidate_id: memoryCandidate?.id ?? null,
    },
    occurred_at: conversation.created_at,
  });

  return { conversation, memoryCandidate };
}

export async function createYuiMemoryCandidate(
  user: SessionUser,
  conversation: YuiConversation,
): Promise<YuiMemoryCandidate> {
  const draft = deriveCandidateDraft(conversation.content);
  const { data, error } = await supabaseAdmin
    .from("memory_candidates")
    .insert({
      user_id: user.id,
      conversation_id: conversation.id,
      title: draft.title,
      summary: draft.summary,
      reason: draft.reason,
      importance: draft.importance,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await createYuiEvent(user, {
    event_type: "memory_candidate_created",
    source: "yui",
    title: data.title,
    content: data.summary,
    metadata: {
      memory_candidate_id: data.id,
      conversation_id: conversation.id,
      importance: data.importance,
      status: data.status,
    },
    occurred_at: data.created_at,
  });

  return data as YuiMemoryCandidate;
}

export async function getLatestYuiReflection(userId: string): Promise<YuiReflection | null> {
  const { data, error } = await supabaseAdmin
    .from("reflections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as YuiReflection | null;
}

export async function listYuiReflections(userId: string, limit = 20): Promise<YuiReflection[]> {
  const { data, error } = await supabaseAdmin
    .from("reflections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as YuiReflection[];
}

export async function listYuiMemoriesSince(userId: string, since: Date, limit = 50): Promise<YuiMemory[]> {
  const { data, error } = await supabaseAdmin
    .from("memories")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as YuiMemory[];
}

export async function listYuiConversationsSince(
  userId: string,
  since: Date,
  limit = 50,
): Promise<YuiConversation[]> {
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as YuiConversation[];
}

export async function listYuiDecisions(
  userId: string,
  limit = 20,
): Promise<YuiDecision[]> {
  const { data, error } = await supabaseAdmin
    .from("decisions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as YuiDecision[];
}

export async function listYuiDecisionsSince(
  userId: string,
  since: Date,
  limit = 50,
): Promise<YuiDecision[]> {
  const { data, error } = await supabaseAdmin
    .from("decisions")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as YuiDecision[];
}

export async function createYuiDecision(
  user: SessionUser,
  input: YuiDecisionInput,
): Promise<YuiDecision> {
  await ensureYuiProfile(user);

  const { data, error } = await supabaseAdmin
    .from("decisions")
    .insert({
      user_id: user.id,
      question: normalizeDecisionText(input.question),
      context: normalizeDecisionText(input.context),
      decision: normalizeDecisionText(input.decision),
      rationale: normalizeDecisionText(input.rationale),
      confidence: normalizeDecisionConfidence(input.confidence),
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await createYuiEvent(user, {
    event_type: "decision_created",
    source: "yui",
    title: data.question,
    content: data.decision,
    metadata: {
      decision_id: data.id,
      confidence: data.confidence,
      rationale: data.rationale,
    },
    occurred_at: data.created_at,
  });

  return data as YuiDecision;
}

export async function createYuiReflectionFromRecentWindow(
  user: SessionUser,
): Promise<YuiReflection> {
  await ensureYuiProfile(user);

  const since = getDaysAgo(7);
  const [profile, memories, conversations] = await Promise.all([
    getYuiProfile(user.id),
    listYuiMemoriesSince(user.id, since, 50),
    listYuiConversationsSince(user.id, since, 50),
  ]);

  const { summary, insights, nextActions } = buildReflectionFromWindow(memories, conversations, profile);

  return createYuiReflection(user, {
    summary,
    insights,
    next_actions: nextActions,
  });
}

export async function listYuiMemoryCandidates(
  userId: string,
  status: "pending" | "approved" | "rejected" = "pending",
  limit = 10,
): Promise<YuiMemoryCandidate[]> {
  const { data, error } = await supabaseAdmin
    .from("memory_candidates")
    .select("*")
    .eq("user_id", userId)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as YuiMemoryCandidate[];
}

export async function getYuiMemoryCandidateById(
  userId: string,
  candidateId: string,
): Promise<YuiMemoryCandidate | null> {
  const { data, error } = await supabaseAdmin
    .from("memory_candidates")
    .select("*")
    .eq("user_id", userId)
    .eq("id", candidateId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as YuiMemoryCandidate | null;
}

export async function approveYuiMemoryCandidate(
  user: SessionUser,
  candidateId: string,
): Promise<{ candidate: YuiMemoryCandidate; memory: YuiMemory | null }> {
  await ensureYuiProfile(user);

  const candidate = await getYuiMemoryCandidateById(user.id, candidateId);
  if (!candidate) {
    throw new Error("Memory candidate not found");
  }

  if (candidate.status !== "pending") {
    return { candidate, memory: null };
  }

  const memory = await createYuiMemoryFromCandidate(user, candidate);

  const { data, error } = await supabaseAdmin
    .from("memory_candidates")
    .update({ status: "approved" })
    .eq("id", candidate.id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return { candidate: data as YuiMemoryCandidate, memory };
}

export async function rejectYuiMemoryCandidate(
  user: SessionUser,
  candidateId: string,
): Promise<YuiMemoryCandidate> {
  await ensureYuiProfile(user);

  const candidate = await getYuiMemoryCandidateById(user.id, candidateId);
  if (!candidate) {
    throw new Error("Memory candidate not found");
  }

  if (candidate.status !== "pending") {
    return candidate;
  }

  const { data, error } = await supabaseAdmin
    .from("memory_candidates")
    .update({ status: "rejected" })
    .eq("id", candidate.id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as YuiMemoryCandidate;
}

export async function buildYuiToday(userId: string): Promise<YuiToday> {
  const since = getDaysAgo(7);
  const [profile, memories, conversations, decisions, reflection, goals, milestones, recentEvents] = await Promise.all([
    getYuiProfile(userId),
    listYuiMemoriesSince(userId, since, 50),
    listYuiConversationsSince(userId, since, 50),
    listYuiDecisionsSince(userId, since, 50),
    getLatestYuiReflection(userId),
    listYuiGoals(userId, 20),
    listYuiMilestones(userId, undefined, 50),
    getRecentYuiEvents(userId, 5),
  ]);

  const currentGoal = goals.find((goal) => goal.status === "active") ?? goals[0] ?? null;
  const currentMilestones = currentGoal
    ? milestones.filter((milestone) => milestone.goal_id === currentGoal.id)
    : [];
  const todayWindow = getTodayWindow();
  const calendarEvents = await listYuiCalendarEvents(userId, {
    start: todayWindow.start,
    end: todayWindow.end,
    limit: 10,
  });
  const suggestedTimeBlocks = await syncSuggestedTimeBlocksFromAnalysis(userId, {
    profile,
    currentGoal,
    memories,
    decisions,
    events: recentEvents,
    calendarEvents,
    window: todayWindow,
  });

  const importantMemories = [...memories]
    .sort((a, b) => {
      if (b.importance !== a.importance) return b.importance - a.importance;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 3);

  const recentInsights = uniqueStrings([
    ...(reflection?.insights ?? []),
    ...importantMemories.map((memory) => memory.summary),
  ]).slice(0, 3);

  const pendingTasks = uniqueStrings([
    ...(reflection?.next_actions ?? []),
    ...conversations
      .filter((conversation) => conversation.role === "user")
      .map((conversation) => conversation.content.trim())
      .filter((content) => content.length > 0 && /(\?|TODO|タスク|やる|あとで|確認)/i.test(content)),
  ]).slice(0, 3);

  const recentTrends = buildTrendLabels(importantMemories, conversations, decisions);
  const nextThoughts = buildNextThoughts(pendingTasks, recentInsights, recentTrends, decisions);
  const recommendedActions = buildRecommendedActions(recentTrends, pendingTasks, recentInsights);
  const decisionCards = buildDecisionCards({
    profile,
    recentTrends,
    pendingTasks,
    recommendedActions,
    recentInsights,
    decisions,
  });
  const dailyBrief = buildDailyBrief({
    profile,
    memories,
    conversations,
    decisions,
    currentGoal,
    milestones: currentMilestones,
  });
  const currentPosition = buildCurrentPosition(currentGoal, currentMilestones);
  const summary = buildTodaySummary(
    profile,
    importantMemories.length,
    pendingTasks.length,
    recentInsights.length,
  );

  return {
    summary,
    importantMemories,
    pendingTasks,
    recentInsights,
    recentTrends,
    nextThoughts,
    recommendedActions,
    decisionCards,
    dailyBrief,
    currentPosition,
    recentEvents,
    calendarEvents,
    suggestedTimeBlocks,
  };
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function buildTodaySummary(
  profile: YuiProfile | null,
  importantCount: number,
  taskCount: number,
  insightCount: number,
) {
  const name = profile?.display_name?.trim();
  const prefix = name ? `${name}さん、おはようございます。` : "おはようございます。";

  return `${prefix}今日の状態は、重要な記憶 ${importantCount} 件、未完了タスク ${taskCount} 件、最近の気づき ${insightCount} 件です。`;
}

export async function createYuiReflection(
  user: SessionUser,
  input: CreateYuiReflectionInput,
): Promise<YuiReflection> {
  await ensureYuiProfile(user);

  const { data, error } = await supabaseAdmin
    .from("reflections")
    .insert({
      user_id: user.id,
      summary: input.summary.trim(),
      insights: normalizeTextArray(input.insights),
      next_actions: normalizeTextArray(input.next_actions),
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await createYuiEvent(user, {
    event_type: "reflection_created",
    source: "system",
    title: data.summary,
    content: data.summary,
    metadata: {
      reflection_id: data.id,
      insights_count: data.insights.length,
      next_actions_count: data.next_actions.length,
    },
    occurred_at: data.created_at,
  });

  return data as YuiReflection;
}

export async function listYuiGoals(userId: string, limit = 20): Promise<YuiGoal[]> {
  const { data, error } = await supabaseAdmin
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as YuiGoal[];
}

export async function getYuiGoalById(userId: string, goalId: string): Promise<YuiGoal | null> {
  const { data, error } = await supabaseAdmin
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .eq("id", goalId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as YuiGoal | null;
}

export async function getYuiCurrentGoal(userId: string): Promise<YuiGoal | null> {
  const goals = await listYuiGoals(userId, 20);
  const activeGoal = goals.find((goal) => goal.status === "active");
  return activeGoal ?? goals[0] ?? null;
}

export async function createYuiGoal(
  user: SessionUser,
  input: CreateYuiGoalInput,
): Promise<YuiGoal> {
  await ensureYuiProfile(user);

  const { data, error } = await supabaseAdmin
    .from("goals")
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      description: input.description.trim(),
      status: normalizeGoalStatus(input.status),
      progress: normalizeGoalProgress(input.progress),
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await createYuiEvent(user, {
    event_type: "goal_created",
    source: "manual",
    title: data.title,
    content: data.description,
    metadata: {
      goal_id: data.id,
      status: data.status,
      progress: data.progress,
    },
    occurred_at: data.created_at,
  });

  return data as YuiGoal;
}

export async function updateYuiGoal(
  user: SessionUser,
  goalId: string,
  input: UpdateYuiGoalInput,
): Promise<YuiGoal> {
  await ensureYuiProfile(user);

  const payload: Record<string, unknown> = {};

  if (typeof input.title === "string") payload.title = input.title.trim();
  if (typeof input.description === "string") payload.description = input.description.trim();
  if (typeof input.status === "string") payload.status = normalizeGoalStatus(input.status);
  if (typeof input.progress === "number") payload.progress = normalizeGoalProgress(input.progress);

  const { data, error } = await supabaseAdmin
    .from("goals")
    .update(payload)
    .eq("user_id", user.id)
    .eq("id", goalId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (Object.keys(payload).length > 0) {
    await createYuiEvent(user, {
      event_type: "goal_updated",
      source: "manual",
      title: data.title,
      content: data.description,
      metadata: {
        goal_id: data.id,
        status: data.status,
        progress: data.progress,
      },
      occurred_at: data.updated_at,
    });
  }

  return data as YuiGoal;
}

export async function listYuiMilestones(userId: string, goalId?: string, limit = 50): Promise<YuiMilestone[]> {
  let query = supabaseAdmin
    .from("milestones")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (goalId) {
    query = query.eq("goal_id", goalId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as YuiMilestone[];
}

export async function createYuiMilestone(
  user: SessionUser,
  input: CreateYuiMilestoneInput,
): Promise<YuiMilestone> {
  await ensureYuiProfile(user);

  const goal = await getYuiGoalById(user.id, input.goal_id);
  if (!goal) {
    throw new Error("Goal not found");
  }

  const { data, error } = await supabaseAdmin
    .from("milestones")
    .insert({
      user_id: user.id,
      goal_id: input.goal_id,
      title: input.title.trim(),
      status: normalizeMilestoneStatus(input.status),
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await createYuiEvent(user, {
    event_type: "task_created",
    source: "manual",
    title: data.title,
    content: data.title,
    metadata: {
      milestone_id: data.id,
      goal_id: data.goal_id,
      status: data.status,
    },
    occurred_at: data.created_at,
  });

  return data as YuiMilestone;
}
