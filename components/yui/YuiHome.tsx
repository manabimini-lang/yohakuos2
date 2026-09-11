"use client";

import { goalProgress, isFutureInterval, isTestContent, isUserActivity } from "@/lib/yui-ux";
import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { Bell, GitBranch, Lightbulb, Loader2, RefreshCw, Settings, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BriefAudio } from "@/components/yui/BriefAudio";
import { LegacyLocalLogMigration } from "@/components/yui/LegacyLocalLogMigration";

import type { YuiActionSuggestion } from "@/app/ui/backend/yui/action_service";
import { MemoryList } from "@/components/yui/MemoryList";
import { YuiChat } from "@/components/yui/YuiChat";
import { YuiFirstMeetingCard } from "@/components/yui/YuiFirstMeetingCard";
import type {
  YuiConversation,
  YuiCalendarAction,
  YuiDecision,
  YuiGoal,
  YuiMemory,
  YuiMemoryCandidate,
  YuiMilestone,
  YuiProfile,
  YuiProfileSettings,
  YuiReflection,
  YuiRecommendation,
  YuiSuggestedTimeBlock,
  YuiToday,
  YuiNotificationDeliveryStatus,
  YuiNotificationPreview,
} from "@/app/ui/backend/yui/models";
import type { YuiContextSummary } from "@/app/ui/backend/yui/context_service";
import type { YuiMorningBrief } from "@/app/ui/backend/yui/brief_service";
import type { YuiDailyContext } from "@/app/ui/backend/yui/daily_context_service";
import type { YuiMemoryLayer } from "@/app/ui/backend/yui/memory_layer_service";
import type { YuiThreadInsight } from "@/app/ui/backend/yui/thread_intelligence_service";
import type { YuiThreadProgress } from "@/app/ui/backend/yui/progress_service";
import type { YuiTimeIntelligence } from "@/app/ui/backend/yui/time_intelligence_service";
import type { YuiPlanningSuggestion } from "@/app/ui/backend/yui/planning_service";
import type { YuiWeeklyReview } from "@/app/ui/backend/yui/weekly_review_service";
import { YuiDailyContextCard } from "@/components/yui/YuiDailyContextCard";

import { YuiThreadInsightsCard } from "@/components/yui/YuiThreadInsightsCard";
import { YuiProgressCard } from "@/components/yui/YuiProgressCard";
import { YuiTimeInsightsCard } from "@/components/yui/YuiTimeInsightsCard";
import { YuiPlanningCard } from "@/components/yui/YuiPlanningCard";
import { YuiWeeklyReviewCard } from "@/components/yui/YuiWeeklyReviewCard";
import { YuiCardSkeleton } from "@/components/yui/YuiCardSkeleton";
import TodaySummary from "@/components/yui/TodaySummary";
import ActionArea from "@/components/yui/ActionArea";
import InfoAccordion from "@/components/yui/InfoAccordion";
import { ActivityFeedCard } from "@/components/yui/ActivityFeedCard";
import { YuiPresenceDashboard, type YuiPresenceState } from "@/components/yui/YuiPresenceDashboard";
import { useCaptureStore } from "@/store/capture-store";

type YuiHomeProps = {
  displayName?: string | null;
};

type ParsedRecommendationContent = {
  summary: string;
  proposed_start_at: string;
  proposed_end_at: string;
  proposed_label: string;
  topic: string;
  context_excerpt: string;
  goal_title: string | null;
};

type YuiGoogleHealthState = {
  status: "connected" | "refreshing" | "needs_reauth" | "sync_error" | "disconnected";
  calendarConnected: boolean;
  gmailConnected: boolean;
  scopes: string[];
  tokenValid: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
};

type YuiHomeSnapshot = {
  today: YuiToday | null;
  morningBrief: YuiMorningBrief | null;
  dailyContext: YuiDailyContext | null;
  memoryLayer: YuiMemoryLayer | null;
  threadInsights: YuiThreadInsight[] | null;
  threadProgress: YuiThreadProgress[] | null;
  timeIntelligence: YuiTimeIntelligence | null;
  planningSuggestions: YuiPlanningSuggestion[] | null;
  actions: YuiActionSuggestion[];
  weeklyReview: YuiWeeklyReview | null;
  contextSummary: YuiContextSummary | null;
  profile: YuiProfile | null;
  memories: YuiMemory[];
  memoryCandidates: YuiMemoryCandidate[];
  conversations: YuiConversation[];
  decisions: YuiDecision[];
  goals: YuiGoal[];
  milestones: YuiMilestone[];
  reflections: YuiReflection[];
  recommendations: YuiRecommendation[];
  timeBlocks: YuiSuggestedTimeBlock[];
  calendarActions: YuiCalendarAction[];
  latestReflection: YuiReflection | null;
  deliveryStatus: YuiNotificationDeliveryStatus | null;
  notificationPreviews: {
    morning: YuiNotificationPreview;
    evening: YuiNotificationPreview;
  } | null;
  gmailInsights: any[];
  unifiedActions: any[];
};

type YuiDashboardPayload = {
  data?: Partial<YuiHomeSnapshot> & { googleHealth?: YuiGoogleHealthState | null };
  errors?: Record<string, string>;
  error?: string;
};

const YUI_HOME_CACHE_KEY = "yui-home-cache-v2";

