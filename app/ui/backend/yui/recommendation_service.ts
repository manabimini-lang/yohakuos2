import { findBestGap, normalizeTimeZone } from "./timezone";
import { isFutureInterval } from "@/lib/yui-ux";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop: keyof SupabaseClient) {
    const target = getSupabaseAdmin();
    const value = target[prop];
    return typeof value === "function" ? value.bind(target) : value;
  },
});
import { createYuiEvent, createYuiSuggestedTimeBlock, ensureYuiCalendarActionFromTimeBlock, listYuiCalendarEvents, listYuiDecisionsSince, listYuiGoals, listYuiMemoriesSince, listYuiSuggestedTimeBlocks, listYuiConversationsSince, listYuiEvents, getYuiProfile } from "./service";
import { checkAIAvailability, generateJSON } from "@/lib/ai/gemini";
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
  if (type === "time_block" || type === "decision" || type === "task" || type === "reflection" || type === "action") {
    return type;
  }
  return "time_block";
}

function isActionRecommendationContent(content: string) {
  try {
    const parsed = JSON.parse(content) as { type?: unknown; params?: unknown } | null;
    return Boolean(
      parsed
      && typeof parsed.type === "string"
      && parsed.params
      && typeof parsed.params === "object",
    );
  } catch {
    return false;
  }
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
    params.currentGoal ? `現在の目的「${params.currentGoal.title}」に沿っています。` : "今の文脈に合うテーマです。",
    params.relatedDecisions.length > 0 ? "最近の判断とつながっています。" : null,
    params.relatedMemories.length > 0 ? "関連する記憶が見つかっています。" : null,
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
  timeZone?: string;
  topic: string;
  gap: { start: Date; end: Date; minutes: number } | null;
  currentGoal: YuiGoal | null;
  contextText: string;
}) {
  const proposed_start_at = params.gap?.start.toISOString() ?? "";
  const proposed_end_at = params.gap?.end.toISOString() ?? "";
  const proposed_label = params.gap
    ? `${params.gap.start.toLocaleDateString("ja-JP", { timeZone: params.timeZone ?? "Asia/Tokyo", weekday: "short", month: "numeric", day: "numeric" })} ${params.gap.start.toLocaleTimeString("ja-JP", { timeZone: params.timeZone ?? "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false })}〜${params.gap.end.toLocaleTimeString("ja-JP", { timeZone: params.timeZone ?? "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false })}`
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

function parseAiRecommendationPayload(text: string) {
  const blockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = blockMatch ? blockMatch[1] : text;
  const jsonText = candidate.trim();
  if (!jsonText) return null;

  try {
    const payload = JSON.parse(jsonText) as {
      title?: string;
      reason?: string;
      content?: string;
      score?: number;
    };

    if (!payload.title || !payload.reason || !payload.content) {
      return null;
    }

    return {
      title: normalizeRecommendationText(payload.title),
      reason: normalizeRecommendationText(payload.reason),
      content: normalizeRecommendationText(payload.content),
      score: Number.isFinite(payload.score) ? Math.max(0, Math.min(100, Math.trunc(payload.score ?? 0))) : 0,
    };
  } catch {
    return null;
  }
}

async function tryGenerateRecommendationWithAi(
  user: SessionUser,
  focusText: string,
  context: RecommendationContext,
): Promise<{
  title: string;
  reason: string;
  content: string;
  score: number;
} | null> {
  const availability = await checkAIAvailability(user.id);
  if (!availability.available) {
    return null;
  }

  console.log("[YUI Recommendation] AI provider attempt", {
    userId: user.id,
    provider: "gemini",
    model: "gemini-2.5-flash",
    credentialSource: availability.source,
  });

  const prompt = [
    "あなたはYUIの提案生成器です。",
    "以下のユーザー文脈から、1件のおすすめ時間ブロック提案をJSONのみで返してください。",
    "必要なキーは title, reason, content, score です。",
    "不要な説明や箇条書きは入れないでください。",
    `ユーザーの相談内容: ${focusText || "なし"}`,
    `現在の目的: ${context.currentGoal?.title ?? "なし"}`,
    `関連する記憶: ${(context.memories?.slice(0, 3).map((memory) => memory.title).join(" / ") || "なし")}`,
    `最近の判断: ${(context.decisions?.slice(0, 3).map((decision) => decision.question).join(" / ") || "なし")}`,
    `予定: ${(context.calendarEvents?.slice(0, 3).map((event) => `${event.title}:${event.start_at}`).join(" / ") || "なし")}`,
  ].join("\n");

  try {
    const aiResponse = await generateJSON<{
      title?: string;
      reason?: string;
      content?: string;
      score?: number;
    }>(prompt, "You produce concise JSON only.", {
      userId: user.id,
      taskClass: "standard",
    });

    const payload = parseAiRecommendationPayload(JSON.stringify(aiResponse.data));
    if (!payload) {
      console.warn("[YUI Recommendation] AI returned unparsable JSON, falling back to rule engine", {
        userId: user.id,
        provider: "gemini",
        model: "gemini-2.5-flash",
      });
      return null;
    }

    console.log("[YUI Recommendation] AI provider success", {
      userId: user.id,
      provider: "gemini",
      model: "gemini-2.5-flash",
      score: payload.score,
    });

    return payload;
  } catch (error) {
    console.error("[YUI Recommendation] AI provider failure, falling back to rule engine", {
      userId: user.id,
      provider: "gemini",
      model: "gemini-2.5-flash",
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
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

  if (!isFutureInterval(parsed.proposed_start_at, parsed.proposed_end_at)) {
    throw new Error("この時間提案は期限切れです。新しい提案を作成してください。");
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
  return ((data ?? []) as YuiRecommendation[]).map((item) => (
    item.type === "time_block" && isActionRecommendationContent(item.content)
      ? { ...item, type: "action" }
      : item
  )).filter(item => {
    if (item.type !== "time_block" || item.status !== "pending") return true;
    const interval = parseRecommendationContent(item.content);
    return interval && isFutureInterval(interval.proposed_start_at, interval.proposed_end_at);
  });
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
  const availableMinutes = Math.max(1, Math.min(540, Number(focusText.match(/(\d+)\s*分/)?.[1] ?? 30)));
  const timeZone = normalizeTimeZone((context.profile?.preferences as { timezone?: string } | undefined)?.timezone);
  const candidateGap = findBestGap(context.calendarEvents, new Date(), availableMinutes, timeZone);
  if (!candidateGap) throw new Error("今後14日間に条件に合う空き時間がありません。使える時間を短くしてお試しください。");
  const gap = { ...candidateGap, end: new Date(candidateGap.start.getTime() + Math.min(availableMinutes, candidateGap.minutes) * 60000), minutes: Math.min(availableMinutes, candidateGap.minutes) };
  const relatedDecisionIds = extractRelatedDecisions(context);
  const relatedMemoryIds = extractRelatedMemories(context);
  const ruleScore = computeScore({
    currentGoal: context.currentGoal,
    gap,
    relatedDecisions: relatedDecisionIds,
    relatedMemories: relatedMemoryIds,
    conversations: context.conversations,
    currentGoalProgress: context.currentGoal?.progress ?? 0,
  });
  const ruleTitle = buildRecommendationTitle(topic);
  const ruleReason = buildReason({
    currentGoal: context.currentGoal,
    gap,
    relatedDecisions: relatedDecisionIds,
    relatedMemories: relatedMemoryIds,
    contextText: focusText,
  });
  const ruleContent = buildContent({
    timeZone,
    topic,
    gap,
    currentGoal: context.currentGoal,
    contextText: focusText,
  });

  const aiResult = await tryGenerateRecommendationWithAi(user, focusText, context);
  const title = aiResult?.title ?? ruleTitle;
  const reason = aiResult?.reason ?? ruleReason;
  const aiInterval = aiResult ? parseRecommendationContent(aiResult.content) : null;
  const validAiInterval = aiInterval && isFutureInterval(aiInterval.proposed_start_at, aiInterval.proposed_end_at)
    && Date.parse(aiInterval.proposed_end_at) - Date.parse(aiInterval.proposed_start_at) <= availableMinutes * 60000
    && Date.parse(aiInterval.proposed_start_at) >= candidateGap.start.getTime()
    && Date.parse(aiInterval.proposed_end_at) <= candidateGap.end.getTime();
  const content = validAiInterval ? aiResult!.content : ruleContent;
  const score = aiResult?.score ?? ruleScore;

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
    const block = await ensureSuggestedTimeBlockFromRecommendation(user, data as YuiRecommendation);
    // Accepting a time recommendation creates an in-app registration candidate.
    // The separate calendar action is the explicit final approval for any
    // external Google Calendar write.
    if (block) {
      await ensureYuiCalendarActionFromTimeBlock(user, block);
    }
  }

  if (normalizedStatus === "accepted" || normalizedStatus === "rejected" || normalizedStatus === "completed") {
    await writeRecommendationEvent(user, data as YuiRecommendation, normalizedStatus);
  } else {
    await writeRecommendationEvent(user, data as YuiRecommendation, "updated");
  }

  return data as YuiRecommendation;
}
