import { getThreadProgress } from "./progress_service";
import { getTimeIntelligence, getCategoryLabel } from "./time_intelligence_service";
import { getPlanningSuggestions } from "./planning_service";
import { listYuiGoals, listYuiDecisions } from "./service";

export interface YuiWeeklyReview {
  achievements: string[];
  activeThreads: string[];
  stalledThreads: string[];
  timeSummary: string;
  nextWeekFocus: string[];
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function getWeeklyReview(userId: string): Promise<YuiWeeklyReview> {
  const now = new Date();
  const nowMs = now.getTime();
  const sevenDaysAgoMs = nowMs - 7 * ONE_DAY_MS;

  const [progressResult, timeResult, planningResult, goals, decisions] = await Promise.all([
    getThreadProgress(userId),
    getTimeIntelligence(userId),
    getPlanningSuggestions(userId),
    listYuiGoals(userId, 30),
    listYuiDecisions(userId, 20),
  ]);

  // ── Achievements ──
  const achievements: string[] = [];

  // Completed goals (this week)
  goals
    .filter((g) => {
      if (g.status !== "completed") return false;
      const updMs = new Date(g.updated_at || g.created_at).getTime();
      return updMs >= sevenDaysAgoMs;
    })
    .slice(0, 3)
    .forEach((g) => achievements.push(`Goal完了: ${g.title}`));

  // Completed progress threads
  progressResult.threads
    .filter((t) => t.progressStatus === "completed")
    .slice(0, 2)
    .forEach((t) => achievements.push(`テーマ完了: ${t.thread}`));

  // Decisions made this week
  decisions
    .filter((d) => {
      const dMs = new Date(d.created_at).getTime();
      return dMs >= sevenDaysAgoMs;
    })
    .slice(0, 3)
    .forEach((d) => achievements.push(`判断: ${d.question}`));

  // Cap at 5
  const cappedAchievements = achievements.slice(0, 5);

  // ── Active Threads ──
  const activeThreads = progressResult.threads
    .filter((t) => t.progressStatus === "active")
    .sort((a, b) => b.momentumScore - a.momentumScore)
    .slice(0, 5)
    .map((t) => t.thread);

  // ── Stalled Threads ──
  const stalledThreads = progressResult.threads
    .filter((t) => t.progressStatus === "stalled")
    .slice(0, 5)
    .map((t) => t.thread);

  // ── Time Summary ──
  let timeSummary = "";
  if (timeResult.topCategories.length > 0) {
    const top3 = timeResult.topCategories.slice(0, 3);
    const parts = top3.map(
      (c) => `${getCategoryLabel(c.category)} ${c.percentage}%`,
    );
    timeSummary = `今週は ${parts.join("・")} に時間を使いました（合計 ${timeResult.totalScheduledHours}h）`;
  } else {
    timeSummary = "今週のカレンダーデータはありません";
  }

  // ── Next Week Focus ──
  const nextWeekFocus = planningResult.suggestions
    .slice(0, 3)
    .map((s) => s.thread);

  return {
    achievements: cappedAchievements,
    activeThreads,
    stalledThreads,
    timeSummary,
    nextWeekFocus,
  };
}