function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) {
    return "未取得";
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.round(diffMs / (1000 * 60)));
  if (diffMinutes < 1) {
    return "たった今";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}分前`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}時間前`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}日前`;
}

function readYuiHomeCache(): { updatedAt: number; snapshot: YuiHomeSnapshot } | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(YUI_HOME_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { updatedAt?: number; snapshot?: YuiHomeSnapshot };
    if (!parsed.updatedAt || !parsed.snapshot) {
      return null;
    }

    return {
      updatedAt: parsed.updatedAt,
      snapshot: parsed.snapshot,
    };
  } catch {
    return null;
  }
}

function writeYuiHomeCache(snapshot: YuiHomeSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    YUI_HOME_CACHE_KEY,
    JSON.stringify({
      updatedAt: Date.now(),
      snapshot,
    }),
  );
}

function parseRecommendationContent(content: string): ParsedRecommendationContent | null {
  if (!content) {
    return null;
  }

  try {
    const parsed = JSON.parse(content) as Partial<ParsedRecommendationContent>;
    return {
      summary: String(parsed.summary ?? "").trim(),
      proposed_start_at: String(parsed.proposed_start_at ?? "").trim(),
      proposed_end_at: String(parsed.proposed_end_at ?? "").trim(),
      proposed_label: String(parsed.proposed_label ?? "").trim(),
      topic: String(parsed.topic ?? "").trim(),
      context_excerpt: String(parsed.context_excerpt ?? "").trim(),
      goal_title: parsed.goal_title == null ? null : String(parsed.goal_title).trim(),
    };
  } catch {
    return {
      summary: content.trim(),
      proposed_start_at: "",
      proposed_end_at: "",
      proposed_label: "",
      topic: "",
      context_excerpt: content.trim(),
      goal_title: null,
    };
  }
}

function formatProposedSchedule(startAt: string, endAt: string) {
  if (!startAt) return null;
  const start = new Date(startAt);
  const end = endAt ? new Date(endAt) : null;
  if (Number.isNaN(start.getTime()) || (end && Number.isNaN(end.getTime()))) return null;
  const date = format(start, "M月d日（E）");
  const startTime = format(start, "HH:mm");
  const endTime = end ? format(end, "HH:mm") : null;
  return `予定日時: ${date} ${startTime}${endTime ? `〜${endTime}` : ""}`;
}

function formatRecommendationReason(reason: string) {
  return reason.trim() === "YUI Chatでの対話から自動提案されました。"
    ? "YUIとの相談内容から提案しました。"
    : reason;
}



function timeSlotKey(input: Pick<YuiSuggestedTimeBlock, "title" | "start_at" | "end_at">) {
  return [input.title.trim(), input.start_at, input.end_at].join("|");
}

function dedupeSuggestedTimeBlocks(blocks: YuiSuggestedTimeBlock[]) {
  const statusRank: Record<string, number> = { created: 4, approved: 3, pending: 2, rejected: 1 };
  const selected = new Map<string, YuiSuggestedTimeBlock>();

  for (const block of blocks) {
    const key = timeSlotKey(block);
    const current = selected.get(key);
    if (!current
      || (statusRank[block.status] ?? 0) > (statusRank[current.status] ?? 0)
      || ((statusRank[block.status] ?? 0) === (statusRank[current.status] ?? 0)
        && new Date(block.updated_at).getTime() > new Date(current.updated_at).getTime())) {
      selected.set(key, block);
    }
  }

  return [...selected.values()];
}

function orderCalendarActions(actions: YuiCalendarAction[]) {
  const statusRank: Record<string, number> = { scheduled: 4, approved: 3, pending: 2, rejected: 1 };
  return [...actions].sort((left, right) => {
    const rankDifference = (statusRank[right.status] ?? 0) - (statusRank[left.status] ?? 0);
    return rankDifference || new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
  });
}

export function YuiHome({ displayName }: YuiHomeProps) {
  const openCapture = useCaptureStore((state) => state.openCapture);
  const [today, setToday] = useState<YuiToday | null>(null);
  const [morningBrief, setMorningBrief] = useState<YuiMorningBrief | null>(null);
  const [dailyContext, setDailyContext] = useState<YuiDailyContext | null>(null);
  const [memoryLayer, setMemoryLayer] = useState<YuiMemoryLayer | null>(null);
  const [threadInsights, setThreadInsights] = useState<YuiThreadInsight[] | null>(null);
  const [threadProgress, setThreadProgress] = useState<YuiThreadProgress[] | null>(null);
  const [timeIntelligence, setTimeIntelligence] = useState<YuiTimeIntelligence | null>(null);
  const [planningSuggestions, setPlanningSuggestions] = useState<YuiPlanningSuggestion[] | null>(null);
  const [actions, setActions] = useState<YuiActionSuggestion[]>([]);
  const [weeklyReview, setWeeklyReview] = useState<YuiWeeklyReview | null>(null);
  const [contextSummary, setContextSummary] = useState<YuiContextSummary | null>(null);
  const [profile, setProfile] = useState<YuiProfile | null>(null);
  const [memories, setMemories] = useState<YuiMemory[]>([]);
  const [memoryCandidates, setMemoryCandidates] = useState<YuiMemoryCandidate[]>([]);
  const [conversations, setConversations] = useState<YuiConversation[]>([]);
  const [decisions, setDecisions] = useState<YuiDecision[]>([]);
  const [googleHealth, setGoogleHealth] = useState<YuiGoogleHealthState | null>(null);
  const [aiConnectionState, setAiConnectionState] = useState<"checking" | "configured" | "missing" | "error">("checking");
  const [goals, setGoals] = useState<YuiGoal[]>([]);
  const [milestones, setMilestones] = useState<YuiMilestone[]>([]);
  const [reflections, setReflections] = useState<YuiReflection[]>([]);
  const [recommendations, setRecommendations] = useState<YuiRecommendation[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<YuiSuggestedTimeBlock[]>([]);
  const [calendarActions, setCalendarActions] = useState<YuiCalendarAction[]>([]);
  const [latestReflection, setLatestReflection] = useState<YuiReflection | null>(null);
  const [profileForm, setProfileForm] = useState<YuiProfileSettings>({
    display_name: displayName ?? "", assistant_name: displayName ?? "YUI", tone: "gentle", life_theme: "", focus_area: "",
    notification_strength: "normal", summary_frequency: "daily", timezone: "Asia/Tokyo",
  });
  const [goalForm, setGoalForm] = useState({
    title: "",
    description: "",
    status: "active",
    progress: 0,
  });
  const [milestoneForm, setMilestoneForm] = useState({
    goal_id: "",
    title: "",
    status: "pending",
  });
  const [deliveryStatus, setDeliveryStatus] = useState<YuiNotificationDeliveryStatus | null>(null);
  const [notificationPreviews, setNotificationPreviews] = useState<{
    morning: YuiNotificationPreview;
    evening: YuiNotificationPreview;
  } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);
  const [deleteConfirmGoalId, setDeleteConfirmGoalId] = useState<string | null>(null);
  const [deleteConfirmMilestoneId, setDeleteConfirmMilestoneId] = useState<string | null>(null);
  const [cancelCalendarActionId, setCancelCalendarActionId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cacheUpdatedAt, setCacheUpdatedAt] = useState<number | null>(null);
  const [showHealthMenu, setShowHealthMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [focusGoalIndex, setFocusGoalIndex] = useState(0);
  const focusTouchStartX = useRef<number | null>(null);
  const [chatDraftRequest, setChatDraftRequest] = useState({ id: 0, value: "" });
  const [gmailInsights, setGmailInsights] = useState<any[]>([]);
  // Keep unsaved progress local to each goal. A single draft value here would
  // leak the slider value when Current Focus is switched to another goal.
  const [progressDrafts, setProgressDrafts] = useState<Record<string, number>>({});
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [quickPanel, setQuickPanel] = useState<"task" | "reflection" | "memo" | null>(null);
  const [quickTaskDraft, setQuickTaskDraft] = useState("");
  const [quickReflectionDraft, setQuickReflectionDraft] = useState("");
  const [quickNextActionDraft, setQuickNextActionDraft] = useState("");
  const [quickMemoDraft, setQuickMemoDraft] = useState("");
  const [isSavingQuickPanel, setIsSavingQuickPanel] = useState(false);
  const [addingTaskActionId, setAddingTaskActionId] = useState<string | null>(null);
  const [addedTaskActionIds, setAddedTaskActionIds] = useState<Set<string>>(new Set());

  // Refs for Goal Form — used by Setup Guide CTA
  const goalCardRef = useRef<HTMLDivElement>(null);
  const goalTitleInputRef = useRef<HTMLInputElement>(null);
  const chatCardRef = useRef<HTMLDivElement>(null);
  const chatComposerRef = useRef<HTMLTextAreaElement>(null);

  const openChatComposer = useCallback((draft?: string) => {
    setShowFabMenu(false);
    if (draft !== undefined) {
      setChatDraftRequest((current) => ({ id: current.id + 1, value: draft }));
    }
    setTimeout(() => {
      chatCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      chatComposerRef.current?.focus();
    }, 80);
  }, []);

  const openGoalForm = useCallback(() => {
    setShowMore(true);
    // Wait one frame for More section to render, then scroll + focus
    setTimeout(() => {
      goalCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => goalTitleInputRef.current?.focus(), 300);
    }, 80);
  }, []);
  const [unifiedActions, setUnifiedActions] = useState<any[]>([]);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [completedActionIds, setCompletedActionIds] = useState<Set<string>>(new Set());

  // Accordion / lazy load states (Sprint 40.1)
  const [calendarState, setCalendarState] = useState<{
    loaded: boolean;
    loading: boolean;
    error: string | null;
    data: any[] | null;
  }>({ loaded: false, loading: false, error: null, data: null });

  const [gmailState, setGmailState] = useState<{ loaded: boolean; loading: boolean; error: string | null; data: any[] | null }>({ loaded: false, loading: false, error: null, data: null });

  const [memoryState, setMemoryState] = useState<{ loaded: boolean; loading: boolean; error: string | null; data: any[] | null }>({ loaded: false, loading: false, error: null, data: null });

  const [insightsState, setInsightsState] = useState<{ loaded: boolean; loading: boolean; error: string | null; data: any[] | null }>({ loaded: false, loading: false, error: null, data: null });

  const [goalsState, setGoalsState] = useState<{ loaded: boolean; loading: boolean; error: string | null; data: any[] | null }>({ loaded: false, loading: false, error: null, data: null });

  const fetchCalendar = async (force = false) => {
    if (!force && (calendarState.loaded || calendarState.loading)) return;
    setCalendarState((prev) => ({ ...prev, loaded: false, loading: true, error: null }));
    try {
      const res = await fetch("/api/yui/calendar-events");
      if (!res.ok) throw new Error(`status:${res.status}`);
      const payload = await res.json();
      setCalendarState({ loaded: true, loading: false, error: null, data: payload.calendarEvents ?? [] });
    } catch (e: any) {
      setCalendarState((prev) => ({ ...prev, loaded: false, loading: false, error: e?.message ?? "取得失敗" }));
    }
  };

  const fetchGmail = async (force = false) => {
    if (!force && (gmailState.loaded || gmailState.loading)) return;
    setGmailState((prev) => ({ ...prev, loaded: false, loading: true, error: null }));
    try {
      const res = await fetch("/api/yui/gmail/insights");
      if (!res.ok) throw new Error(`status:${res.status}`);
      const payload = await res.json();
      setGmailState({ loaded: true, loading: false, error: null, data: payload.insights ?? [] });
    } catch (e: any) {
      setGmailState((prev) => ({ ...prev, loaded: false, loading: false, error: e?.message ?? "取得失敗" }));
    }
  };

  const fetchMemories = async (force = false) => {
    if (!force && (memoryState.loaded || memoryState.loading)) return;
    setMemoryState((prev) => ({ ...prev, loaded: false, loading: true, error: null }));
    try {
      const res = await fetch("/api/yui/memories");
      if (!res.ok) throw new Error(`status:${res.status}`);
      const payload = await res.json();
      setMemoryState({ loaded: true, loading: false, error: null, data: payload.memories ?? [] });
    } catch (e: any) {
      setMemoryState((prev) => ({ ...prev, loaded: false, loading: false, error: e?.message ?? "取得失敗" }));
    }
  };

  const handleMemoryCollectionToggle = async () => {
    const enabled = profile?.preferences?.memory_collection_enabled !== false;
    const response = await fetch("/api/yui/memories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    if (!response.ok) throw new Error("記憶の設定を更新できませんでした");
    await loadData();
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!window.confirm("この記憶を削除します。元に戻せません。")) return;
    const response = await fetch(`/api/yui/memories?id=${encodeURIComponent(memoryId)}`, { method: "DELETE" });
    if (!response.ok) throw new Error("記憶を削除できませんでした");
    await loadData();
    await fetchMemories(true);
  };

  const handleDeleteAllMemories = async () => {
    if (!window.confirm("YUIが保存したすべての記憶を削除します。元に戻せません。")) return;
    const response = await fetch("/api/yui/memories?scope=all", { method: "DELETE" });
    if (!response.ok) throw new Error("記憶を削除できませんでした");
    await loadData();
    await fetchMemories(true);
  };

  const handleExportMemories = async () => {
    const response = await fetch("/api/yui/memories?limit=100", { cache: "no-store" });
    if (!response.ok) throw new Error("記憶を出力できませんでした");
    const payload = await response.json();
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), memories: payload.memories ?? [] }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "yui-memories.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const fetchInsights = async (force = false) => {
    if (!force && (insightsState.loaded || insightsState.loading)) return;
    setInsightsState((prev) => ({ ...prev, loaded: false, loading: true, error: null }));
    try {
      const res = await fetch("/api/yui/thread-insights");
      if (!res.ok) throw new Error(`status:${res.status}`);
      const payload = await res.json();
      setInsightsState({ loaded: true, loading: false, error: null, data: payload.threads ?? [] });
    } catch (e: any) {
      setInsightsState((prev) => ({ ...prev, loaded: false, loading: false, error: e?.message ?? "取得失敗" }));
    }
  };

  const fetchGoals = async (force = false) => {
    if (!force && (goalsState.loaded || goalsState.loading)) return;
    setGoalsState((prev) => ({ ...prev, loaded: false, loading: true, error: null }));
    try {
      const res = await fetch("/api/yui/goals");
      if (!res.ok) throw new Error(`status:${res.status}`);
      const payload = await res.json();
      setGoalsState({ loaded: true, loading: false, error: null, data: payload.goals ?? [] });
    } catch (e: any) {
      setGoalsState((prev) => ({ ...prev, loaded: false, loading: false, error: e?.message ?? "取得失敗" }));
    }
  };

  const handleExecuteUnifiedAction = async (action: any) => {
    setExecutingActionId(action.id);
    try {
      const res = await fetch("/api/yui/actions/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setCompletedActionIds((prev) => new Set(prev).add(action.id));
      } else {
        throw new Error("Failed to execute");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExecutingActionId(null);
    }
  };

  const applySnapshot = (snapshot: YuiHomeSnapshot) => {
    setToday(snapshot.today);
    setMorningBrief(snapshot.morningBrief);
    setDailyContext(snapshot.dailyContext);
    setMemoryLayer(snapshot.memoryLayer);
    setThreadInsights(snapshot.threadInsights);
    setThreadProgress(snapshot.threadProgress);
    setTimeIntelligence(snapshot.timeIntelligence);
    setPlanningSuggestions(snapshot.planningSuggestions);
    setActions(snapshot.actions);
    setWeeklyReview(snapshot.weeklyReview);
    setContextSummary(snapshot.contextSummary);
    setProfile(snapshot.profile);
    setMemories(snapshot.memories);
    setMemoryCandidates(snapshot.memoryCandidates);
    setConversations(snapshot.conversations);
    setDecisions(snapshot.decisions);
    setGoals(snapshot.goals);
    setMilestones(snapshot.milestones);
    setReflections(snapshot.reflections);
    setRecommendations(snapshot.recommendations);
    setTimeBlocks(snapshot.timeBlocks);
    setCalendarActions(snapshot.calendarActions);
    setLatestReflection(snapshot.latestReflection);
    setDeliveryStatus(snapshot.deliveryStatus);
    setNotificationPreviews(snapshot.notificationPreviews);
    setGmailInsights(snapshot.gmailInsights);
    setUnifiedActions(snapshot.unifiedActions);
  };

  const loadData = async ({ background = false }: { background?: boolean } = {}) => {
    setError(null);
    const cached = readYuiHomeCache();

    if (cached) {
      applySnapshot(cached.snapshot);
      setCacheUpdatedAt(cached.updatedAt);
      setIsInitialLoading(false);
    } else {
      setIsInitialLoading(true);
    }

    setIsRefreshing(!background);
    setSectionErrors({});

    try {
      const response = await fetch("/api/yui/dashboard", { cache: "no-store" });
      const payload = await response.json().catch(() => null) as YuiDashboardPayload | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "YUIデータの取得に失敗しました");
      }

      const currentCache = readYuiHomeCache()?.snapshot;
      const nextSnapshot: YuiHomeSnapshot = {
        today: currentCache?.today ?? null,
        morningBrief: currentCache?.morningBrief ?? null,
        dailyContext: currentCache?.dailyContext ?? null,
        memoryLayer: currentCache?.memoryLayer ?? null,
        threadInsights: currentCache?.threadInsights ?? null,
        threadProgress: currentCache?.threadProgress ?? null,
        timeIntelligence: currentCache?.timeIntelligence ?? null,
        planningSuggestions: currentCache?.planningSuggestions ?? null,
        actions: currentCache?.actions ?? [],
        weeklyReview: currentCache?.weeklyReview ?? null,
        contextSummary: currentCache?.contextSummary ?? null,
        profile: currentCache?.profile ?? null,
        memories: currentCache?.memories ?? [],
        memoryCandidates: currentCache?.memoryCandidates ?? [],
        conversations: currentCache?.conversations ?? [],
        decisions: currentCache?.decisions ?? [],
        goals: currentCache?.goals ?? [],
        milestones: currentCache?.milestones ?? [],
        reflections: currentCache?.reflections ?? [],
        recommendations: currentCache?.recommendations ?? [],
        timeBlocks: currentCache?.timeBlocks ?? [],
        calendarActions: currentCache?.calendarActions ?? [],
        latestReflection: currentCache?.latestReflection ?? null,
        deliveryStatus: currentCache?.deliveryStatus ?? null,
        notificationPreviews: currentCache?.notificationPreviews ?? null,
        gmailInsights: currentCache?.gmailInsights ?? [],
        unifiedActions: currentCache?.unifiedActions ?? [],
      };

      const { googleHealth: refreshedGoogleHealth, ...snapshotPatch } = payload?.data ?? {};
      Object.assign(nextSnapshot, snapshotPatch);
      if (payload?.data && Object.prototype.hasOwnProperty.call(payload.data, "googleHealth")) {
        setGoogleHealth(refreshedGoogleHealth ?? null);
      }
      setSectionErrors(payload?.errors ?? {});

      applySnapshot(nextSnapshot);
      writeYuiHomeCache(nextSnapshot);
      setCacheUpdatedAt(Date.now());
      setIsInitialLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "データの取得に失敗しました");
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadInitialData = async () => {
    await loadData({ background: true });
  };

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingProfile(true);
    try {
      const response = await fetch("/api/yui/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profileForm) });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "プロフィールの保存に失敗しました");
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "プロフィールの保存に失敗しました"); }
    finally { setIsSavingProfile(false); }
  };

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const refreshAiConnection = () => {
      void fetch("/api/ai/status", { cache: "no-store", signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error("AI設定の取得に失敗しました");
          const payload = await response.json() as { configured?: boolean };
          setAiConnectionState(payload.configured ? "configured" : "missing");
        })
        .catch(() => {
          if (!controller.signal.aborted) setAiConnectionState("error");
        });
    };
    refreshAiConnection();
    window.addEventListener("focus", refreshAiConnection);
    return () => {
      controller.abort();
      window.removeEventListener("focus", refreshAiConnection);
    };
  }, []);

  const handleSendConversation = async (content: string, goalId?: string) => {
    const response = await fetch("/api/yui/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "user", content, ...(goalId ? { goal_id: goalId, goal_association_source: "confirmed", goal_association_confidence: 100 } : {}) }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "会話の保存に失敗しました");
    }

    const payload = await response.json();
    // The assistant reply is ready at this point. Refresh secondary cards in
    // the background so the composer does not remain stuck on "送信中...".
    void (async () => {
      await loadData({ background: true });
    })().catch((error) => {
      console.error("[YUI] Background refresh after conversation failed", error);
    });
    return payload;
  };

  const handleApproveCandidate = async (candidateId: string) => {
    const response = await fetch(`/api/yui/memory-candidates/${candidateId}/approve`, {
      method: "POST",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "記憶化に失敗しました");
    }

    await loadData();
  };

  const handleChangeConversationGoal = async (conversationId: string, goalId: string | null) => {
    const response = await fetch(`/api/yui/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal_id: goalId }),
    });
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "記録先の変更に失敗しました");
    await loadData({ background: true });
  };

  const handleRejectCandidate = async (candidateId: string) => {
    const response = await fetch(`/api/yui/memory-candidates/${candidateId}/reject`, {
      method: "POST",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "却下に失敗しました");
    }

    await loadData();
  };

  const handleExecuteAction = async (recommendationId: string) => {
    setExecutingActionId(recommendationId);
    setError(null);
    try {
      const response = await fetch("/api/yui/actions/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "提案の実行に失敗しました");
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "提案の実行に失敗しました");
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleRejectAction = async (recommendationId: string) => {
    setExecutingActionId(recommendationId);
    setError(null);
    try {
      const response = await fetch(`/api/yui/recommendations/${recommendationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "提案の見送りに失敗しました");
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "提案の見送りに失敗しました");
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleDecisionChoice = async (
    card: NonNullable<YuiToday["decisionCards"]>[number],
    choiceLabel: string,
    choiceRationale: string,
  ) => {
    const response = await fetch("/api/yui/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: card.question,
        context: card.background,
        decision: choiceLabel,
        rationale: choiceRationale,
        confidence: card.confidence,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "判断の保存に失敗しました");
    }

    await loadData();
  };

  const handleUpdateTimeBlockStatus = async (blockId: string, status: string) => {
    const response = await fetch(`/api/yui/time-blocks/${blockId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "時間提案の更新に失敗しました");
    }

    await loadData();
  };

  const handleScheduleSuggestedTimeBlock = async (block: YuiSuggestedTimeBlock) => {
    setError(null);
    try {
      // Keep the suggested block and the external-calendar action in sync.
      const approval = await fetch(`/api/yui/time-blocks/${block.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (!approval.ok) {
        const payload = await approval.json().catch(() => null);
        throw new Error(payload?.error ?? "時間提案の承認に失敗しました");
      }

      const actionResponse = await fetch("/api/yui/calendar-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time_block_id: block.id,
          provider: "google_calendar",
          title: block.title,
          start_at: block.start_at,
          end_at: block.end_at,
          status: "approved",
        }),
      });
      if (!actionResponse.ok) {
        const payload = await actionResponse.json().catch(() => null);
        throw new Error(payload?.error ?? "予定登録候補の作成に失敗しました");
      }

      const { calendarAction } = await actionResponse.json();
      if (calendarAction?.status !== "scheduled") {
        const scheduleResponse = await fetch(`/api/yui/calendar-actions/${calendarAction.id}/schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!scheduleResponse.ok) {
          const payload = await scheduleResponse.json().catch(() => null);
          throw new Error(payload?.error ?? "Google Calendarへの登録に失敗しました");
        }
      }

      await fetch(`/api/yui/time-blocks/${block.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "created" }),
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google Calendarへの登録に失敗しました");
    }
  };

  const handleGenerateRecommendation = async () => {
    const response = await fetch("/api/yui/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "time_block" }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "提案の生成に失敗しました");
    }

    await loadData();
  };

  const handleUpdateRecommendationStatus = async (recommendationId: string, status: string) => {
    const response = await fetch(`/api/yui/recommendations/${recommendationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "推薦の更新に失敗しました");
    }

    await loadData();
  };

  const handleScheduleCalendarAction = async (actionId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/yui/calendar-actions/${actionId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Google Calendarへの登録に失敗しました");
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google Calendarへの登録に失敗しました");
    }
  };

  const handleUpdateCalendarActionStatus = async (actionId: string, status: string) => {
    const response = await fetch(`/api/yui/calendar-actions/${actionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "予定登録候補の更新に失敗しました");
    }

    await loadData();
  };

  const handleCancelCalendarAction = async (actionId: string) => {
    try {
      const response = await fetch(`/api/yui/calendar-actions/${actionId}/cancel`, { method: "POST" });
      if (!response.ok) throw new Error("Google Calendarの予定を取り消せませんでした");
      setCancelCalendarActionId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google Calendarの予定を取り消せませんでした");
    }
  };

  const handleSaveGoal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    setIsSavingGoal(true);
    try {
      const response = await fetch("/api/yui/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalForm),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "目的の保存に失敗しました");
      }

      const payload = await response.json();
      if (payload.goal) {
        setGoals((current) => [payload.goal, ...current.filter((goal) => goal.id !== payload.goal.id)]);
        setGoalsState((current) => ({
          ...current,
          loaded: true,
          data: [payload.goal, ...(current.data ?? []).filter((goal: any) => goal.id !== payload.goal.id)],
        }));
      }

      setGoalForm({
        title: "",
        description: "",
        status: "active",
        progress: 0,
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "目的の保存に失敗しました");
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleSaveMilestone = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    setIsSavingMilestone(true);
    try {
      const response = await fetch("/api/yui/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(milestoneForm),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "マイルストーンの保存に失敗しました");
      }

      setMilestoneForm((current) => ({ ...current, title: "" }));
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "マイルストーンの保存に失敗しました");
    } finally {
      setIsSavingMilestone(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/yui/goals?id=${encodeURIComponent(goalId)}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "目的の削除に失敗しました");
      }
      setDeleteConfirmGoalId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "目的の削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/yui/milestones?id=${encodeURIComponent(milestoneId)}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "マイルストーンの削除に失敗しました");
      }
      setDeleteConfirmMilestoneId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "マイルストーンの削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateGoalProgress = async (goalId: string, progress: number) => {
    setIsUpdatingProgress(true);
    setError(null);
    try {
      const response = await fetch("/api/yui/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: goalId, progress }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "進捗の更新に失敗しました");
      }
      setProgressDrafts((current) => {
        if (!(goalId in current)) return current;
        const next = { ...current };
        delete next[goalId];
        return next;
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "進捗の更新に失敗しました");
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const handleCompleteMilestone = async (milestoneId: string) => {
    setIsUpdatingProgress(true);
    setError(null);
    try {
      const response = await fetch("/api/yui/milestones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: milestoneId, status: "completed" }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "マイルストーンの更新に失敗しました");
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "マイルストーンの更新に失敗しました");
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const handleUpdateMilestoneStatus = async (milestoneId: string, status: "pending" | "paused") => {
    setIsUpdatingProgress(true);
    setError(null);
    try {
      const response = await fetch("/api/yui/milestones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: milestoneId, status }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "タスク状態の更新に失敗しました");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "タスク状態の更新に失敗しました");
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const handleQuickTaskSave = async () => {
    if (!currentFocus || !quickTaskDraft.trim() || isSavingQuickPanel) return;
    setIsSavingQuickPanel(true);
    setError(null);
    try {
      const response = await fetch("/api/yui/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal_id: currentFocus.id, title: quickTaskDraft.trim(), status: "pending" }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "タスクの追加に失敗しました");
      setQuickTaskDraft("");
      setQuickPanel(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "タスクの追加に失敗しました");
    } finally {
      setIsSavingQuickPanel(false);
    }
  };

  const handleAddSuggestedTask = async (action: YuiActionSuggestion | any) => {
    if (!currentFocus || addingTaskActionId === action.id) return;
    setAddingTaskActionId(action.id);
    setError(null);
    try {
      const response = await fetch("/api/yui/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal_id: currentFocus.id, title: action.title, status: "pending" }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "提案をタスクに追加できませんでした");
      setAddedTaskActionIds((previous) => new Set(previous).add(action.id));
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "提案をタスクに追加できませんでした");
    } finally {
      setAddingTaskActionId(null);
    }
  };

  const handleQuickReflectionSave = async () => {
    if (!quickReflectionDraft.trim() || isSavingQuickPanel) return;
    setIsSavingQuickPanel(true);
    setError(null);
    try {
      const response = await fetch("/api/yui/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: quickReflectionDraft.trim(), insights: [], next_actions: quickNextActionDraft.trim() ? [quickNextActionDraft.trim()] : [] }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "振り返りの保存に失敗しました");
      setSavedNotice("振り返りを保存しました");
      setQuickReflectionDraft("");
      if (quickNextActionDraft.trim() && currentFocus) {
        const taskResponse = await fetch("/api/yui/milestones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal_id: currentFocus.id, title: quickNextActionDraft.trim(), status: "pending" }),
        });
        if (!taskResponse.ok) throw new Error("次のタスクの追加に失敗しました");
      }
      setQuickNextActionDraft("");
      setQuickPanel(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "振り返りの保存に失敗しました");
    } finally {
      setIsSavingQuickPanel(false);
    }
  };

  const handleQuickMemoSave = async () => {
    if (!quickMemoDraft.trim() || isSavingQuickPanel) return;
    setIsSavingQuickPanel(true);
    setError(null);
    try {
      const response = await fetch("/api/yui/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "note_created",
          source: "manual",
          title: "メモ",
          content: quickMemoDraft.trim(),
        }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "メモの保存に失敗しました");
      setSavedNotice("メモを保存しました");
      setQuickMemoDraft("");
      setQuickPanel(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "メモの保存に失敗しました");
    } finally {
      setIsSavingQuickPanel(false);
    }
  };

  const recentEvents = today?.recentEvents ?? [];
  const calendarEvents = today?.calendarEvents ?? [];
  const latestEverydayGoal = goals.find((goal) => !isTestContent(`${goal.title} ${goal.description ?? ""}`));
  const suggestedTimeBlocks = dedupeSuggestedTimeBlocks(today?.suggestedTimeBlocks ?? []).filter(block => isFutureInterval(block.start_at, block.end_at))
    .filter((block) => !calendarActions.some((action) =>
      timeSlotKey(action) === timeSlotKey(block)
      && ["approved", "scheduled"].includes(action.status),
    ));
  const orderedCalendarActions = orderCalendarActions(calendarActions);

  const activityItems = [
    ...recentEvents.filter(isUserActivity).slice(0, 4).map((event) => ({
      time: format(new Date(event.occurred_at), "HH:mm"),
      title: event.title || event.event_type,
      detail: event.content || event.event_type,
    })),
    ...(calendarEvents.length > 0
      ? [{ time: "今日", title: "Google Calendar同期", detail: `${calendarEvents.length}件の予定を確認しました。` }]
      : []),
    ...(gmailInsights.length > 0
      ? [{ time: "今日", title: "要確認メール", detail: `${gmailInsights.length}件のメールを確認できます。` }]
      : []),
    ...(latestEverydayGoal
      ? [{ time: "今日", title: "目的を更新", detail: `${latestEverydayGoal.title} が今の優先事項です。` }]
      : []),
  ].slice(0, 6);

  const heroPriorityItems = unifiedActions.slice(0, 2).map((item) => ({
    id: item.id,
    title: item.title,
    detail: item.description ?? item.actionType ?? "今日の一歩",
  }));

  const recentChangeCards: Array<{ label: string; title: string; detail: string }> = [];

  if (gmailInsights[0]) {
    recentChangeCards.push({
      label: "メール",
      title: gmailInsights[0].subject ?? "新着メール",
      detail: gmailInsights[0].snippet ?? "重要メールを確認しました。",
    });
  }

  if (calendarEvents[0]) {
    recentChangeCards.push({
      label: "予定",
      title: calendarEvents[0].title ?? "予定",
      detail: calendarEvents[0].start_at ? `今日 ${format(new Date(calendarEvents[0].start_at), "HH:mm")}` : "今日の予定を確認しました。",
    });
  }

  if (goals[0]) {
    recentChangeCards.push({
      label: "目的",
      title: goals[0].title ?? "目的",
      detail: goals[0].description ?? "今の軸を維持しています。",
    });
  }

  if (reflections[0]) {
    recentChangeCards.push({
      label: "振り返り",
      title: "振り返り",
      detail: reflections[0].summary || "今週の気づきを記録しました。",
    });
  }

  const focusGoals = goals.filter((goal) => !isTestContent(`${goal.title} ${goal.description ?? ""}`)).sort((left, right) => {
    const rank = (status: string) => status === "active" ? 0 : status === "paused" ? 1 : 2;
    return rank(left.status) - rank(right.status) || new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
  });
  useEffect(() => {
    if (focusGoals.length > 0 && focusGoalIndex >= focusGoals.length) setFocusGoalIndex(0);
  }, [focusGoals.length, focusGoalIndex]);
  const selectedFocus = focusGoals[focusGoalIndex] ?? null;
  const selectedMilestones = milestones.filter((item) => item.goal_id === selectedFocus?.id);
  const currentFocus = selectedFocus ? { ...selectedFocus, progress: goalProgress(selectedFocus.progress, selectedMilestones) } : null;
  const openReflectionComposer = useCallback(() => {
    setShowFabMenu(false);
    setQuickPanel("reflection");
    if (currentFocus) {
      window.setTimeout(() => {
        document.getElementById("current-focus")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    }
  }, [currentFocus]);
  const visibleContextSummary = contextSummary && !isTestContent(`${contextSummary.priority} ${contextSummary.reason} ${contextSummary.nextAction}`)
    ? contextSummary
    : null;
  const visibleMorningBrief = morningBrief && !isTestContent(`${morningBrief.priority} ${morningBrief.reason} ${morningBrief.nextAction}`)
    ? morningBrief
    : null;
  const currentProgressDraft = currentFocus ? progressDrafts[currentFocus.id] : undefined;
  const focusMilestones = currentFocus
    ? milestones.filter((milestone) => milestone.goal_id === currentFocus.id)
    : [];
  const nextMilestone =
    focusMilestones.find((milestone) => milestone.status === "pending") ?? null;
  const compactTimelineItems = [
    currentFocus
      ? {
          id: `goal-${currentFocus.id}`,
          label: "目的",
          title: currentFocus.title,
          meta: `${currentFocus.progress ?? 0}%`,
        }
      : null,
    ...focusMilestones.slice(0, 3).map((milestone) => ({
      id: `milestone-${milestone.id}`,
      label: "マイルストーン",
      title: milestone.title,
      meta: milestone.status === "completed" ? "完了" : "次候補",
    })),
    calendarEvents[0]
      ? {
          id: `calendar-${calendarEvents[0].id}`,
          label: "予定",
          title: calendarEvents[0].title,
          meta: format(new Date(calendarEvents[0].start_at), "MM/dd HH:mm"),
        }
      : null,
  ].filter(Boolean) as Array<{ id: string; label: string; title: string; meta: string }>;
  const compactInsights = [
    visibleContextSummary?.reason,
    today?.recentInsights?.[0],
    latestReflection?.insights?.[0],
  ].filter(Boolean).slice(0, 2) as string[];
  const pendingRecommendationActions = recommendations.filter(
    (rec) => rec.type === "action" && rec.status === "pending",
  );
  const confirmationItems = [
    ...pendingRecommendationActions.map((rec) => {
      const content = parseRecommendationContent(rec.content);
      const isCalendarRegistration = rec.title.startsWith("カレンダー登録");
      const requiresScheduleDetails = isCalendarRegistration && !content?.proposed_start_at;
      const scheduleTitle = rec.title.replace(/^カレンダー登録:\s*/, "");
      return {
        id: rec.id,
        title: rec.title,
        description: formatRecommendationReason(rec.reason),
        schedule: content
          ? (formatProposedSchedule(content.proposed_start_at, content.proposed_end_at) ?? (isCalendarRegistration ? "予定日時: 日時の指定なし" : null))
          : (isCalendarRegistration ? "予定日時: 日時の指定なし" : null),
        source: "YUIとの相談から",
        kind: "recommendation" as const,
        requiresScheduleDetails,
        onRequestSchedule: requiresScheduleDetails
          ? () => openChatComposer(`「${scheduleTitle}」を予定にしたいです。日時（例：9月10日 15:00〜16:00）を教えてください。`)
          : null,
        onAccept: () => handleExecuteAction(rec.id),
        onReject: () => handleRejectAction(rec.id),
      };
    }),
    ...unifiedActions.slice(0, Math.max(0, 3 - pendingRecommendationActions.length)).map((action) => ({
      id: action.id,
      title: action.title,
      description: action.description,
      schedule: null,
      source: "YUIからの提案",
      kind: "unified" as const,
      requiresScheduleDetails: false,
      onRequestSchedule: null,
      onAccept: () => handleExecuteUnifiedAction(action),
      onReject: null,
    })),
  ].slice(0, 3);

  const scheduledFocusAction = orderedCalendarActions.find((action) =>
    action.status === "scheduled" && new Date(action.start_at).getTime() >= Date.now(),
  ) ?? null;
  const formatEmailSummary = (summary: string | null | undefined) => summary
    ?.replace(/未読メールは\s*\d+件/g, `要確認メールは${gmailInsights.length}件`)
    .replace(/(\d+)件の未読メール/g, `$1件の未読メール（要確認${gmailInsights.length}件）`);
  const presenceNextAction = nextMilestone?.title
    ?? (scheduledFocusAction
      ? `${format(new Date(scheduledFocusAction.start_at), "HH:mm")}から「${scheduledFocusAction.title}」を始める`
      : null)
    ?? (currentFocus && !nextMilestone ? "次のタスクを追加するか、できたことを振り返りましょう。" : visibleContextSummary?.nextAction)
    ?? "YUIに、今日の予定を相談してみましょう。";
  const presenceState: YuiPresenceState = isRefreshing || googleHealth?.status === "refreshing"
    ? "syncing"
    : confirmationItems.length > 0
      ? "proposal_ready"
      : scheduledFocusAction
        ? "focus_time"
        : nextMilestone
          ? "thinking"
          : latestReflection
          ? "reflection_ready"
            : "idle";
  // The health response has a shared Google status in addition to the
  // individual service flags. Honor it here as the settings screen does.
  const calendarConnected = googleHealth?.status === "connected" || googleHealth?.calendarConnected === true;
  const gmailConnected = googleHealth?.status === "connected" || googleHealth?.gmailConnected === true;
  const connectionStatus = (connected: boolean) => connected
    ? "connected" as const
    : sectionErrors.googleHealth
      ? "unavailable" as const
      : googleHealth?.status === "refreshing" || googleHealth === null
        ? "checking" as const
        : "disconnected" as const;
  const calendarStatus = connectionStatus(calendarConnected);
  const gmailStatus = connectionStatus(gmailConnected);
  const localHour = Number(new Intl.DateTimeFormat("en-US", {
    timeZone: deliveryStatus?.timezone || "Asia/Tokyo",
    hour: "2-digit",
    hour12: false,
  }).format(new Date()));
  const storedNotification = localHour >= 18
    ? deliveryStatus?.todayEveningNotification
    : deliveryStatus?.todayMorningNotification;
  const dashboardNotification = storedNotification
    ?? (notificationPreviews
      ? (localHour >= 18 ? notificationPreviews.evening : notificationPreviews.morning)
      : null);

  return (
    <>
      <LegacyLocalLogMigration />
    <main
      className="min-h-screen overflow-x-clip bg-[#f5f5f7] text-slate-900"
      onFocusCapture={(event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
          setShowFabMenu(false);
          setIsEditingText(true);
        }
      }}
      onBlurCapture={() => {
        window.setTimeout(() => {
          const target = document.activeElement;
          setIsEditingText(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement);
        }, 0);
      }}
    >
      <div className="relative mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-8 px-4 py-8 sm:px-10 sm:py-16 lg:px-16">
        <header className="flex flex-col items-start gap-3 text-[11px] text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="font-medium uppercase tracking-[0.22em] text-slate-500">YOHAKU OS / YUI</p>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <span>更新: {formatRelativeTime(cacheUpdatedAt)}</span>
            <button
              type="button"
              onClick={openGoalForm}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-white transition hover:bg-slate-700"
            >
              <Target className="h-3.5 w-3.5" />
              <span>目的とマイルストーン</span>
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowHealthMenu((current) => !current);
                  setShowSettingsMenu(false);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-slate-600 transition hover:bg-white"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>接続状況</span>
              </button>
              {showHealthMenu ? (
                <div className="absolute left-0 top-full z-10 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200/80 bg-white/90 p-2 shadow-sm backdrop-blur sm:left-auto sm:right-0">
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">システム連携状態</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="rounded-xl bg-slate-50 px-2 py-1 text-slate-600">Google: {(googleHealth?.status === "connected" || googleHealth?.calendarConnected || calendarEvents.length > 0 || calendarActions.some((action) => ["approved", "scheduled"].includes(action.status))) ? "接続済み" : googleHealth?.status === "needs_reauth" ? "再認証が必要" : "未接続"}</p>
                    <p className="rounded-xl bg-slate-50 px-2 py-1 text-slate-600">Gmail: {googleHealth?.gmailConnected || googleHealth?.status === "connected" ? "接続済み" : "未接続"}</p>
                    <p className="rounded-xl bg-slate-50 px-2 py-1 text-slate-600">AI相談: {aiConnectionState === "checking" ? "確認中" : aiConnectionState === "configured" ? "設定済み" : aiConnectionState === "missing" ? "未設定・無効" : "確認できません"}</p>
                    <p className="rounded-xl bg-slate-50 px-2 py-1 text-slate-600">YUIのデータ: {error ? "メンテナンス中" : "利用可能"}</p>
                  </div>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void loadData({ background: false })}
              className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-slate-600 transition hover:bg-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>更新</span>
            </button>
            <div className="relative">
              <button
                type="button"
                aria-label="設定メニューを開く"
                onClick={() => {
                  setShowSettingsMenu((current) => !current);
                  setShowHealthMenu(false);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-slate-600 transition hover:bg-white"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
              {showSettingsMenu ? (
                <div className="absolute left-0 top-full z-10 mt-2 w-44 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200/80 bg-white/90 p-2 shadow-sm backdrop-blur sm:left-auto sm:right-0">
                  <Link href="/yui/settings#profile" className="block rounded-xl px-2 py-2 text-sm text-slate-600 hover:bg-slate-50">YUIのプロフィール</Link>
                  <Link href="/yui/settings#connections" className="block rounded-xl px-2 py-2 text-sm text-slate-600 hover:bg-slate-50">接続</Link>
                  <Link href="/yui/settings#ai" className="block rounded-xl px-2 py-2 text-sm text-slate-600 hover:bg-slate-50">AI設定</Link>
                  <Link href="/yui/settings#notifications" className="block rounded-xl px-2 py-2 text-sm text-slate-600 hover:bg-slate-50">通知</Link>
                  <span className="block cursor-not-allowed rounded-xl px-2 py-2 text-sm text-slate-400" aria-disabled="true">テーマ（準備中）</span>
                  <Link href="/help" className="block rounded-xl px-2 py-2 text-sm text-slate-600 hover:bg-slate-50">ヘルプ・使い方</Link>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
          </div>
        )}

        {/* First-Use Setup Guide: shown when connections or goals are not yet configured */}
        {!isInitialLoading && profile && profile.has_completed_onboarding !== false && (
          (() => {
            const googleConnected = googleHealth?.status === "connected" || googleHealth?.calendarConnected === true;
            const calendarConnected = googleConnected || calendarEvents.length > 0 || calendarActions.some((action) => ["approved", "scheduled"].includes(action.status));
            // Current Focus is the same goal presented in the dashboard. Use it
            // as the setup source of truth so lazy-loaded goal data cannot leave
            // the checklist stuck at 1/2.
            const hasGoal = goals.length > 0 || Boolean(currentFocus) || Boolean(today?.currentPosition?.purpose);
            const completedCount = [calendarConnected, hasGoal].filter(Boolean).length;
            if (completedCount === 2) return null;
            const steps = [
              {
                done: calendarConnected,
                label: "Google カレンダー・Gmail を接続する（任意）",
                action: <Link href="/yui/settings" className="text-sm text-slate-700 hover:text-slate-900 underline underline-offset-2">Google カレンダー・Gmail を接続する（任意）</Link>,
              },
              {
                done: hasGoal,
                label: "目的をひとつ登録する",
                action: (
                  <button type="button" onClick={openGoalForm} className="text-sm text-slate-700 hover:text-slate-900 underline underline-offset-2 text-left">
                    目的をひとつ登録する
                  </button>
                ),
              },
            ];
            return (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">セットアップ</span>
                  <span className="text-[10px] text-slate-400">{completedCount} / 2 完了</span>
                </div>
                <p className="text-sm font-medium text-slate-700">必要に応じて追加できる設定（記録はこのまま使えます）</p>
                <ul className="space-y-2">
                  {steps.map((step, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${step.done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                        {step.done ? "✓" : i + 1}
                      </span>
                      {step.done ? (
                        <span className="text-sm text-slate-400 line-through">{step.label}</span>
                      ) : (
                        step.action
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()
        )}

        {profile && profile.has_completed_onboarding === false ? (
          <YuiFirstMeetingCard
            onComplete={() => {
              if (profile) {
                setProfile({ ...profile, has_completed_onboarding: true });
              }
            }}
            onStartWithGoal={() => {
              if (profile) {
                setProfile({ ...profile, has_completed_onboarding: true });
              }
              setTimeout(openGoalForm, 80);
            }}
          />
        ) : (
          <>
            {isInitialLoading ? (
              <section className="w-full py-6 md:py-8">
                <div className="space-y-5">
                  <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-12 w-3/4 animate-pulse rounded-2xl bg-slate-200" />
                  <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
                </div>
              </section>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                  <nav aria-label="基本の使い方" className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => openChatComposer()} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">1. 相談する</button>
                    <button type="button" onClick={openGoalForm} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">2. 今日やることを決める</button>
                    <button type="button" onClick={openReflectionComposer} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">3. 振り返る</button>
                  </nav>
                  <Link href="/help" className="text-xs underline">使い方を見る</Link>
                </div>
                {/* Conversation Hub */}
                <div ref={chatCardRef}>
                  <YuiChat
                    conversations={conversations}
                    memoryCandidates={memoryCandidates}
                    goals={goals}
                    currentGoalId={currentFocus?.id ?? null}
                    onSend={handleSendConversation}
                    onApproveCandidate={handleApproveCandidate}
                    onRejectCandidate={handleRejectCandidate}
                    onChangeConversationGoal={handleChangeConversationGoal}
                    composerRequest={chatDraftRequest}
                    composerRef={chatComposerRef}
                  />
                </div>

                {savedNotice ? <div role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">{savedNotice} <a href="#recent-records" className="ml-3 underline">記録を見る</a></div> : null}
                <section id="recent-records" className="scroll-mt-4"><ActivityFeedCard items={activityItems.slice(0, 5)} /></section>
                {dashboardNotification ? (
                  <Card className="rounded-2xl border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm md:p-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                        <Bell className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">YUIからの今日のまとめ</p>
                          <Link href="/yui/settings#notifications" className="text-xs text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-800">
                            通知設定
                          </Link>
                        </div>
                        <h2 className="mt-2 text-lg font-semibold text-slate-900">{dashboardNotification.title}</h2>
                        <BriefAudio key={dashboardNotification.message} type={localHour >= 18 ? "evening" : "morning"} />
                        <details className="mt-2 text-sm text-slate-600"><summary className="cursor-pointer">今日のまとめを読む</summary><p className="mt-3 whitespace-pre-wrap leading-7">{dashboardNotification.message}</p></details>
                        <p className="mt-3 text-[11px] text-slate-400">
                          現在は端末へのプッシュ通知ではなく、このダッシュボード上部に表示しています。
                          {deliveryStatus?.nextDeliveryTime ? ` 次回の更新目安: ${deliveryStatus.nextDeliveryTime}` : ""}
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : null}

                <YuiPresenceDashboard
                  displayName={displayName}
                  state={presenceState}
                  focusTitle={currentFocus?.title ?? "今日の流れを整えましょう"}
                  nextAction={presenceNextAction}
                  progress={currentFocus?.progress ?? 0}
                  hasGoal={Boolean(currentFocus)}
                  hasNextStep={Boolean(nextMilestone)}
                  hasScheduledTime={Boolean(scheduledFocusAction)}
                  hasReflection={Boolean(latestReflection)}
                  onOpenChat={() => openChatComposer("今日の予定を整理して")}
                />

                {/* Confirmation Layer */}
                {confirmationItems.length > 0 ? <Card className="space-y-4 rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">YUIからの確認待ち</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">実行する前に確認</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                      {confirmationItems.length}件
                    </span>
                  </div>

                  <div className="space-y-3">
                      {confirmationItems.map((item) => (
                        <div key={`${item.kind}-${item.id}`} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                              <p className="line-clamp-2 text-xs leading-5 text-slate-500">{item.description}</p>
                              {item.schedule ? <p className="text-xs font-medium text-slate-700">{item.schedule}</p> : null}
                              <p className="text-[11px] tracking-[0.12em] text-slate-400">{item.source}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {item.onReject ? (
                                <button
                                  type="button"
                                  onClick={item.onReject}
                                  disabled={executingActionId === item.id}
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100"
                                >
                                  見送る
                                </button>
                              ) : null}
                              {item.requiresScheduleDetails ? (
                                <button
                                  type="button"
                                  onClick={item.onRequestSchedule ?? undefined}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                                >
                                  日時を指定して相談する
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={item.onAccept}
                                  disabled={executingActionId === item.id || completedActionIds.has(item.id)}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                                >
                                  {executingActionId === item.id ? (
                                    <>
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      実行中
                                    </>
                                  ) : completedActionIds.has(item.id) ? (
                                    "完了"
                                  ) : (
                                    "実行する"
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </Card> : null}

                {/* 4. Today / Focus / Timeline / Insight */}
                <div className="grid gap-6 md:grid-cols-2">
                  <TodaySummary
                    calendarStatus={calendarStatus}
                    gmailStatus={gmailStatus}
                    todaySummary={formatEmailSummary(visibleMorningBrief?.summary ?? today?.summary ?? null)}
                    eventsCount={visibleMorningBrief?.todayEventsCount ?? (calendarEvents?.length ?? 0)}
                    actionableEmails={gmailInsights?.length ?? 0}
                    topPriority={visibleContextSummary?.priority ?? visibleMorningBrief?.priority ?? currentFocus?.title ?? null}
                    selectedGoal={currentFocus?.title}
                    priorityReason={visibleContextSummary?.reason ?? visibleMorningBrief?.reason}
                    updatedAt={cacheUpdatedAt}
                    changeSummary={formatEmailSummary(visibleMorningBrief?.changeSummary ?? null)}
                  />

                  <Card
                    id="current-focus"
                    className="space-y-4 rounded-2xl border-slate-200 bg-white p-5 shadow-sm"
                    onTouchStart={(event) => { focusTouchStartX.current = event.touches[0]?.clientX ?? null; }}
                    onTouchEnd={(event) => {
                      const start = focusTouchStartX.current;
                      const end = event.changedTouches[0]?.clientX;
                      focusTouchStartX.current = null;
                      if (start === null || end === undefined || focusGoals.length < 2 || Math.abs(end - start) < 45) return;
                      setFocusGoalIndex((index) => end < start ? (index + 1) % focusGoals.length : (index - 1 + focusGoals.length) % focusGoals.length);
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">いま取り組むこと</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-900">
                          {currentFocus?.title ?? "YUIに目的を話す"}
                        </h3>
                        {currentFocus ? <p className="mt-1 text-xs text-slate-400">この目的の現在地</p> : null}
                      </div>
                      <div className="flex items-center gap-2">
                        {focusGoals.length > 1 ? (
                          <>
                            <button type="button" onClick={() => setFocusGoalIndex((index) => (index - 1 + focusGoals.length) % focusGoals.length)} className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-500" aria-label="前の目的">←</button>
                            <span className="text-[11px] tabular-nums text-slate-400">{focusGoalIndex + 1} / {focusGoals.length}</span>
                            <button type="button" onClick={() => setFocusGoalIndex((index) => (index + 1) % focusGoals.length)} className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-500" aria-label="次の目的">→</button>
                          </>
                        ) : null}
                        <Target className="h-5 w-5 text-slate-400" />
                      </div>
                    </div>
                    {focusGoals.length > 1 ? <p className="text-[11px] text-slate-400 md:hidden">左右にスワイプして目的を切り替えられます</p> : null}
                    <div className="space-y-2">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{ width: `${Math.min(100, Math.max(0, currentProgressDraft ?? currentFocus?.progress ?? 0))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{currentFocus ? `${currentProgressDraft ?? currentFocus.progress ?? 0}%` : "未設定"}</span>
                        <span>{nextMilestone ? `次: ${nextMilestone.title}` : currentFocus ? "マイルストーンを追加すると進捗できます" : "「始めたいこと」を送る"}</span>
                      </div>
                      {currentFocus && focusMilestones.length > 0 ? (
                        <div className="flex items-end gap-1 pt-2" aria-label="マイルストーン進捗">
                          {focusMilestones.slice(0, 7).map((milestone, index) => (
                            <span key={milestone.id} className={`flex-1 rounded-sm ${milestone.status === "completed" ? "bg-emerald-400" : "bg-slate-200"}`} style={{ height: `${10 + Math.min(18, (index + 1) * 3)}px` }} title={milestone.title} />
                          ))}
                        </div>
                      ) : null}
                      {currentFocus ? (
                        <>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={currentProgressDraft ?? currentFocus.progress ?? 0}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              setProgressDrafts((current) => ({ ...current, [currentFocus.id]: value }));
                            }}
                            className="w-full accent-slate-900"
                            aria-label="目的の進捗"
                          />
                          <p className="text-[11px] leading-5 text-slate-400">
                            進捗は手動の値とタスクの完了率のうち、大きい方を表示します。完了したタスクは次の一歩から外れます。
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              disabled={isUpdatingProgress || currentProgressDraft === undefined}
                              onClick={() => void handleUpdateGoalProgress(currentFocus.id, currentProgressDraft ?? currentFocus.progress ?? 0)}
                              className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {isUpdatingProgress ? "更新中..." : "進捗を保存"}
                            </button>
                            {nextMilestone && nextMilestone.status !== "completed" ? (
                              <button
                                type="button"
                                disabled={isUpdatingProgress}
                                onClick={() => void handleCompleteMilestone(nextMilestone.id)}
                                className="rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 disabled:opacity-40"
                              >
                                次の一歩を完了
                              </button>
                            ) : null}
                            {nextMilestone ? (
                              deleteConfirmMilestoneId === nextMilestone.id ? (
                                <>
                                  <button type="button" disabled={isDeleting} onClick={() => void handleDeleteMilestone(nextMilestone.id)} className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 disabled:opacity-40">一歩を削除する</button>
                                  <button type="button" onClick={() => setDeleteConfirmMilestoneId(null)} className="text-xs text-slate-400">キャンセル</button>
                                </>
                              ) : (
                                <button type="button" onClick={() => setDeleteConfirmMilestoneId(nextMilestone.id)} className="text-xs text-slate-400 hover:text-rose-600">一歩を削除</button>
                              )
                            ) : null}
                            {deleteConfirmGoalId === currentFocus.id ? (
                              <>
                                <button type="button" disabled={isDeleting} onClick={() => void handleDeleteGoal(currentFocus.id)} className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 disabled:opacity-40">目的を削除する</button>
                                <button type="button" onClick={() => setDeleteConfirmGoalId(null)} className="text-xs text-slate-400">キャンセル</button>
                              </>
                            ) : (
                              <button type="button" onClick={() => setDeleteConfirmGoalId(currentFocus.id)} className="text-xs text-slate-400 hover:text-rose-600">目的を削除</button>
                            )}
                            <button type="button" onClick={() => setQuickPanel("task")} className="text-xs text-sky-700 hover:text-sky-900">次の一歩を決める</button>
                            <button type="button" onClick={openReflectionComposer} className="text-xs text-sky-700 hover:text-sky-900">振り返りを記録</button>
                          </div>
                          <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">タスク</p>
                              <span className="text-[11px] text-slate-400">{focusMilestones.length}件</span>
                            </div>
                            {focusMilestones.length === 0 ? (
                              <button type="button" onClick={() => setQuickPanel("task")} className="text-left text-xs text-sky-700 hover:text-sky-900">＋ 次のタスクを追加</button>
                            ) : (
                              <>
                                {focusMilestones.slice(0, 3).map((milestone) => {
                                  const isCompleted = milestone.status === "completed";
                                  const statusLabel = isCompleted ? "完了" : milestone.status === "paused" ? "保留" : "未着手";
                                  return (
                                    <div key={milestone.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                                      <span className={`h-2 w-2 shrink-0 rounded-full ${isCompleted ? "bg-emerald-500" : milestone.status === "paused" ? "bg-amber-400" : "bg-slate-300"}`} />
                                      <span className={`min-w-0 flex-1 truncate text-xs ${isCompleted ? "text-slate-400 line-through" : "text-slate-700"}`}>{milestone.title}</span>
                                      <span className="shrink-0 text-[10px] text-slate-400">{statusLabel}</span>
                                      {!isCompleted ? <button type="button" disabled={isUpdatingProgress} onClick={() => void handleCompleteMilestone(milestone.id)} className="shrink-0 text-[10px] font-medium text-emerald-700 disabled:opacity-40">完了</button> : null}
                                      {!isCompleted ? <button type="button" disabled={isUpdatingProgress} onClick={() => void handleUpdateMilestoneStatus(milestone.id, milestone.status === "paused" ? "pending" : "paused")} className="shrink-0 text-[10px] font-medium text-slate-500 disabled:opacity-40">{milestone.status === "paused" ? "再開" : "保留"}</button> : null}
                                    </div>
                                  );
                                })}
                                <button type="button" onClick={() => setQuickPanel("task")} className="text-left text-xs text-sky-700 hover:text-sky-900">＋ 次のタスクを追加</button>
                              </>
                            )}
                            {quickPanel ? (
                              <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-3">
                                {quickPanel === "task" ? (
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold text-slate-700">次のタスクを追加</p>
                                    <input value={quickTaskDraft} onChange={(event) => setQuickTaskDraft(event.target.value)} placeholder="例: 必要な教材を確認する" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-sky-300" />
                                    <div className="flex gap-2"><button type="button" disabled={!quickTaskDraft.trim() || isSavingQuickPanel} onClick={() => void handleQuickTaskSave()} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">{isSavingQuickPanel ? "保存中..." : "タスクを追加"}</button><button type="button" onClick={() => setQuickPanel(null)} className="text-xs text-slate-400">キャンセル</button></div>
                                  </div>
                                ) : quickPanel === "reflection" ? (
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold text-slate-700">今日の振り返り</p>
                                    <textarea value={quickReflectionDraft} onChange={(event) => setQuickReflectionDraft(event.target.value)} placeholder="できたこと、気づいたこと、次に試すこと" rows={3} className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-sky-300" />
                                    <input value={quickNextActionDraft} onChange={(event) => setQuickNextActionDraft(event.target.value)} placeholder="次に試すこと（任意）" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-sky-300" />
                                    <p className="text-[11px] text-slate-400">入力すると、振り返りの保存と同時に次のタスクへ追加します。</p>
                                    <div className="flex gap-2"><button type="button" disabled={!quickReflectionDraft.trim() || isSavingQuickPanel} onClick={() => void handleQuickReflectionSave()} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">{isSavingQuickPanel ? "保存中..." : "振り返りを保存"}</button><button type="button" onClick={() => setQuickPanel(null)} className="text-xs text-slate-400">キャンセル</button></div>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </Card>

                  <Card className="space-y-4 rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">目的の流れ</p>
                      <GitBranch className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="space-y-3">
                      {compactTimelineItems.length === 0 ? (
                        <p className="text-sm text-slate-500">まだ流れはありません。YUIに「来週までにこれを終わらせたい」と話してみてください。</p>
                      ) : (
                        compactTimelineItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-800">{item.title}</p>
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-500">{item.meta}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>

                  <Card className="space-y-4 rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">YUIからの気づき</p>
                      <Lightbulb className="h-5 w-5 text-slate-400" />
                    </div>
                    {compactInsights.length === 0 ? (
                      <p className="text-sm text-slate-500">まだ気づきはありません。予定・会話・保存データが増えるとここに出ます。</p>
                    ) : (
                      <div className="space-y-2">
                        {compactInsights.map((insight) => (
                          <p key={insight} className="line-clamp-2 text-sm leading-6 text-slate-700">{insight}</p>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            )}

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">詳細</p>
                  <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">詳細は必要時に開く</h3>
                </div>
                <button
                  type="button"
                  aria-expanded={showMore}
                  onClick={() => setShowMore((current) => !current)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  {showMore ? "閉じる" : "開く"}
                </button>
              </div>

              {showMore ? (
                <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-1">
                  <ActionArea
                    actions={unifiedActions
                      .slice(0, 3)
                      .map((a) => ({
                        id: a.id,
                        title: a.title,
                        description: a.description,
                        kind: a.actionType,
                        reason: a.description,
                      }))}
                    onCreateRecommendation={async () => {
                      try {
                        const response = await fetch("/api/yui/recommendations", { method: "POST" });
                        if (!response.ok) {
                          const payload = await response.json().catch(() => null);
                          throw new Error(payload?.error ?? "提案の生成に失敗しました");
                        }
                        await loadData({ background: true });
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "提案の生成に失敗しました");
                      }
                    }}
                  />

                </div>
              ) : null}
            </section>

            {showMore ? (
              <>
                <YuiDailyContextCard data={dailyContext} isLoading={!dailyContext} />

                <InfoAccordion title={memoryState.loaded ? `YUIが覚えていること（${memoryState.data?.length ?? 0}）` : memoryState.loading ? "YUIが覚えていること（確認中…）" : memoryState.error ? "YUIが覚えていること（オフライン）" : "YUIが覚えていること"} onOpen={fetchMemories}>
                  {memoryState.loading ? (
                    <YuiCardSkeleton lines={3} />
                  ) : memoryState.error ? (
                    <p className="text-sm text-muted-foreground">記憶の取得に失敗しました。オフラインの可能性があります。</p>
                  ) : memoryState.loaded ? (
                    <div className="space-y-2">
                      {(memoryState.data ?? []).slice(0, 5).map((m: any) => (
                        <div key={m.id} className="rounded-2xl border border-border bg-card p-3">
                          <p className="text-sm font-medium">{m.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{m.excerpt ?? m.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">まだ記憶を読み込んでいません。開いて確認できます。</p>
                  )}
                </InfoAccordion>

                <InfoAccordion title={insightsState.loaded ? `気づき（${insightsState.data?.length ?? 0}）` : insightsState.loading ? "気づき（確認中…）" : insightsState.error ? "気づき（取得できません）" : "気づき"} onOpen={fetchInsights}>
                  {insightsState.loading ? (
                    <YuiCardSkeleton lines={3} />
                  ) : insightsState.error ? (
                    <p className="text-sm text-muted-foreground">気づきの取得に失敗しました。オフラインの可能性があります。</p>
                  ) : insightsState.loaded ? (
                    <YuiThreadInsightsCard threads={insightsState.data ?? []} isLoading={false} />
                  ) : (
                    <p className="text-sm text-muted-foreground">まだ気づきを読み込んでいません。開いて確認できます。</p>
                  )}
                </InfoAccordion>

                <YuiProgressCard threads={threadProgress} isLoading={threadProgress === null} />

                <YuiTimeInsightsCard data={timeIntelligence} isLoading={timeIntelligence === null} />

                <YuiPlanningCard suggestions={planningSuggestions} isLoading={planningSuggestions === null} />

                <YuiWeeklyReviewCard review={weeklyReview} isLoading={weeklyReview === null} />

                {visibleContextSummary && (
                  <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 via-background to-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">YUIの今日の優先事項</p>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">スコア: {visibleContextSummary.priorityScore}</span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">今日の優先事項</h2>
                          <p className="mt-1 text-xl font-bold tracking-tight text-foreground md:text-2xl">{visibleContextSummary.priority}</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">理由</h3>
                            <p className="mt-2 text-sm leading-6 text-foreground/90">{visibleContextSummary.reason}</p>
                          </div>
                          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">次の一歩</h3>
                            <p className="mt-2 text-sm font-medium leading-6 text-foreground">{visibleContextSummary.nextAction}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            ) : null}
          </>
        )}

        {showMore ? (
        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <Card className="space-y-5 p-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">今日のYUI</p>
                <h2 className="text-2xl font-semibold">今日の状況</h2>
              </div>

              <div className="rounded-3xl border border-border bg-background p-5">
                {isInitialLoading ? (
                  <YuiCardSkeleton lines={2} compact />
                ) : sectionErrors.today ? (
                  <p className="text-sm text-amber-700">{sectionErrors.today}</p>
                ) : (
                  <p className="text-sm leading-7 text-foreground/90">{today?.summary}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <InfoPanel
                  title="重要な記憶"
                  items={today?.importantMemories.map((memory) => memory.title) ?? []}
                  emptyLabel="まだありません"
                />
                <InfoPanel
                  title="未完了タスク"
                  items={today?.pendingTasks ?? []}
                  emptyLabel="まだありません"
                />
                <InfoPanel
                  title="最近の気づき"
                  items={today?.recentInsights ?? []}
                  emptyLabel="まだありません"
                />
              </div>

              <div className="rounded-3xl border border-border bg-muted/20 p-5">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">現在地</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">目的</p>
                      <p className="mt-2 text-sm leading-6">
                        {today?.currentPosition?.purpose ?? "まだ目的はありません"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">現在</p>
                      <p className="mt-2 text-sm leading-6">
                        {today?.currentPosition?.current ?? "0%"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">次の一歩</p>
                      <p className="mt-2 text-sm leading-6">
                        {today?.currentPosition?.nextStep ?? "目的を設定する"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">最近の出来事</p>
                  {recentEvents.length > 0 ? (
                    <div className="space-y-2">
                      {recentEvents.slice(0, 3).map((event) => (
                        <div key={event.id} className="rounded-2xl border border-border bg-background px-3 py-2">
                          <p className="text-sm font-medium">{event.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            記録日時: {format(new Date(event.occurred_at), "yyyy/MM/dd HH:mm")}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">まだ出来事はありません。</p>
                  )}
                </div>

                <InfoAccordion
                  title={
                    calendarState.loaded
                      ? `予定（${calendarState.data?.length ?? 0}）`
                      : calendarState.loading
                        ? "予定（確認中…）"
                        : calendarState.error
                          ? "予定（オフライン）"
                          : "予定"
                  }
                  onOpen={fetchCalendar}
                >
                  {calendarState.loading ? (
                    <YuiCardSkeleton lines={3} />
                  ) : calendarState.error ? (
                    <p className="text-sm text-muted-foreground">Google Calendar の取得に失敗しました。接続を確認してください。</p>
                  ) : calendarState.loaded && calendarState.data && calendarState.data.length > 0 ? (
                    <div className="space-y-2">
                      {calendarState.data.slice(0, 3).map((event: any) => (
                        <div key={event.id} className="rounded-2xl border border-border bg-background px-3 py-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium">{event.title}</p>
                            {event.provider === "google_calendar" || event.source === "external" ? (
                              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                                Google Calendar
                              </span>
                            ) : event.source === "yui" ? (
                              <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                                YUI提案
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {format(new Date(event.start_at), "HH:mm")} - {format(new Date(event.end_at), "HH:mm")}
                          </p>
                          {event.location ? (
                            <p className="mt-1 text-xs text-muted-foreground">場所: {event.location}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      まだ今日の予定はありません。Google Calendar を接続するとここに表示できます。
                    </p>
                  )}
                </InfoAccordion>
              </div>
            </Card>

            <Card className="space-y-4 p-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">YUIの整理</p>
                <h2 className="text-xl font-semibold">いま優先すること</h2>
              </div>
              {sectionErrors.unifiedActions ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {sectionErrors.unifiedActions}
                </p>
              ) : null}
              <div className="space-y-4">
                {unifiedActions && unifiedActions.length > 0 ? (
                  unifiedActions.map((action) => (
                    <div key={action.id} className="rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-primary">
                          {action.priority === "high" ? "High Priority" : "Medium Priority"}
                        </span>
                        <span className="text-xs text-muted-foreground">{action.source}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold">{action.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{action.description}</p>
                      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                        {addedTaskActionIds.has(action.id) ? (
                          <span className="text-xs font-semibold text-emerald-600">✓ タスクに追加済み</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleAddSuggestedTask(action)}
                            disabled={!currentFocus || addingTaskActionId === action.id}
                            className="rounded-full border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 disabled:opacity-50"
                          >
                            {addingTaskActionId === action.id ? "追加中..." : "タスクに追加"}
                          </button>
                        )}
                        {completedActionIds.has(action.id) ? (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            ✓ Completed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleExecuteUnifiedAction(action)}
                            disabled={executingActionId === action.id}
                            className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
                          >
                            {executingActionId === action.id ? "実行中..." : "実行"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">現在提案すべきアクションはありません。</p>
                )}
              </div>
            </Card>

            <InfoAccordion
              title={
                gmailState.loaded
                  ? `Gmail (${gmailState.data?.length ?? 0})`
                  : gmailState.loading
                  ? "Gmail (...)"
                  : gmailState.error
                  ? "Gmail（取得できません）"
                  : "Gmail"
              }
              onOpen={fetchGmail}
            >
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Gmail Intelligence</p>
                <h2 className="text-xl font-semibold">今日気になるメール</h2>
              </div>

              {sectionErrors.gmail ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {sectionErrors.gmail}
                </p>
              ) : null}

              <div className="space-y-4">
                {gmailState.loading ? (
                  <YuiCardSkeleton lines={3} />
                ) : gmailState.error ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Gmailの取得に失敗しました。接続を確認してください。</p>
                    <button
                      type="button"
                      onClick={() => void fetchGmail(true)}
                      className="text-xs font-semibold text-primary underline hover:text-primary/80 transition"
                    >
                      もう一度試す
                    </button>
                  </div>
                ) : gmailState.loaded && gmailState.data && gmailState.data.length > 0 ? (
                  gmailState.data.slice(0, 5).map((insight: any) => (
                    <div key={insight.id} className="rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-primary">
                          {insight.reason === "unread_3_days" && "未返信3日以上"}
                          {insight.reason === "important" && "重要"}
                          {insight.reason === "meeting" && "会議依頼"}
                          {insight.reason === "deadline" && "期限付き依頼"}
                        </span>
                        <span className="text-xs text-muted-foreground">{new Date(insight.receivedAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold">{insight.subject}</h3>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{insight.snippet}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">特筆すべきメールはありません。</p>
                )}
              </div>
            </InfoAccordion>

            <InfoAccordion
              title={
                memoryState.loaded
                  ? `YUIが覚えていること（${memoryState.data?.length ?? 0}）`
                  : memoryState.loading
                    ? "YUIが覚えていること（確認中…）"
                    : memoryState.error
                      ? "YUIが覚えていること（取得できません）"
                      : "YUIが覚えていること"
              }
              onOpen={fetchMemories}
            >
              <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">記憶の管理</p>
                <p className="mt-1">会話からの記憶候補: {profile?.preferences?.memory_collection_enabled === false ? "停止中" : "有効"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-100" onClick={() => void handleMemoryCollectionToggle()}>
                    {profile?.preferences?.memory_collection_enabled === false ? "記憶候補を再開" : "今後の記憶候補を停止"}
                  </button>
                  <button type="button" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-100" onClick={() => void handleExportMemories()}>JSONで出力</button>
                  <button type="button" className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-rose-700 hover:bg-rose-50" onClick={() => void handleDeleteAllMemories()}>すべて削除</button>
                </div>
              </div>
              {memoryState.loading ? (
                <YuiCardSkeleton lines={3} />
              ) : memoryState.error ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">メモリの取得に失敗しました。オフラインの可能性があります。</p>
                  <button
                    type="button"
                    onClick={() => void fetchMemories(true)}
                    className="text-xs font-semibold text-primary underline hover:text-primary/80 transition"
                  >
                    もう一度試す
                  </button>
                </div>
              ) : memoryState.loaded && memoryState.data && memoryState.data.length > 0 ? (
                <div className="space-y-2">
                  {memoryState.data.slice(0, 5).map((memory: any) => (
                    <div key={memory.id} className="rounded-2xl border border-border bg-card p-3">
                      <div className="flex items-start justify-between gap-3"><p className="text-sm font-medium">{memory.title}</p><button type="button" onClick={() => void handleDeleteMemory(memory.id)} className="shrink-0 text-xs text-rose-600 hover:underline">削除</button></div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{memory.excerpt ?? memory.content ?? "内容はありません"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">まだデータはありません。</p>
              )}
            </InfoAccordion>

            <InfoAccordion
              title={
                insightsState.loaded
                  ? `気づき（${insightsState.data?.length ?? 0}）`
                  : insightsState.loading
                    ? "気づき（確認中…）"
                    : insightsState.error
                      ? "気づき（取得できません）"
                      : "気づき"
              }
              onOpen={fetchInsights}
            >
              {insightsState.loading ? (
                <YuiCardSkeleton lines={3} />
              ) : insightsState.error ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">気づきを取得できませんでした。通信状態を確認して、もう一度お試しください。</p>
                  <button
                    type="button"
                    onClick={() => void fetchInsights(true)}
                    className="text-xs font-semibold text-primary underline hover:text-primary/80 transition"
                  >
                    もう一度試す
                  </button>
                </div>
              ) : insightsState.loaded && insightsState.data && insightsState.data.length > 0 ? (
                <div className="space-y-2">
                  {insightsState.data.slice(0, 5).map((insight: any) => (
                    <div key={insight.id} className="rounded-2xl border border-border bg-card p-3">
                      <p className="text-sm font-medium">{insight.title ?? insight.summary ?? "気づき"}</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{insight.reason ?? insight.summary ?? "表示できる気づきはありません"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">まだデータはありません。</p>
              )}
            </InfoAccordion>

            {goals.length > 0 ? (
              <InfoAccordion
                title={
                  goalsState.loaded
                    ? `目的（${goalsState.data?.length ?? 0}）`
                    : goalsState.loading
                      ? "目的（確認中…）"
                      : goalsState.error
                        ? "目的（取得できません）"
                        : "目的"
                }
                onOpen={fetchGoals}
              >
                {goalsState.loading ? (
                  <YuiCardSkeleton lines={3} />
                ) : goalsState.error ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">目的を取得できませんでした。</p>
                    <button
                      type="button"
                      onClick={() => void fetchGoals(true)}
                      className="text-xs font-semibold text-primary underline hover:text-primary/80 transition"
                    >
                      もう一度試す
                    </button>
                  </div>
                ) : goalsState.loaded && goalsState.data && goalsState.data.length > 0 ? (
                  <div className="space-y-2">
                    {goalsState.data.slice(0, 5).map((goal: any) => (
                      <div key={goal.id} className="rounded-2xl border border-border bg-card p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">{goal.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">進捗: {goal.progress ?? 0}%</p>

                            {/* Milestones inside this Goal */}
                            <div className="mt-3 space-y-1.5 pl-3 border-l border-slate-200">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">マイルストーン</p>
                              {milestones.filter(m => m.goal_id === goal.id).length === 0 ? (
                                <p className="text-[11px] text-slate-400 font-light">マイルストーンはありません。</p>
                              ) : (
                                milestones.filter(m => m.goal_id === goal.id).map(m => (
                                  <div key={m.id} className="flex items-center justify-between gap-2 text-xs">
                                    <span className={m.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700'}>
                                      • {m.title}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] bg-slate-100 px-1 py-0.5 rounded text-slate-500">{m.status === "completed" ? "完了" : m.status === "paused" ? "保留" : "未着手"}</span>
                                      {deleteConfirmMilestoneId === m.id ? (
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            disabled={isDeleting}
                                            onClick={() => void handleDeleteMilestone(m.id)}
                                            className="text-[10px] text-red-500 hover:underline"
                                          >
                                            削除
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setDeleteConfirmMilestoneId(null)}
                                            className="text-[10px] text-slate-400 hover:underline"
                                          >
                                            キャンセル
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setDeleteConfirmMilestoneId(m.id)}
                                          className="text-[10px] text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                          削除
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}

                              {/* Quick Add Milestone Inline Form */}
                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  const form = e.currentTarget;
                                  const input = form.elements.namedItem('milestoneTitle') as HTMLInputElement;
                                  if (!input || !input.value.trim()) return;

                                  setIsSavingMilestone(true);
                                  try {
                                    const response = await fetch("/api/yui/milestones", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        goal_id: goal.id,
                                        title: input.value.trim(),
                                        status: "pending"
                                      }),
                                    });
                                    if (!response.ok) {
                                      const payload = await response.json().catch(() => null);
                                      throw new Error(payload?.error ?? "マイルストーンの保存に失敗しました");
                                    }
                                    const payload = await response.json();
                                    if (payload.milestone) {
                                      setMilestones((current) => [payload.milestone, ...current.filter((milestone) => milestone.id !== payload.milestone.id)]);
                                    }
                                    input.value = "";
                                    await loadData();
                                  } catch (err) {
                                    setError(err instanceof Error ? err.message : "マイルストーンの保存に失敗しました");
                                  } finally {
                                    setIsSavingMilestone(false);
                                  }
                                }}
                                className="mt-2 flex gap-1.5"
                              >
                                <input
                                  name="milestoneTitle"
                                  placeholder="新しいマイルストーン..."
                                  className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-slate-300"
                                />
                                <button
                                  type="submit"
                                  disabled={isSavingMilestone}
                                  className="text-[10px] bg-slate-900 text-white px-2 py-1 rounded hover:bg-slate-800 disabled:opacity-50"
                                >
                                  追加
                                </button>
                              </form>
                            </div>
                          </div>
                          {deleteConfirmGoalId === goal.id ? (
                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => void handleDeleteGoal(goal.id)}
                                className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                              >
                                {isDeleting ? "…" : "削除する"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmGoalId(null)}
                                className="rounded-full border border-border px-3 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-muted"
                              >
                                キャンセル
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmGoalId(goal.id)}
                              className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-red-300 hover:text-red-500"
                            >
                              削除
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">まだデータはありません。</p>
                )}
              </InfoAccordion>
            ) : null}

            <Card className="space-y-5 p-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">時間の提案</p>
                <h2 className="text-2xl font-semibold">YUIの時間提案</h2>
                <p className="text-sm text-muted-foreground">
                  予定・目標・判断をまたいで、今日の使い方をYUIが提案します。
                </p>
              </div>

              {suggestedTimeBlocks.length > 0 ? (
                <div className="space-y-3">
                  {suggestedTimeBlocks.slice(0, 2).map((block) => {
                    const relatedGoal = goals.find((goal) => goal.id === block.goal_id) ?? null;
                    return (
                      <div key={block.id} className="rounded-3xl border border-border bg-muted/20 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold leading-6">{block.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(block.start_at), "HH:mm")} - {format(new Date(block.end_at), "HH:mm")}
                            </p>
                          </div>
                          <div className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                            {block.status}
                          </div>
                        </div>

                        {relatedGoal ? (
                          <div className="mt-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">関連する目的</p>
                            <p className="mt-2 leading-6">{relatedGoal.title}</p>
                          </div>
                        ) : null}

                        <div className="mt-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">理由</p>
                          <p className="mt-2">{block.reason}</p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          {block.status === "pending" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => void handleScheduleSuggestedTimeBlock(block)}
                                className="yohaku-btn"
                              >
                                予定として登録
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleUpdateTimeBlockStatus(block.id, "rejected")}
                                className="rounded-full border border-border bg-background px-4 py-2 text-sm transition hover:bg-muted"
                              >
                                今回は不要
                              </button>
                            </>
                          ) : block.status === "approved" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => void handleScheduleSuggestedTimeBlock(block)}
                                className="yohaku-btn"
                              >
                                Google Calendarに登録する
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleUpdateTimeBlockStatus(block.id, "rejected")}
                                className="rounded-full border border-border bg-background px-4 py-2 text-sm transition hover:bg-muted"
                              >
                                却下
                              </button>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">この提案は処理済みです。</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">今日はまだ時間提案がありません。</p>
              )}
            </Card>

            <Card className="space-y-5 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">提案</p>
                  <h2 className="text-2xl font-semibold">YUIから提案</h2>
                  <p className="text-sm text-muted-foreground">
                    相談内容と現在の文脈をもとに、時間を作る提案を保存します。
                  </p>
                </div>
                <button type="button" className="yohaku-btn" onClick={() => void handleGenerateRecommendation()}>
                  提案を作る
                </button>
              </div>

              {recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.slice(0, 2).map((recommendation) => {
                    const parsed = parseRecommendationContent(recommendation.content);
                    const relatedGoal = goals.find((goal) => goal.id === recommendation.related_goal_id) ?? null;
                    return (
                      <div key={recommendation.id} className="rounded-3xl border border-border bg-muted/20 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold leading-6">{recommendation.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {parsed?.proposed_label ?? "候補時間を検討中"}
                            </p>
                          </div>
                          <div className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                            優先度 {recommendation.score}
                          </div>
                        </div>

                        {relatedGoal ? (
                          <div className="mt-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">関連する目的</p>
                            <p className="mt-2 leading-6">{relatedGoal.title}</p>
                          </div>
                        ) : null}

                        <div className="mt-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">理由</p>
                          <p className="mt-2">{formatRecommendationReason(recommendation.reason)}</p>
                        </div>

                        {parsed?.summary ? (
                          <div className="mt-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">提案</p>
                            <p className="mt-2">{parsed.summary}</p>
                          </div>
                        ) : null}

                        <div className="mt-4 flex flex-wrap gap-3">
                          {recommendation.status === "pending" ? (
                            <>
                              <button
                                type="button"
                                className="yohaku-btn"
                                onClick={() => void handleUpdateRecommendationStatus(recommendation.id, "accepted")}
                              >
                                登録候補を作る
                              </button>
                              <button
                                type="button"
                                className="rounded-full border border-border bg-background px-4 py-2 text-sm transition hover:bg-muted"
                                onClick={() => void handleUpdateRecommendationStatus(recommendation.id, "rejected")}
                              >
                                今回は不要
                              </button>
                            </>
                          ) : recommendation.status === "accepted" ? (
                            <p className="text-sm text-muted-foreground">
                              登録候補を作成しました。下の「予定登録候補」で内容を確認してから、Google Calendarに登録できます。
                            </p>
                          ) : recommendation.status === "rejected" ? (
                            <p className="text-sm text-muted-foreground">この提案は見送られました。</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">この提案は処理済みです。</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  まだ推薦はありません。会話で「時間を作りたい」と伝えるか、提案を作るを押してください。
                </p>
              )}
            </Card>

            <Card className="space-y-5 p-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">予定の登録</p>
                <h2 className="text-2xl font-semibold">予定登録候補</h2>
                <p className="text-sm text-muted-foreground">
                  時間の提案を、まだ外部登録しない「予定登録候補」として保持します。
                </p>
              </div>

              {calendarActions.length > 0 ? (
                <div className="space-y-3">
                  {orderedCalendarActions.slice(0, 3).map((action) => {
                    const relatedTimeBlock = [...timeBlocks, ...suggestedTimeBlocks].find((block) => block.id === action.time_block_id) ?? null;
                    const linkedCalendarEvent = calendarEvents.find((event) => event.external_id === action.external_event_id);
                    const googleCalendarLink = typeof linkedCalendarEvent?.metadata?.googleHtmlLink === "string"
                      ? linkedCalendarEvent.metadata.googleHtmlLink
                      : null;
                    return (
                      <div key={action.id} className="rounded-3xl border border-border bg-muted/20 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold leading-6">{action.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(action.start_at), "MM/dd HH:mm")} - {format(new Date(action.end_at), "HH:mm")}
                            </p>
                          </div>
                          <div className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                            {action.status}
                          </div>
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">登録先</p>
                            <p className="mt-2">
                              {action.provider === "google_calendar"
                              ? "Google カレンダー"
                                : action.provider === "apple_calendar"
                                  ? "Apple カレンダー"
                                  : "手動"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">状態</p>
                            <p className="mt-2">
                              {action.status === "pending"
                                ? "登録候補"
                                : action.status === "approved"
                                  ? "登録を承認済み"
                                  : action.status === "scheduled"
                                    ? "登録済み"
                                    : "見送り"}
                            </p>
                          </div>
                        </div>

                        {action.reason || relatedTimeBlock?.reason ? (
                          <div className="mt-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">なぜこの時間なのか</p>
                            <p className="mt-2">{action.reason ?? relatedTimeBlock?.reason}</p>
                          </div>
                        ) : null}

                        <div className="mt-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">メッセージ</p>
                          <p className="mt-2">
                            {action.status === "pending"
                              ? "この時間を確保すると、今の目的に近づけます。Google カレンダーへの登録候補として保持しています。"
                              : action.status === "approved"
                                ? "Google Calendarへの登録候補を保持しています。登録実行ボタンで外部に作成できます。"
                                : action.status === "scheduled"
                                  ? "✓ Google Calendarに登録済みです。"
                                  : "この候補は見送られました。"}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          {action.status === "pending" || action.status === "approved" ? (
                            <>
                              <button
                                type="button"
                                className="yohaku-btn"
                                onClick={() => void handleScheduleCalendarAction(action.id)}
                              >
                                Google Calendarに登録する
                              </button>
                              <button
                                type="button"
                                className="rounded-full border border-border bg-background px-4 py-2 text-sm transition hover:bg-muted"
                                onClick={() => void handleUpdateCalendarActionStatus(action.id, "pending")}
                              >
                                あとで検討
                              </button>
                              <button
                                type="button"
                                className="rounded-full border border-border bg-background px-4 py-2 text-sm transition hover:bg-muted"
                                onClick={() => void handleUpdateCalendarActionStatus(action.id, "rejected")}
                              >
                                今回は不要
                              </button>
                            </>
                          ) : action.status === "scheduled" ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">✓ Google Calendar登録済み</div>
                              {googleCalendarLink ? <a href={googleCalendarLink} target="_blank" rel="noreferrer" className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">Google Calendarで変更</a> : null}
                              {cancelCalendarActionId === action.id ? (
                                <>
                                  <span className="text-xs text-rose-700">Google Calendarからこの予定を取り消します。</span>
                                  <button type="button" onClick={() => void handleCancelCalendarAction(action.id)} className="rounded-full border border-rose-300 bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">取り消しを確定</button>
                                  <button type="button" onClick={() => setCancelCalendarActionId(null)} className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">やめる</button>
                                </>
                              ) : (
                                <button type="button" onClick={() => setCancelCalendarActionId(action.id)} className="rounded-full border border-rose-200 bg-background px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50">取り消す</button>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">この候補は見送られました。</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  まだ予定登録候補はありません。時間提案を承認するとここに出てきます。
                </p>
              )}
            </Card>

            <Card className="space-y-5 p-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">次の一歩</p>
                <h2 className="text-2xl font-semibold">次にやること</h2>
              </div>

              <div className="rounded-3xl border border-border bg-background p-5">
                <p className="text-sm leading-7 text-foreground/90">
                  {today?.dailyBrief?.summary ?? "今日のまとめを読み込んでいます。"}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoPanel
                  title="今日の推奨アクション"
                  items={today?.dailyBrief?.recommendedActions ?? []}
                  emptyLabel="まだありません"
                />
                <InfoPanel
                  title="未完了事項"
                  items={today?.dailyBrief?.pendingItems ?? []}
                  emptyLabel="まだありません"
                />
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">今考えるべきこと</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    YUI が今の状況から判断の入口を整理します。選択した内容は判断の記録として保存されます。
                  </p>
                </div>

                {(today?.decisionCards ?? []).slice(0, 2).map((card) => {
                  const savedDecision = decisions.find((decision) => decision.question === card.question);
                  return (
                    <div key={card.id} className="rounded-3xl border border-border bg-muted/20 p-5">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold leading-6">{card.question}</p>
                            <p className="text-sm leading-6 text-muted-foreground">{card.background}</p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">理由</p>
                          <p className="mt-2">{card.reason}</p>
                        </div>

                        {savedDecision ? (
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                            保存済み: {savedDecision.decision}
                          </div>
                        ) : null}

                        <div className="flex flex-wrap gap-3">
                          {card.choices.map((choice) => (
                            <button
                              key={choice.label}
                              type="button"
                              disabled={Boolean(savedDecision)}
                              onClick={() => void handleDecisionChoice(card, choice.label, choice.rationale)}
                              className="rounded-full border border-border bg-background px-4 py-2 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {choice.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <MemoryList
              memories={today?.importantMemories ?? memories.slice(0, 3)}
              onRefresh={loadData}
              title="最近の記憶"
              description="重要度順に3件を、YUI が覚えていることとして見せます。"
            />

            <Card className="space-y-4 p-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">記録のタイムライン</p>
                <h2 className="text-lg font-semibold">記憶・判断・振り返りの流れ</h2>
                <p className="text-sm text-muted-foreground">
                  何が、いつ、どう残ったかをひとつの流れで見返せます。
                </p>
              </div>

              <div className="space-y-3">
                {buildTimelineEntries(memories, decisions, reflections).length === 0 ? (
                  <p className="text-sm text-muted-foreground">まだタイムラインはありません。</p>
                ) : (
                  buildTimelineEntries(memories, decisions, reflections).map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-border bg-muted/20 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-medium">{entry.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.kindLabel} / {format(new Date(entry.createdAt), "yyyy/MM/dd HH:mm")}
                        </p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.detail}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="space-y-4 p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">振り返り</p>
                <h2 className="mt-1 text-lg font-semibold">今日の振り返り</h2>
              </div>

              {latestReflection ? (
                <div className="space-y-4 text-sm leading-7">
                  <p>{latestReflection.summary}</p>
                  {latestReflection.insights.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">気づき</p>
                      <ul className="space-y-2">
                        {latestReflection.insights.map((insight) => (
                          <li key={insight} className="rounded-xl border border-border bg-muted/30 px-3 py-2">
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {latestReflection.next_actions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">次にすること</p>
                      <ul className="space-y-2">
                        {latestReflection.next_actions.map((action) => (
                          <li key={action} className="rounded-xl border border-border bg-muted/30 px-3 py-2">
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(latestReflection.created_at), "yyyy/MM/dd HH:mm")}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  まだ振り返りはありません。「振り返りを記録」から残せます。
                </p>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="hidden space-y-4 p-6" aria-hidden="true">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Profile</p>
                <h2 className="mt-1 text-lg font-semibold">YUI プロフィール</h2>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <input
                  value={profileForm.display_name}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, display_name: event.target.value }))
                  }
                  placeholder="表示名"
                  className="yohaku-input"
                />
                <div className="grid gap-4">
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      アシスタント名
                    </span>
                    <input
                      value={profileForm.assistant_name}
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, assistant_name: event.target.value }))
                      }
                      placeholder="YUI"
                      className="yohaku-input"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      YUIの話し方
                    </span>
                    <input
                      value={profileForm.tone}
                      onChange={(event) => setProfileForm((current) => ({ ...current, tone: event.target.value }))}
                      placeholder="やさしく簡潔に"
                      className="yohaku-input"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      今の大切にしたいこと
                    </span>
                    <input
                      value={profileForm.life_theme}
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, life_theme: event.target.value }))
                      }
                      placeholder="今の人生テーマ"
                      className="yohaku-input"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      今、力を入れたいこと
                    </span>
                    <input
                      value={profileForm.focus_area}
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, focus_area: event.target.value }))
                      }
                      placeholder="いま注力したいこと"
                      className="yohaku-input"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      通知強度
                    </span>
                    <select
                      value={profileForm.notification_strength}
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, notification_strength: event.target.value }))
                      }
                      className="yohaku-input"
                    >
                      <option value="low">控えめ</option>
                      <option value="normal">標準</option>
                      <option value="high">しっかり知らせる</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      要約頻度
                    </span>
                    <select
                      value={profileForm.summary_frequency}
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, summary_frequency: event.target.value }))
                      }
                      className="yohaku-input"
                    >
                      <option value="daily">毎日</option>
                      <option value="weekly">毎週</option>
                      <option value="monthly">毎月</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      タイムゾーン
                    </span>
                    <input
                      value={profileForm.timezone}
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, timezone: event.target.value }))
                      }
                      placeholder="Asia/Tokyo"
                      className="yohaku-input"
                    />
                  </label>
                </div>
                <button type="submit" disabled={isSavingProfile} className="yohaku-btn">
                  {isSavingProfile ? "保存中..." : "プロフィールを保存"}
                </button>
              </form>

              <div className="rounded-2xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground/90">プロフィールの保存について</p>
                <p className="mt-2 leading-7">
                  ここで変更した名前、YUIの話し方、通知、要約の設定は、次回以降のYUIの提案と表示に反映されます。
                </p>
                {profile && (
                  <p className="mt-3 text-xs">
                    最終取得: {format(new Date(profile.updated_at), "yyyy/MM/dd HH:mm")}
                  </p>
                )}
              </div>
            </Card>

            <Card ref={goalCardRef} id="goal-form-card" className="space-y-4 p-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">目的</p>
                <h2 className="mt-1 text-lg font-semibold">目的とマイルストーン</h2>
                <p className="text-sm text-muted-foreground">
                  目的を置くと、現在地と次にすることが分かりやすくなります。
                </p>
              </div>

              <form onSubmit={handleSaveGoal} className="space-y-3 rounded-3xl border border-border bg-muted/20 p-4">
                <input
                  ref={goalTitleInputRef}
                  value={goalForm.title}
                  onChange={(event) => setGoalForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="目的"
                  className="yohaku-input"
                />
                <textarea
                  value={goalForm.description}
                  onChange={(event) => setGoalForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="背景・説明（任意）"
                  className="yohaku-input min-h-24"
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    value={goalForm.status}
                    onChange={(event) => setGoalForm((current) => ({ ...current, status: event.target.value }))}
                    className="yohaku-input"
                    aria-label="目的の状態"
                  >
                    <option value="active">進行中</option>
                    <option value="paused">いったん保留</option>
                    <option value="completed">完了</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={goalForm.progress}
                    onChange={(event) =>
                      setGoalForm((current) => ({ ...current, progress: Number(event.target.value) }))
                    }
                    placeholder="進捗"
                    className="yohaku-input"
                    aria-label="目的の進捗（パーセント）"
                  />
                </div>
                <button type="submit" disabled={isSavingGoal} className="yohaku-btn">
                  {isSavingGoal ? "保存中..." : "目的を保存"}
                </button>
              </form>

              <div className="space-y-3 rounded-3xl border border-border bg-muted/20 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">現在の目的</p>
                  <p className="mt-2 text-sm leading-6">
                    {today?.currentPosition?.purpose ?? "まだ目的はありません"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    現在: {today?.currentPosition?.current ?? "0%"} / 次の一歩:{" "}
                    {today?.currentPosition?.nextStep ?? "目的を設定する"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">登録済みの目的</p>
                  {goals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">まだ目的はありません。</p>
                  ) : (
                    goals.slice(0, 3).map((goal) => (
                      <div key={goal.id} className="rounded-2xl border border-border bg-background px-3 py-2">
                        {deleteConfirmGoalId === goal.id ? (
                          <div className="space-y-2 py-1">
                            <p className="text-xs text-red-600 font-medium">この目的を削除しますか？</p>
                            <p className="text-[10px] text-muted-foreground">この操作は元に戻せません。配下のマイルストーンも自動的に削除されます。</p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="rounded bg-red-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-red-700"
                              >
                                {isDeleting ? "削除中..." : "削除する"}
                              </button>
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeleteConfirmGoalId(null)}
                                className="rounded bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-200"
                              >
                                キャンセル
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{goal.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {goal.status === "active" ? "進行中" : goal.status === "paused" ? "いったん保留" : goal.status === "completed" ? "完了" : "状態を確認中"} / {goal.progress}%
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmGoalId(goal.id)}
                              className="text-xs text-slate-400 hover:text-red-600 transition-colors p-1"
                            >
                              削除
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

              </div>
            </Card>

          </div>
        </section>
        ) : null}
      </div>
      {quickPanel === "memo" || (quickPanel === "reflection" && !currentFocus) ? (
        <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-5 z-30 w-[min(22rem,calc(100vw-2.5rem))] rounded-2xl border border-sky-100 bg-white p-4 shadow-xl">
          {quickPanel === "memo" ? (
            <div className="space-y-3">
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">直接記録</p><p className="mt-1 text-sm font-semibold text-slate-700">メモを保存</p></div>
              <textarea value={quickMemoDraft} onChange={(event) => setQuickMemoDraft(event.target.value)} placeholder="あとで思い出したいことを入力" rows={4} autoFocus className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-300" />
              <div className="flex gap-2"><button type="button" disabled={!quickMemoDraft.trim() || isSavingQuickPanel} onClick={() => void handleQuickMemoSave()} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">{isSavingQuickPanel ? "保存中..." : "メモを保存"}</button><button type="button" onClick={() => setQuickPanel(null)} className="text-xs text-slate-400">キャンセル</button></div>
            </div>
          ) : (
            <div className="space-y-3">
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">直接記録</p><p className="mt-1 text-sm font-semibold text-slate-700">振り返りを記録</p></div>
              <textarea value={quickReflectionDraft} onChange={(event) => setQuickReflectionDraft(event.target.value)} placeholder="できたこと、気づいたこと、次に試すこと" rows={4} autoFocus className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-300" />
              <input value={quickNextActionDraft} onChange={(event) => setQuickNextActionDraft(event.target.value)} placeholder="次に試すこと（任意）" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-sky-300" />
              <div className="flex gap-2"><button type="button" disabled={!quickReflectionDraft.trim() || isSavingQuickPanel} onClick={() => void handleQuickReflectionSave()} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">{isSavingQuickPanel ? "保存中..." : "振り返りを保存"}</button><button type="button" onClick={() => setQuickPanel(null)} className="text-xs text-slate-400">キャンセル</button></div>
            </div>
          )}
        </div>
      ) : null}
      <div className={`fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 z-20 flex flex-col items-end gap-2 transition-opacity ${isEditingText ? "pointer-events-none opacity-0" : "opacity-100"}`}>
        {showFabMenu ? (
          <div id="yui-quick-actions" className="rounded-2xl border border-border bg-background p-2 shadow-xl">
            <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">直接記録</p>
            <button type="button" onClick={() => { setShowFabMenu(false); setQuickPanel("memo"); }} className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">メモを保存</button>
            <button type="button" onClick={() => { setShowFabMenu(false); setQuickPanel("reflection"); }} className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">振り返りを記録</button>
            <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">YUIに相談</p>
            <button type="button" onClick={() => openChatComposer("予定を追加したい。日時と内容を整理して")} className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">予定を相談 <span className="ml-1 text-[11px] text-slate-400">日時を伝える</span></button>
            <button type="button" onClick={() => { setShowFabMenu(false); openGoalForm(); }} className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">目的を追加</button>
            <button type="button" onClick={() => { setShowFabMenu(false); openCapture(); }} className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">写真を記録</button>
            <button type="button" onClick={() => openChatComposer()} className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">AI相談</button>
          </div>
        ) : null}
        <button
          type="button"
          aria-label="クイック操作"
          aria-expanded={showFabMenu}
          aria-controls="yui-quick-actions"
          onClick={() => setShowFabMenu((current) => !current)}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground shadow-lg transition hover:scale-105"
        >
          +
        </button>
      </div>
    </main>
    </>
  );
}

function InfoPanel({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-muted/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          items.map((item) => (
            <p key={item} className="rounded-2xl border border-border bg-background px-3 py-2 text-sm leading-6">
              {item}
            </p>
          ))
        )}
      </div>
    </div>
  );
}

function buildTimelineEntries(
  memories: YuiMemory[],
  decisions: YuiDecision[],
  reflections: YuiReflection[],
) {
  const entries = [
    ...memories.slice(0, 10).map((memory) => ({
      id: `memory-${memory.id}`,
      kindLabel: "記憶",
      title: memory.title,
      detail: memory.summary,
      createdAt: memory.created_at,
    })),
    ...decisions.slice(0, 10).map((decision) => ({
      id: `decision-${decision.id}`,
      kindLabel: "判断",
      title: decision.question,
      detail: `${decision.decision} / ${decision.rationale}`,
      createdAt: decision.created_at,
    })),
    ...reflections.slice(0, 10).map((reflection) => ({
      id: `reflection-${reflection.id}`,
      kindLabel: "振り返り",
      title: reflection.summary,
      detail: reflection.insights[0] ?? reflection.next_actions[0] ?? "振り返りの記録",
      createdAt: reflection.created_at,
    })),
  ];

  return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
