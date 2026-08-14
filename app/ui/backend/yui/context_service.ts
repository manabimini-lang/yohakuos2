import {
  listYuiGoals,
  listYuiMilestones,
  listYuiDecisions,
  listYuiMemories,
  listYuiReflections,
  listYuiEvents,
  listYuiCalendarEvents,
  getYuiProfile,
} from "./service";
import type {
  YuiGoal,
  YuiDecision,
  YuiReflection,
  YuiEvent,
  YuiCalendarEvent,
} from "./models";

export type YuiContextSummary = {
  priority: string;
  priorityScore: number;
  reason: string;
  nextAction: string;
  relatedGoalId?: string;
};

export async function computeYuiContext(userId: string): Promise<YuiContextSummary> {
  const [
    goals,
    milestones,
    decisions,
    memories,
    reflections,
    events,
    calendarEvents,
    profile,
  ] = await Promise.all([
    listYuiGoals(userId, 20),
    listYuiMilestones(userId, undefined, 50),
    listYuiDecisions(userId, 20),
    listYuiMemories(userId, 20),
    listYuiReflections(userId, 10),
    listYuiEvents(userId, 30),
    listYuiCalendarEvents(userId, { limit: 30 }),
    getYuiProfile(userId),
  ]);

  const activeGoals = goals.filter((g) => g.status === "active");

  if (activeGoals.length === 0) {
    const focusArea = profile?.focus_area?.trim() || profile?.life_theme?.trim();
    if (focusArea) {
      return {
        priority: focusArea,
        priorityScore: 50,
        reason: "現在設定されているアクティブな Goal がないため、プロフィールに記載されたテーマを重視しています。",
        nextAction: "具体的な Goal（目標）を設定し、ロードマップを明確にしましょう。",
      };
    }

    return {
      priority: "目標の設定と方向性の整理",
      priorityScore: 30,
      reason: "現在アクティブな Goal が設定されていません。",
      nextAction: "YUI との会話または目標一覧から、今最も注力したい Goal を登録しましょう。",
    };
  }

  // Rank active goals by calculated priority score
  const now = Date.now();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  const scoredGoals = activeGoals.map((goal) => {
    let score = 50;

    // 1. Lower progress = slightly higher score needed for boost
    if (goal.progress < 50) {
      score += 15;
    } else if (goal.progress >= 90) {
      score -= 20;
    }

    // 2. Check related decisions
    const goalDecisions = decisions.filter(
      (d) =>
        d.question.includes(goal.title) ||
        d.context.includes(goal.title) ||
        d.decision.includes(goal.title) ||
        d.rationale.includes(goal.title),
    );

    const hasRecentDecision = goalDecisions.some(
      (d) => now - new Date(d.created_at).getTime() < ONE_WEEK_MS,
    );

    if (hasRecentDecision) {
      score += 25;
    }

    // 3. Check recent progress events (events / calendar blocks)
    const goalEvents = events.filter(
      (e) =>
        e.title.includes(goal.title) ||
        e.content.includes(goal.title) ||
        (now - new Date(e.occurred_at).getTime() < ONE_WEEK_MS),
    );

    const goalCalendarEvents = calendarEvents.filter(
      (ce) =>
        (ce.title && ce.title.includes(goal.title)) ||
        (ce.description && ce.description.includes(goal.title)),
    );

    // If goal has recent decision but low recent activity -> priority score increases
    const hasRecentActivity =
      goalEvents.some((e) => now - new Date(e.occurred_at).getTime() < ONE_WEEK_MS) ||
      goalCalendarEvents.some(
        (ce) => now - new Date(ce.start_at).getTime() < ONE_WEEK_MS,
      );

    if (hasRecentDecision && !hasRecentActivity) {
      score += 20; // High gap between decision and activity
    }

    if (!hasRecentActivity && goal.progress < 80) {
      score += 10;
    }

    const goalMilestones = milestones.filter((m) => m.goal_id === goal.id);
    const pendingMilestones = goalMilestones.filter((m) => m.status === "pending");

    return {
      goal,
      score,
      hasRecentDecision,
      hasRecentActivity,
      goalDecisions,
      pendingMilestones,
    };
  });

  // Sort descending by score
  scoredGoals.sort((a, b) => b.score - a.score);

  const top = scoredGoals[0];
  const topGoal = top.goal;

  // Build Secretary response reason & next action
  let reason = `${topGoal.title} が現在の最優先Goalです。`;
  let nextAction = "90分の集中・設計時間を確保しましょう。";

  // Check today's calendar busy state
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todayEventsCount = calendarEvents.filter((ce) => {
    const t = new Date(ce.start_at).getTime();
    return t >= startOfDay.getTime() && t <= endOfDay.getTime();
  }).length;

  if (top.hasRecentDecision && !top.hasRecentActivity) {
    reason = `${topGoal.title} に関する意志決定が行われていますが、今週の進捗イベントや予定の確保がまだ確認できません。`;
    if (todayEventsCount >= 3) {
      reason += `（本日は既に${todayEventsCount}件の予定が入っています）`;
      nextAction = `本日は予定が多いため、夕方以降に60分〜90分の集中時間を確保することをおすすめします。`;
    } else if (top.pendingMilestones.length > 0) {
      nextAction = `マイルストーン「${top.pendingMilestones[0].title}」を着手するための時間をカレンダーに確保しましょう。`;
    } else {
      nextAction = "まずは90分の設計・作業時間を確保しましょう。";
    }
  } else if (!top.hasRecentActivity) {
    reason = `直近で ${topGoal.title} に関連する行動やログが少なくなっています。`;
    if (todayEventsCount >= 3) {
      reason += ` 本日は${todayEventsCount}件の予定が入っています。`;
      nextAction = "予定の合間または夕方以降に集中時間を確保しましょう。";
    } else {
      nextAction = "本日のブロックまたはスケジュールを提案し、時間を確保しましょう。";
    }
  } else {
    reason = `${topGoal.title} は順調に進展中ですが、引き続き優先的なリソース確保を推奨します。`;
    if (todayEventsCount >= 4) {
      reason += `（本日は予定が${todayEventsCount}件あります）`;
    }
    if (top.pendingMilestones.length > 0) {
      nextAction = `次なるマイルストーン「${top.pendingMilestones[0].title}」の達成を目指しましょう。`;
    } else {
      nextAction = "今週の進捗を振り返り、次のタスクを定義しましょう。";
    }
  }

  return {
    priority: topGoal.title,
    priorityScore: Math.min(100, Math.max(0, top.score)),
    reason,
    nextAction,
    relatedGoalId: topGoal.id,
  };
}
