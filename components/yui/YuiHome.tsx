"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { GitBranch, Lightbulb, Loader2, RefreshCw, Settings, Target } from "lucide-react";
import { Card } from "@/components/ui/card";

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
import { LiveStatusBadge } from "@/components/yui/LiveStatusBadge";
import { ActivityFeedCard } from "@/components/yui/ActivityFeedCard";

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
  gmailInsights: any[];
  unifiedActions: any[];
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

function looksLikeTimePlanningRequest(content: string) {
  const text = content.trim();
  if (!text) return false;
  return /時間|確保|作りたい|作成|予定|勉強|教材|集中|来週|今週|来月|来年度/.test(text);
}

export function YuiHome({ displayName }: YuiHomeProps) {
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
  const [aiConnected, setAiConnected] = useState<boolean | null>(null);
  const [goals, setGoals] = useState<YuiGoal[]>([]);
  const [milestones, setMilestones] = useState<YuiMilestone[]>([]);
  const [reflections, setReflections] = useState<YuiReflection[]>([]);
  const [recommendations, setRecommendations] = useState<YuiRecommendation[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<YuiSuggestedTimeBlock[]>([]);
  const [calendarActions, setCalendarActions] = useState<YuiCalendarAction[]>([]);
  const [latestReflection, setLatestReflection] = useState<YuiReflection | null>(null);
  const [profileForm, setProfileForm] = useState<YuiProfileSettings>({
    display_name: displayName ?? "",
    assistant_name: displayName ?? "YUI",
    tone: "gentle",
    life_theme: "",
    focus_area: "",
    notification_strength: "normal",
    summary_frequency: "daily",
    timezone: "Asia/Tokyo",
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
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);
  const [deleteConfirmGoalId, setDeleteConfirmGoalId] = useState<string | null>(null);
  const [deleteConfirmMilestoneId, setDeleteConfirmMilestoneId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cacheUpdatedAt, setCacheUpdatedAt] = useState<number | null>(null);
  const [showHealthMenu, setShowHealthMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [gmailInsights, setGmailInsights] = useState<any[]>([]);

  // Refs for Goal Form — used by Setup Guide CTA
  const goalCardRef = useRef<HTMLDivElement>(null);
  const goalTitleInputRef = useRef<HTMLInputElement>(null);

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
      const syncResults = await Promise.allSettled([
        fetch("/api/yui/google/sync", { method: "POST" }),
        fetch("/api/yui/gmail/sync", { method: "POST" }),
      ]);

      const syncErrors = syncResults.flatMap((result, index) => {
        if (result.status === "fulfilled" && !result.value.ok && result.value.status !== 409) {
          return [index === 0 ? "Google Calendar同期に失敗しました" : "Gmail同期に失敗しました"];
        }
        if (result.status === "rejected") {
          return [index === 0 ? "Google Calendar同期に失敗しました" : "Gmail同期に失敗しました"];
        }
        return [];
      });

      if (syncErrors.length > 0) {
        setSectionErrors((current) => ({
          ...current,
          calendar: syncErrors.includes("Google Calendar同期に失敗しました") ? "Google Calendar同期に失敗しました" : current.calendar,
          gmail: syncErrors.includes("Gmail同期に失敗しました") ? "Gmail同期に失敗しました" : current.gmail,
        }));
      }

      const responses = await Promise.all(
        [
          fetch("/api/yui/today"),
          fetch("/api/yui/morning-brief"),
          fetch("/api/yui/daily-context"),
          fetch("/api/yui/unified-actions"),
          fetch("/api/yui/health"),
          fetch("/api/yui/profile"),
          fetch("/api/yui/memories"),
          fetch("/api/yui/memory-candidates"),
          fetch("/api/yui/conversations"),
          fetch("/api/yui/decisions"),
          fetch("/api/yui/goals"),
          fetch("/api/yui/milestones"),
          fetch("/api/yui/reflections"),
          fetch("/api/yui/recommendations"),
          fetch("/api/yui/time-blocks"),
          fetch("/api/yui/calendar-actions"),
          fetch("/api/yui/reflections/latest"),
          fetch("/api/yui/notifications/status"),
          fetch("/api/ai/test-connection").catch(() => null),
        ].map(async (request) => {
          try {
            return await request;
          } catch {
            return null;
          }
        }),
      );

      const [
        todayRes,
        briefRes,
        dailyContextRes,
        unifiedActionsRes,
        healthRes,
        profileRes,
        memoriesRes,
        memoryCandidatesRes,
        conversationsRes,
        decisionsRes,
        goalsRes,
        milestonesRes,
        reflectionsRes,
        recommendationsRes,
        timeBlocksRes,
        calendarActionsRes,
        latestReflectionRes,
        deliveryStatusRes,
        aiTestRes,
      ] = responses;

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
        gmailInsights: currentCache?.gmailInsights ?? [],
        unifiedActions: currentCache?.unifiedActions ?? [],
      };

      if (todayRes?.ok) {
        const payload = await todayRes.json();
        nextSnapshot.today = payload;
      } else {
        setSectionErrors((current) => ({ ...current, today: "Todayの取得に失敗しました" }));
      }

      if (briefRes?.ok) {
        const payload = await briefRes.json();
        nextSnapshot.morningBrief = payload;
      } else {
        setSectionErrors((current) => ({ ...current, morningBrief: "Morning Briefの取得に失敗しました" }));
      }

      if (dailyContextRes?.ok) {
        const payload = await dailyContextRes.json();
        nextSnapshot.dailyContext = payload;
      }

      if (unifiedActionsRes?.ok) {
        const payload = await unifiedActionsRes.json();
        nextSnapshot.unifiedActions = payload.actions ?? [];
      } else {
        setSectionErrors((current) => ({ ...current, unifiedActions: "Unified Actionsの取得に失敗しました" }));
      }

      if (healthRes?.ok) {
        const payload = await healthRes.json();
        setGoogleHealth(payload.google ?? null);
      } else {
        setGoogleHealth(null);
      }

      if (aiTestRes?.ok) {
        const aiPayload = await aiTestRes.json().catch(() => null);
        setAiConnected(aiPayload?.connected === true);
      }

      if (profileRes?.ok) {
        const payload = await profileRes.json();
        nextSnapshot.profile = payload.profile ?? null;
      }

      if (memoriesRes?.ok) {
        const payload = await memoriesRes.json();
        nextSnapshot.memories = payload.memories ?? [];
      }

      if (memoryCandidatesRes?.ok) {
        const payload = await memoryCandidatesRes.json();
        nextSnapshot.memoryCandidates = payload.memoryCandidates ?? [];
      }

      if (conversationsRes?.ok) {
        const payload = await conversationsRes.json();
        nextSnapshot.conversations = payload.conversations ?? [];
      }

      if (decisionsRes?.ok) {
        const payload = await decisionsRes.json();
        nextSnapshot.decisions = payload.decisions ?? [];
      }

      if (goalsRes?.ok) {
        const payload = await goalsRes.json();
        nextSnapshot.goals = payload.goals ?? [];
      }

      if (milestonesRes?.ok) {
        const payload = await milestonesRes.json();
        nextSnapshot.milestones = payload.milestones ?? [];
      }

      if (reflectionsRes?.ok) {
        const payload = await reflectionsRes.json();
        nextSnapshot.reflections = payload.reflections ?? [];
      }

      if (recommendationsRes?.ok) {
        const payload = await recommendationsRes.json();
        nextSnapshot.recommendations = payload.recommendations ?? [];
      }

      if (timeBlocksRes?.ok) {
        const payload = await timeBlocksRes.json();
        nextSnapshot.timeBlocks = payload.timeBlocks ?? [];
      }

      if (calendarActionsRes?.ok) {
        const payload = await calendarActionsRes.json();
        nextSnapshot.calendarActions = payload.calendarActions ?? [];
      }

      if (latestReflectionRes?.ok) {
        const payload = await latestReflectionRes.json();
        nextSnapshot.latestReflection = payload.reflection ?? null;
      }

      if (deliveryStatusRes?.ok) {
        nextSnapshot.deliveryStatus = await deliveryStatusRes.json();
      }

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

  useEffect(() => {
    void loadInitialData();
  }, []);

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    setIsSavingProfile(true);
    try {
      const response = await fetch("/api/yui/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "プロフィールの保存に失敗しました");
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "プロフィールの保存に失敗しました");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSendConversation = async (content: string) => {
    const response = await fetch("/api/yui/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "user", content }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "会話の保存に失敗しました");
    }

    const payload = await response.json();
    if (looksLikeTimePlanningRequest(content)) {
      await fetch("/api/yui/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "time_block", context: content }),
      });
    }
    await loadData();
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
        throw new Error(payload?.error ?? "目標の保存に失敗しました");
      }

      setGoalForm({
        title: "",
        description: "",
        status: "active",
        progress: 0,
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "目標の保存に失敗しました");
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
        throw new Error(payload?.error ?? "目標の削除に失敗しました");
      }
      setDeleteConfirmGoalId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "目標の削除に失敗しました");
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

  const recentEvents = today?.recentEvents ?? [];
  const calendarEvents = today?.calendarEvents ?? [];
  const suggestedTimeBlocks = today?.suggestedTimeBlocks ?? [];

  const activityItems = [
    ...recentEvents.slice(0, 4).map((event) => ({
      time: format(new Date(event.occurred_at), "HH:mm"),
      title: event.title || event.event_type,
      detail: event.content || event.event_type,
    })),
    ...(calendarEvents.length > 0
      ? [{ time: "今日", title: "Google Calendar同期", detail: `${calendarEvents.length}件の予定を確認しました。` }]
      : []),
    ...(gmailInsights.length > 0
      ? [{ time: "今日", title: "新着メール", detail: `${gmailInsights.length}件の未読メールがあります。` }]
      : []),
    ...(goals.length > 0
      ? [{ time: "今日", title: "Goal更新", detail: `${goals[0]?.title ?? "目標"} が今の優先事項です。` }]
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
      label: "Gmail",
      title: gmailInsights[0].subject ?? "新着メール",
      detail: gmailInsights[0].snippet ?? "重要メールを確認しました。",
    });
  }

  if (calendarEvents[0]) {
    recentChangeCards.push({
      label: "Calendar",
      title: calendarEvents[0].title ?? "予定",
      detail: calendarEvents[0].start_at ? `今日 ${format(new Date(calendarEvents[0].start_at), "HH:mm")}` : "今日の予定を確認しました。",
    });
  }

  if (goals[0]) {
    recentChangeCards.push({
      label: "Goals",
      title: goals[0].title ?? "目標",
      detail: goals[0].description ?? "今の軸を維持しています。",
    });
  }

  if (reflections[0]) {
    recentChangeCards.push({
      label: "Reflections",
      title: "振り返り",
      detail: reflections[0].summary || "今週の気づきを記録しました。",
    });
  }

  const currentFocus = goals.find((goal) => goal.status === "active") ?? goals[0] ?? null;
  const focusMilestones = currentFocus
    ? milestones.filter((milestone) => milestone.goal_id === currentFocus.id)
    : [];
  const nextMilestone =
    focusMilestones.find((milestone) => milestone.status !== "completed") ?? focusMilestones[0] ?? null;
  const compactTimelineItems = [
    currentFocus
      ? {
          id: `goal-${currentFocus.id}`,
          label: "Goal",
          title: currentFocus.title,
          meta: `${currentFocus.progress ?? 0}%`,
        }
      : null,
    ...focusMilestones.slice(0, 3).map((milestone) => ({
      id: `milestone-${milestone.id}`,
      label: "Milestone",
      title: milestone.title,
      meta: milestone.status === "completed" ? "完了" : "次候補",
    })),
    calendarEvents[0]
      ? {
          id: `calendar-${calendarEvents[0].id}`,
          label: "Calendar",
          title: calendarEvents[0].title,
          meta: format(new Date(calendarEvents[0].start_at), "MM/dd HH:mm"),
        }
      : null,
  ].filter(Boolean) as Array<{ id: string; label: string; title: string; meta: string }>;
  const compactInsights = [
    contextSummary?.reason,
    today?.recentInsights?.[0],
    latestReflection?.insights?.[0],
  ].filter(Boolean).slice(0, 2) as string[];
  const pendingRecommendationActions = recommendations.filter(
    (rec) => rec.type === "action" && rec.status === "pending",
  );
  const confirmationItems = [
    ...pendingRecommendationActions.map((rec) => ({
      id: rec.id,
      title: rec.title,
      description: rec.reason,
      source: "YUI Chat",
      kind: "recommendation" as const,
      onAccept: () => handleExecuteAction(rec.id),
      onReject: () => handleRejectAction(rec.id),
    })),
    ...unifiedActions.slice(0, Math.max(0, 3 - pendingRecommendationActions.length)).map((action) => ({
      id: action.id,
      title: action.title,
      description: action.description,
      source: action.source,
      kind: "unified" as const,
      onAccept: () => handleExecuteUnifiedAction(action),
      onReject: null,
    })),
  ].slice(0, 3);

  const googleStatusLabel =
    googleHealth?.status === "connected"
      ? "Google 接続済み"
      : googleHealth?.status === "refreshing"
        ? "同期中..."
        : googleHealth?.status === "needs_reauth"
          ? "再接続が必要"
          : googleHealth?.status === "sync_error"
            ? "同期エラー"
            : "未接続";

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-slate-900">
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-16 sm:px-10 lg:px-16">
        <header className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <p className="font-medium uppercase tracking-[0.22em] text-slate-500">YOHAKU OS / YUI</p>
          <div className="flex flex-wrap items-center gap-2">
            <span>更新: {formatRelativeTime(cacheUpdatedAt)}</span>
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
                <span>Live</span>
              </button>
              {showHealthMenu ? (
                <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-2xl border border-slate-200/80 bg-white/90 p-2 shadow-sm backdrop-blur">
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">システム連携状態</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="rounded-xl bg-slate-50 px-2 py-1 text-slate-600">Google: {googleHealth?.status === "connected" ? "接続済み" : googleHealth?.status === "needs_reauth" ? "再認証が必要" : "未接続"}</p>
                    <p className="rounded-xl bg-slate-50 px-2 py-1 text-slate-600">Gmail: {gmailInsights.length > 0 ? "接続済み" : "未接続"}</p>
                    <p className="rounded-xl bg-slate-50 px-2 py-1 text-slate-600">AI: {morningBrief ? "接続済み" : "未接続"}</p>
                    <p className="rounded-xl bg-slate-50 px-2 py-1 text-slate-600">Supabase: {error ? "メンテナンス中" : "接続中"}</p>
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
                onClick={() => {
                  setShowSettingsMenu((current) => !current);
                  setShowHealthMenu(false);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-slate-600 transition hover:bg-white"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
              {showSettingsMenu ? (
                <div className="absolute right-0 top-full z-10 mt-2 w-44 rounded-2xl border border-slate-200/80 bg-white/90 p-2 shadow-sm backdrop-blur">
                  <Link href="/yui/settings" className="block rounded-xl px-2 py-2 text-sm text-slate-600 hover:bg-slate-50">接続</Link>
                  <Link href="/yui/settings" className="block rounded-xl px-2 py-2 text-sm text-slate-600 hover:bg-slate-50">AI設定</Link>
                  <Link href="/yui/settings" className="block rounded-xl px-2 py-2 text-sm text-slate-600 hover:bg-slate-50">通知</Link>
                  <Link href="/yui/settings" className="block rounded-xl px-2 py-2 text-sm text-slate-600 hover:bg-slate-50">テーマ</Link>
                  <Link href="/yui/settings" className="block rounded-xl px-2 py-2 text-sm text-slate-600 hover:bg-slate-50">ヘルプ</Link>
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
            const googleConnected = googleHealth?.status === "connected";
            const aiReady = aiConnected === true;
            const hasGoal = goals.length > 0;
            const completedCount = [googleConnected, aiReady, hasGoal].filter(Boolean).length;
            if (completedCount === 3) return null;
            const steps = [
              {
                done: googleConnected,
                label: "Google カレンダー・Gmail を接続する",
                action: <Link href="/yui/settings" className="text-sm text-slate-700 hover:text-slate-900 underline underline-offset-2">Google カレンダー・Gmail を接続する</Link>,
              },
              {
                done: aiReady,
                label: "AI（Gemini）を接続する",
                action: <Link href="/yui/settings" className="text-sm text-slate-700 hover:text-slate-900 underline underline-offset-2">AI（Gemini）を接続する</Link>,
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
                  <span className="text-[10px] text-slate-400">{completedCount} / 3 完了</span>
                </div>
                <p className="text-sm font-medium text-slate-700">YUIを使い始めるための手順</p>
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
              setProfileForm((prev) => ({ ...prev, has_completed_onboarding: true }));
              if (profile) {
                setProfile({ ...profile, has_completed_onboarding: true });
              }
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
                {/* 1. Priority 1 — YUI Chat (Conversation Hub) */}
                <YuiChat
                  conversations={conversations}
                  memoryCandidates={memoryCandidates}
                  onSend={handleSendConversation}
                  onApproveCandidate={handleApproveCandidate}
                  onRejectCandidate={handleRejectCandidate}
                />

                {/* 2. Compact Header (Good morning & Current Status summary) */}
                <Card className="p-6 relative overflow-hidden border-slate-200 bg-white shadow-sm rounded-3xl">
                  <div className="absolute top-0 right-0 p-4">
                    <LiveStatusBadge
                      status={isRefreshing ? "updating" : "cached"}
                      text={isRefreshing ? "同期中" : "同期完了"}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening"}
                      </p>
                      <h2 className="text-2xl font-light tracking-tight text-slate-900">
                        {displayName ? `${displayName}さん` : "今日の一歩"}
                      </h2>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600 leading-relaxed font-light">
                      <p className="font-medium text-slate-800">
                        【最重要】{contextSummary?.priority || morningBrief?.priority || "今日の予定と目標をYUIと整理しましょう。"}
                      </p>
                      <p>
                        【次の一歩】{contextSummary?.nextAction || "チャットで「今日の予定は？」と話しかけてみてください。"}
                      </p>
                    </div>
                    {/* Status chips */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {[
                        calendarEvents.length > 0 ? `予定 ×${calendarEvents.length}` : "予定 ×0",
                        gmailInsights.length > 0 ? `メール未読 ×${gmailInsights.length}` : "未読 ×0",
                        goals[0] ? `目標進捗 ${goals[0].progress ?? 0}%` : "目標進捗 0%",
                      ].map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-light text-slate-600 border border-slate-100"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* 3. Confirmation Layer */}
                <Card className="space-y-4 rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">YUIからの確認待ち</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">実行する前に確認</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                      {confirmationItems.length}件
                    </span>
                  </div>

                  {confirmationItems.length === 0 ? (
                    <p className="text-sm text-slate-500">今すぐ確認が必要な提案はありません。</p>
                  ) : (
                    <div className="space-y-3">
                      {confirmationItems.map((item) => (
                        <div key={`${item.kind}-${item.id}`} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                              <p className="line-clamp-2 text-xs leading-5 text-slate-500">{item.description}</p>
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{item.source}</p>
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
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* 4. Today / Focus / Timeline / Insight */}
                <div className="grid gap-6 md:grid-cols-2">
                  <TodaySummary
                    todaySummary={morningBrief?.summary ?? today?.summary ?? null}
                    eventsCount={morningBrief?.todayEventsCount ?? (calendarEvents?.length ?? 0)}
                    unreadEmails={gmailInsights?.length ?? 0}
                    topPriority={contextSummary?.priority ?? morningBrief?.priority ?? null}
                    updatedAt={cacheUpdatedAt}
                    changeSummary={morningBrief?.changeSummary ?? null}
                  />

                  <Card className="space-y-4 rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Current Focus</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-900">
                          {currentFocus?.title ?? "YUIに目的を話す"}
                        </h3>
                      </div>
                      <Target className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{ width: `${Math.min(100, Math.max(0, currentFocus?.progress ?? 0))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{currentFocus ? `${currentFocus.progress ?? 0}%` : "未設定"}</span>
                        <span>{nextMilestone ? `次: ${nextMilestone.title}` : "「始めたいこと」を送る"}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="space-y-4 rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Life Timeline</p>
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
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">YUI Insight</p>
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
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">More</p>
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
                        await fetch("/api/yui/recommendations", { method: "POST" });
                        await loadData({ background: true });
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  />

                  <TodaySummary
                    todaySummary={morningBrief?.summary ?? today?.summary ?? null}
                    eventsCount={morningBrief?.todayEventsCount ?? (calendarEvents?.length ?? 0)}
                    unreadEmails={gmailInsights?.length ?? 0}
                    topPriority={contextSummary?.priority ?? morningBrief?.priority ?? null}
                    updatedAt={cacheUpdatedAt}
                    changeSummary={morningBrief?.changeSummary ?? null}
                  />

                  <ActivityFeedCard items={activityItems.slice(0, 5)} />
                </div>
              ) : null}
            </section>

            {showMore ? (
              <>
                <YuiDailyContextCard data={dailyContext} isLoading={!dailyContext} />

                <InfoAccordion title={memoryState.loaded ? `Memory (${memoryState.data?.length ?? 0})` : memoryState.loading ? "Memory (...)" : memoryState.error ? "Memory (Offline)" : "Memory"} onOpen={fetchMemories}>
                  {memoryState.loading ? (
                    <YuiCardSkeleton lines={3} />
                  ) : memoryState.error ? (
                    <p className="text-sm text-muted-foreground">メモリの取得に失敗しました。オフラインの可能性があります。</p>
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
                    <p className="text-sm text-muted-foreground">まだメモリの取得を行っていません。開いて取得してください。</p>
                  )}
                </InfoAccordion>

                <InfoAccordion title={insightsState.loaded ? `Insights (${insightsState.data?.length ?? 0})` : insightsState.loading ? "Insights (...)" : insightsState.error ? "Insights (Offline)" : "Insights"} onOpen={fetchInsights}>
                  {insightsState.loading ? (
                    <YuiCardSkeleton lines={3} />
                  ) : insightsState.error ? (
                    <p className="text-sm text-muted-foreground">インサイトの取得に失敗しました。オフラインの可能性があります。</p>
                  ) : insightsState.loaded ? (
                    <YuiThreadInsightsCard threads={insightsState.data ?? []} isLoading={false} />
                  ) : (
                    <p className="text-sm text-muted-foreground">まだインサイトを取得していません。開いて取得してください。</p>
                  )}
                </InfoAccordion>

                <YuiProgressCard threads={threadProgress} isLoading={threadProgress === null} />

                <YuiTimeInsightsCard data={timeIntelligence} isLoading={timeIntelligence === null} />

                <YuiPlanningCard suggestions={planningSuggestions} isLoading={planningSuggestions === null} />

                <YuiWeeklyReviewCard review={weeklyReview} isLoading={weeklyReview === null} />

                {contextSummary && (
                  <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 via-background to-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">YUI Focus</p>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">スコア: {contextSummary.priorityScore}</span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">今日の優先事項</h2>
                          <p className="mt-1 text-xl font-bold tracking-tight text-foreground md:text-2xl">{contextSummary.priority}</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">理由</h3>
                            <p className="mt-2 text-sm leading-6 text-foreground/90">{contextSummary.reason}</p>
                          </div>
                          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">次の一歩</h3>
                            <p className="mt-2 text-sm font-medium leading-6 text-foreground">{contextSummary.nextAction}</p>
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
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">YUI Today</p>
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
                            {event.event_type} / {event.source} / {format(new Date(event.occurred_at), "yyyy/MM/dd HH:mm")}
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
                      ? `Calendar (${calendarState.data?.length ?? 0})`
                      : calendarState.loading
                        ? "Calendar (...)"
                        : calendarState.error
                          ? "Calendar (Offline)"
                          : "Calendar"
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
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Unified Action Layer</p>
                <h2 className="text-xl font-semibold">YUI Priorities</h2>
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
                      <div className="mt-3 flex justify-end">
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
                  ? "Gmail (Offline)"
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
                  ? `Memory (${memoryState.data?.length ?? 0})`
                  : memoryState.loading
                    ? "Memory (...)"
                    : memoryState.error
                      ? "Memory (Offline)"
                      : "Memory"
              }
              onOpen={fetchMemories}
            >
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
                      <p className="text-sm font-medium">{memory.title}</p>
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
                  ? `Insights (${insightsState.data?.length ?? 0})`
                  : insightsState.loading
                    ? "Insights (...)"
                    : insightsState.error
                      ? "Insights (Offline)"
                      : "Insights"
              }
              onOpen={fetchInsights}
            >
              {insightsState.loading ? (
                <YuiCardSkeleton lines={3} />
              ) : insightsState.error ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">インサイトの取得に失敗しました。オフラインの可能性があります。</p>
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
                      <p className="text-sm font-medium">{insight.title ?? insight.summary ?? "Insight"}</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{insight.reason ?? insight.summary ?? "インサイトはありません"}</p>
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
                    ? `Goals (${goalsState.data?.length ?? 0})`
                    : goalsState.loading
                      ? "Goals (...)"
                      : goalsState.error
                        ? "Goals (Offline)"
                        : "Goals"
                }
                onOpen={fetchGoals}
              >
                {goalsState.loading ? (
                  <YuiCardSkeleton lines={3} />
                ) : goalsState.error ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Goals の取得に失敗しました。</p>
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
                                      <span className="text-[9px] bg-slate-100 px-1 py-0.5 rounded text-slate-500">{m.status}</span>
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
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Time Intelligence</p>
                <h2 className="text-2xl font-semibold">YUI Time Suggestion</h2>
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
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">関連Goal</p>
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
                                onClick={() => void handleUpdateTimeBlockStatus(block.id, "approved")}
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
                                onClick={() => void handleUpdateTimeBlockStatus(block.id, "created")}
                                className="yohaku-btn"
                              >
                                作成済みにする
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
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Recommendation</p>
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
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">関連Goal</p>
                            <p className="mt-2 leading-6">{relatedGoal.title}</p>
                          </div>
                        ) : null}

                        <div className="mt-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">理由</p>
                          <p className="mt-2">{recommendation.reason}</p>
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
                                時間を作る
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
                              時間提案を作成し、登録候補を準備しました。
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
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Action Layer</p>
                <h2 className="text-2xl font-semibold">予定登録候補</h2>
                <p className="text-sm text-muted-foreground">
                  Time Block を、まだ外部登録しない「予定登録候補」として保持します。
                </p>
              </div>

              {calendarActions.length > 0 ? (
                <div className="space-y-3">
                  {calendarActions.slice(0, 3).map((action) => {
                    const relatedTimeBlock = [...timeBlocks, ...suggestedTimeBlocks].find((block) => block.id === action.time_block_id) ?? null;
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
                                ? "Google Calendar"
                                : action.provider === "apple_calendar"
                                  ? "Apple Calendar"
                                  : "Manual"}
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
                              ? "この時間を確保すると、今のGoalに近づけます。Google Calendarへの登録候補として保持しています。"
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
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                              ✓ Google Calendar登録済み
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
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Next Action</p>
                <h2 className="text-2xl font-semibold">次にやること</h2>
              </div>

              <div className="rounded-3xl border border-border bg-background p-5">
                <p className="text-sm leading-7 text-foreground/90">
                  {today?.dailyBrief?.summary ?? "Daily Brief を読み込んでいます。"}
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
                    YUI が今の状況から判断の入口を整理します。選択した内容は decisions に保存されます。
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
                          <div className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                            confidence {card.confidence}
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
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Memory Timeline</p>
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
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Reflection</p>
                <h2 className="mt-1 text-lg font-semibold">今日の Reflection</h2>
              </div>

              {latestReflection ? (
                <div className="space-y-4 text-sm leading-7">
                  <p>{latestReflection.summary}</p>
                  {latestReflection.insights.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Insights</p>
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
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Next actions</p>
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
                  まだ振り返りはありません。Sprint 3 では参照表示のみを用意しています。
                </p>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="space-y-4 p-6">
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
                      tone
                    </span>
                    <input
                      value={profileForm.tone}
                      onChange={(event) => setProfileForm((current) => ({ ...current, tone: event.target.value }))}
                      placeholder="gentle"
                      className="yohaku-input"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      life theme
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
                      focus area
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
                      <option value="low">low</option>
                      <option value="normal">normal</option>
                      <option value="high">high</option>
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
                      <option value="daily">daily</option>
                      <option value="weekly">weekly</option>
                      <option value="monthly">monthly</option>
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
                <p className="font-medium text-foreground/90">現在の保存先</p>
                <p className="mt-2 leading-7">
                  表示名と新しいプロフィール項目は `yui_profiles` の列、通知強度と要約頻度は
                  `notification_settings`、タイムゾーンは `preferences.timezone` に保存します。
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
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Goals</p>
                <h2 className="mt-1 text-lg font-semibold">目的とマイルストーン</h2>
                <p className="text-sm text-muted-foreground">
                  目的を置くと、YUI Today の現在地と次の一歩が安定して見えるようになります。
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
                  placeholder="背景・説明"
                  className="yohaku-input min-h-24"
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    value={goalForm.status}
                    onChange={(event) => setGoalForm((current) => ({ ...current, status: event.target.value }))}
                    className="yohaku-input"
                  >
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                    <option value="completed">completed</option>
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
                                {goal.status} / {goal.progress}%
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
      <div className="fixed bottom-5 right-5 z-20 flex flex-col items-end gap-2">
        {showFabMenu ? (
          <div className="rounded-2xl border border-border bg-background p-2 shadow-xl">
            <button type="button" className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">予定追加</button>
            <button type="button" className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">メモ</button>
            <button type="button" className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">Reflection</button>
            <button type="button" className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">Goal</button>
            <button type="button" className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">AI相談</button>
          </div>
        ) : null}
        <button
          type="button"
          aria-label="quick actions"
          onClick={() => setShowFabMenu((current) => !current)}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground shadow-lg transition hover:scale-105"
        >
          +
        </button>
      </div>
    </main>
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
      kindLabel: "Memory",
      title: memory.title,
      detail: memory.summary,
      createdAt: memory.created_at,
    })),
    ...decisions.slice(0, 10).map((decision) => ({
      id: `decision-${decision.id}`,
      kindLabel: "Decision",
      title: decision.question,
      detail: `${decision.decision} / ${decision.rationale}`,
      createdAt: decision.created_at,
    })),
    ...reflections.slice(0, 10).map((reflection) => ({
      id: `reflection-${reflection.id}`,
      kindLabel: "Reflection",
      title: reflection.summary,
      detail: reflection.insights[0] ?? reflection.next_actions[0] ?? "振り返りの記録",
      createdAt: reflection.created_at,
    })),
  ];

  return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
