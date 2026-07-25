import { getThreadInsights } from "./thread_intelligence_service";
import { getThreadProgress } from "./progress_service";
import { getTimeIntelligence } from "./time_intelligence_service";
import { listYuiGoals } from "./service";

export interface YuiPlanningSuggestion {
  thread: string;
  reason: string;
  suggestedAction: string;
  priorityScore: number;
}

export interface YuiPlanningSummary {
  suggestions: YuiPlanningSuggestion[];
}

export async function getPlanningSuggestions(userId: string): Promise<YuiPlanningSummary> {
  const [insightsResult, progressResult, timeResult, goals] = await Promise.all([
    getThreadInsights(userId),
    getThreadProgress(userId),
    getTimeIntelligence(userId),
    listYuiGoals(userId, 30),
  ]);

  const insights = insightsResult.threads;
  const progress = progressResult.threads;
  const timeData = timeResult;

  // Build lookup maps
  const insightMap = new Map(insights.map((t) => [t.thread, t]));
  const progressMap = new Map(progress.map((t) => [t.thread, t]));

  // Active goal titles for matching
  const activeGoalTitles = goals
    .filter((g) => g.status === "active" || g.status === "in_progress")
    .map((g) => g.title);

  // Total time per category (for time-gap detection)
  const categoryHoursMap = new Map(
    timeData.topCategories.map((c) => [c.category, c.totalHours]),
  );
  const avgCategoryHours =
    timeData.topCategories.length > 0
      ? timeData.totalScheduledHours / timeData.topCategories.length
      : 0;

  // ── Collect all unique threads from both sources ──
  const allThreads = new Set<string>();
  insights.forEach((t) => allThreads.add(t.thread));
  progress.forEach((t) => allThreads.add(t.thread));

  const rawSuggestions: YuiPlanningSuggestion[] = [];

  for (const thread of allThreads) {
    const insight = insightMap.get(thread);
    const prog = progressMap.get(thread);

    // Skip completed threads (Rule 4)
    if (prog?.progressStatus === "completed") continue;

    // ── Priority Score Calculation ──
    // 1. Progress status score (0-30)
    let progressScore = 0;
    if (prog?.progressStatus === "stalled") progressScore = 30;
    else if (prog?.progressStatus === "active") progressScore = 20;
    else if (prog?.progressStatus === "new") progressScore = 10;

    // 2. Thread intelligence score (0-40)
    const intelligenceScore = insight ? Math.round(insight.priorityScore * 0.4) : 0;

    // 3. Time gap score (0-20) — important thread with low time allocation
    let timeGapScore = 0;
    if (insight && insight.priorityScore >= 50) {
      // Check if this thread's related categories have low hours
      const hasLowTimeAllocation = timeData.topCategories.length === 0 || avgCategoryHours < 5;
      if (hasLowTimeAllocation) timeGapScore = 20;
      else timeGapScore = 10;
    }

    // 4. Goal score (0-20)
    const hasActiveGoal = activeGoalTitles.some((title) => title.includes(thread) || thread.includes(title));
    const goalScore = hasActiveGoal ? 20 : 0;

    const priorityScore = Math.min(progressScore + intelligenceScore + timeGapScore + goalScore, 100);

    // ── Rule Engine: Generate reason + action ──
    const { reason, suggestedAction } = applyRules(thread, prog, insight, hasActiveGoal, categoryHoursMap, avgCategoryHours);

    // Only include threads with meaningful priority
    if (priorityScore >= 20) {
      rawSuggestions.push({ thread, reason, suggestedAction, priorityScore });
    }
  }

  const suggestions = rawSuggestions
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5);

  return { suggestions };
}

function applyRules(
  thread: string,
  prog: { progressStatus: string; activeDays: number; momentumScore: number } | undefined,
  insight: { priorityScore: number; suggestedNextStep: string; relatedGoals: string[] } | undefined,
  hasActiveGoal: boolean,
  _categoryHoursMap: Map<string, number>,
  _avgCategoryHours: number,
): { reason: string; suggestedAction: string } {
  // Rule 1: STALLED + 未完了Goal → 再開候補
  if (prog?.progressStatus === "stalled" && hasActiveGoal) {
    return {
      reason: "14日以上更新なし・未完了Goalあり",
      suggestedAction: `「${thread}」を再開し、Goal進捗を確認する`,
    };
  }

  // Rule 1b: STALLED without goal → 再開候補 (lighter)
  if (prog?.progressStatus === "stalled") {
    return {
      reason: "14日以上更新なし",
      suggestedAction: `「${thread}」を再開するか判断する`,
    };
  }

  // Rule 2: 高Priority + 時間不足 → 時間確保候補
  if (insight && insight.priorityScore >= 60 && prog?.progressStatus === "active") {
    return {
      reason: "最近活動が活発・優先度が高い",
      suggestedAction: insight.suggestedNextStep || `「${thread}」に集中時間を確保する`,
    };
  }

  // Rule 3: NEW + Momentum高 → 育成候補
  if (prog?.progressStatus === "new" && prog.momentumScore >= 40) {
    return {
      reason: "新しいテーマ・勢いあり",
      suggestedAction: `「${thread}」の方向性を整理する`,
    };
  }

  // Rule 3b: NEW + low momentum
  if (prog?.progressStatus === "new") {
    return {
      reason: "新しく始まったテーマ",
      suggestedAction: `「${thread}」の目標を明確にする`,
    };
  }

  // Rule 5: Active with goal
  if (hasActiveGoal) {
    return {
      reason: "未完了Goalあり",
      suggestedAction: `「${thread}」の目標進捗を確認する`,
    };
  }

  // Default
  return {
    reason: "継続中のテーマ",
    suggestedAction: insight?.suggestedNextStep || `「${thread}」の関連情報を整理する`,
  };
}
