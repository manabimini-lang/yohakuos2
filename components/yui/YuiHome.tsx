"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MemoryList } from "@/components/yui/MemoryList";
import { YuiChat } from "@/components/yui/YuiChat";
import type {
  YuiConversation,
  YuiCalendarAction,
  YuiDecision,
  YuiConnection,
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
} from "@/app/ui/backend/yui/models";
import type { YuiContextSummary } from "@/app/ui/backend/yui/context_service";
import type { YuiMorningBrief } from "@/app/ui/backend/yui/brief_service";

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
  const [contextSummary, setContextSummary] = useState<YuiContextSummary | null>(null);
  const [profile, setProfile] = useState<YuiProfile | null>(null);
  const [memories, setMemories] = useState<YuiMemory[]>([]);
  const [memoryCandidates, setMemoryCandidates] = useState<YuiMemoryCandidate[]>([]);
  const [conversations, setConversations] = useState<YuiConversation[]>([]);
  const [decisions, setDecisions] = useState<YuiDecision[]>([]);
  const [connections, setConnections] = useState<YuiConnection[]>([]);
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
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setError(null);
    try {
      const [
        todayRes,
        briefRes,
        contextRes,
        profileRes,
        memoriesRes,
        conversationsRes,
        decisionsRes,
        goalsRes,
        milestonesRes,
        connectionsRes,
        reflectionsRes,
        recommendationsRes,
        timeBlocksRes,
        calendarActionsRes,
        reflectionRes,
        candidatesRes,
      ] = await Promise.all([
        fetch("/api/yui/today"),
        fetch("/api/yui/morning-brief"),
        fetch("/api/yui/context"),
        fetch("/api/yui/profile"),
        fetch("/api/yui/memories"),
        fetch("/api/yui/conversations"),
        fetch("/api/yui/decisions"),
        fetch("/api/yui/goals"),
        fetch("/api/yui/milestones"),
        fetch("/api/yui/connections"),
        fetch("/api/yui/reflections"),
        fetch("/api/yui/recommendations"),
        fetch("/api/yui/time-blocks?limit=100"),
        fetch("/api/yui/calendar-actions"),
        fetch("/api/yui/reflections/latest"),
        fetch("/api/yui/memory-candidates"),
      ]);

      if (todayRes.ok) {
        const payload = await todayRes.json();
        setToday(payload);
      }

      if (briefRes.ok) {
        const payload = await briefRes.json();
        setMorningBrief(payload);
      }

      if (contextRes.ok) {
        const payload = await contextRes.json();
        setContextSummary(payload);
      }

      if (profileRes.ok) {
        const payload = await profileRes.json();
        const profileData = payload.profile ?? null;
        setProfile(profileData);
        if (profileData) {
          setProfileForm({
            display_name: profileData.display_name ?? "",
            assistant_name: profileData.assistant_name ?? profileData.display_name ?? "YUI",
            tone: profileData.tone ?? "",
            life_theme: profileData.life_theme ?? "",
            focus_area: profileData.focus_area ?? "",
            notification_strength: String(profileData.notification_settings?.notification_strength ?? "normal"),
            summary_frequency: String(profileData.notification_settings?.summary_frequency ?? "daily"),
            timezone: String(profileData.preferences?.timezone ?? "Asia/Tokyo"),
          });
        }
      } else if (displayName) {
        setProfileForm((current) => ({
          ...current,
          display_name: displayName,
          assistant_name: current.assistant_name || displayName,
        }));
      }

      if (memoriesRes.ok) {
        const payload = await memoriesRes.json();
        setMemories(payload.memories ?? []);
      }

      if (conversationsRes.ok) {
        const payload = await conversationsRes.json();
        setConversations(payload.conversations ?? []);
      }

      if (decisionsRes.ok) {
        const payload = await decisionsRes.json();
        setDecisions(payload.decisions ?? []);
      }

      if (goalsRes.ok) {
        const payload = await goalsRes.json();
        const goalsData = payload.goals ?? [];
        setGoals(goalsData);
        setMilestoneForm((current) => ({
          ...current,
          goal_id: current.goal_id || goalsData[0]?.id || "",
        }));
      }

      if (milestonesRes.ok) {
        const payload = await milestonesRes.json();
        setMilestones(payload.milestones ?? []);
      }

      if (connectionsRes.ok) {
        const payload = await connectionsRes.json();
        setConnections(payload.connections ?? []);
      }

      if (reflectionsRes.ok) {
        const payload = await reflectionsRes.json();
        setReflections(payload.reflections ?? []);
      }

      if (recommendationsRes.ok) {
        const payload = await recommendationsRes.json();
        setRecommendations(payload.recommendations ?? []);
      }

      if (timeBlocksRes.ok) {
        const payload = await timeBlocksRes.json();
        setTimeBlocks(payload.timeBlocks ?? []);
      }

      if (calendarActionsRes.ok) {
        const payload = await calendarActionsRes.json();
        setCalendarActions(payload.calendarActions ?? []);
      }

      if (reflectionRes.ok) {
        const payload = await reflectionRes.json();
        setLatestReflection(payload.reflection ?? null);
      }

      if (candidatesRes.ok) {
        const payload = await candidatesRes.json();
        setMemoryCandidates(payload.memoryCandidates ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "データの取得に失敗しました");
    }
  };

  useEffect(() => {
    void loadData();
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

  const recentEvents = today?.recentEvents ?? [];
  const calendarEvents = today?.calendarEvents ?? [];
  const suggestedTimeBlocks = today?.suggestedTimeBlocks ?? [];
  const googleCalendarConnection = connections.find((connection) => connection.provider === "google_calendar") ?? null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,1))] pb-20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">YOHAKU OS / YUI</p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              {displayName ? `${displayName} の` : "あなたの"} YUI Home
            </h1>
            <Link
              href="/yui/settings"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              <Settings className="h-4 w-4" />
              <span>設定・接続</span>
            </Link>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            秘書YUIが今日どう動くかを提示する伴走空間です。
            朝礼・優先事項・本日の状況から次の一歩を踏み出せます。
          </p>
        </header>

        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
          </div>
        )}

        {/* Morning Brief Section (Secretary Speech Interface) */}
        {morningBrief && (
          <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-muted/30 p-6 md:p-8 shadow-md">
            <div className="flex flex-col gap-6">
              {/* Header / Speech bubble indicator */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                    YUI
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                      Morning Brief
                    </p>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                      {morningBrief.greeting}、{profileForm.display_name || "ユーザー"} さん。
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                    通知内容として配信予定
                  </span>
                  <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                    今日の予定 {morningBrief.todayEventsCount}件
                  </span>
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    YUI提案 {morningBrief.recommendationCount}件
                  </span>
                </div>

              </div>

              {/* Conversational Message Content */}
              <div className="space-y-4 text-base leading-7 text-foreground/90 md:text-lg">
                <p className="font-semibold text-foreground">
                  {morningBrief.summary}
                </p>
                <p className="text-sm text-muted-foreground leading-7 md:text-base">
                  {morningBrief.reason}
                </p>
                <div className="mt-2 rounded-2xl border border-primary/20 bg-background/90 p-4 text-sm font-medium leading-6 text-foreground md:text-base">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary block mb-1">
                    提案メッセージ
                  </span>
                  {morningBrief.nextAction}しませんか？
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* YUI Focus Section (Context Engine Output) */}
        {contextSummary && (
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 via-background to-background p-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                  YUI Focus
                </p>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  スコア: {contextSummary.priorityScore}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">今日の優先事項</h2>
                  <p className="mt-1 text-xl font-bold tracking-tight text-foreground md:text-2xl">
                    {contextSummary.priority}
                  </p>
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

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <Card className="space-y-5 p-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">YUI Today</p>
                <h2 className="text-2xl font-semibold">今日の状況</h2>
              </div>

              <div className="rounded-3xl border border-border bg-background p-5">
                <p className="text-sm leading-7 text-foreground/90">
                  {today?.summary ?? "今日の状況を読み込んでいます。"}
                </p>
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

                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">今日の予定</p>
                    <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                      Google Calendar{" "}
                      {googleCalendarConnection?.status === "connected"
                        ? "接続済み"
                        : googleCalendarConnection?.status === "pending"
                          ? "接続待ち"
                          : "未接続"}
                    </span>
                  </div>

                  {calendarEvents.length > 0 ? (
                    <div className="space-y-2">
                      {calendarEvents.slice(0, 3).map((event) => (
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
                </div>
              </div>
            </Card>

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
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Consult</p>
                <h2 className="mt-1 text-lg font-semibold">YUI に相談</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  保存後に記憶候補が出るので、後から「これは覚えておきますか？」へ繋げられます。
                </p>
              </div>
              <YuiChat
                conversations={conversations}
                memoryCandidates={memoryCandidates}
                onSend={handleSendConversation}
                onApproveCandidate={handleApproveCandidate}
                onRejectCandidate={handleRejectCandidate}
              />
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

            <Card className="space-y-4 p-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Goals</p>
                <h2 className="mt-1 text-lg font-semibold">目的とマイルストーン</h2>
                <p className="text-sm text-muted-foreground">
                  目的を置くと、YUI Today の現在地と次の一歩が安定して見えるようになります。
                </p>
              </div>

              <form onSubmit={handleSaveGoal} className="space-y-3 rounded-3xl border border-border bg-muted/20 p-4">
                <input
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

              <form
                onSubmit={handleSaveMilestone}
                className="space-y-3 rounded-3xl border border-border bg-background p-4"
              >
                <select
                  value={milestoneForm.goal_id}
                  onChange={(event) =>
                    setMilestoneForm((current) => ({ ...current, goal_id: event.target.value }))
                  }
                  className="yohaku-input"
                >
                  <option value="">目的を選ぶ</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
                <input
                  value={milestoneForm.title}
                  onChange={(event) =>
                    setMilestoneForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="マイルストーン"
                  className="yohaku-input"
                />
                <select
                  value={milestoneForm.status}
                  onChange={(event) =>
                    setMilestoneForm((current) => ({ ...current, status: event.target.value }))
                  }
                  className="yohaku-input"
                >
                  <option value="pending">pending</option>
                  <option value="completed">completed</option>
                </select>
                <button
                  type="submit"
                  disabled={isSavingMilestone || goals.length === 0}
                  className="yohaku-btn"
                >
                  {isSavingMilestone ? "保存中..." : "マイルストーンを追加"}
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
                        <p className="text-sm font-medium">{goal.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {goal.status} / {goal.progress}%
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    次のマイルストーン
                  </p>
                  {milestones.length === 0 ? (
                    <p className="text-sm text-muted-foreground">まだマイルストーンはありません。</p>
                  ) : (
                    milestones.slice(0, 3).map((milestone) => (
                      <div key={milestone.id} className="rounded-2xl border border-border bg-background px-3 py-2">
                        <p className="text-sm leading-6">{milestone.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{milestone.status}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>

          </div>
        </section>
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
