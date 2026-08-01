import type { YuiCalendarEvent, YuiConversation, YuiGoal, YuiReflection } from "./models";
import { getGmailInsights } from "./gmail_service";
import { getUnifiedActions, type YuiUnifiedAction } from "./unified_action_service";
import { listYuiCalendarEvents, listYuiConversations, listYuiGoals, listYuiReflections } from "./service";

export type YuiPriorityItem = {
  id: string;
  title: string;
  score: number;
  why: string;
  actionType: string;
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function summarizeReason(action: YuiUnifiedAction, context: {
  calendarEvents: YuiCalendarEvent[];
  conversations: YuiConversation[];
  goals: YuiGoal[];
  reflections: YuiReflection[];
}) {
  const reasons: string[] = [];
  if (action.priority === "high") {
    reasons.push("緊急度が高い");
  } else {
    reasons.push("優先順位は中程度");
  }

  if (action.actionType === "reply_email") {
    reasons.push("未返信メールが残っている");
  }
  if (action.actionType === "create_timeblock") {
    reasons.push("期限付きの対応が必要");
  }
  if (action.actionType === "schedule_meeting") {
    reasons.push("会議との整合が必要");
  }

  const matchingGoal = context.goals.find((goal) => {
    const haystack = `${goal.title} ${goal.description ?? ""}`.toLowerCase();
    return haystack.includes(action.title.toLowerCase()) || haystack.includes(action.description.toLowerCase());
  });
  if (matchingGoal) {
    reasons.push(`Goal「${matchingGoal.title}」と関連`);
  }

  const recentConversation = context.conversations.find((conversation) => {
    const haystack = `${conversation.content ?? ""}`.toLowerCase();
    return haystack.includes(action.title.toLowerCase()) || haystack.includes(action.description.toLowerCase());
  });
  if (recentConversation) {
    reasons.push("会話の流れを継続する必要がある");
  }

  if (context.reflections.length > 0) {
    reasons.push("直近の振り返りと整合している");
  }

  return reasons.join("・");
}

export async function buildPriorityContext(userId: string): Promise<YuiPriorityItem[]> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [calendarEvents, gmailInsights, goals, reflections, conversations, unifiedActions] = await Promise.all([
    listYuiCalendarEvents(userId, { start: startOfDay, end: endOfDay, limit: 50 }),
    getGmailInsights(userId).catch(() => []),
    listYuiGoals(userId, 10),
    listYuiReflections(userId, 5),
    listYuiConversations(userId, 20),
    getUnifiedActions(userId).catch(() => []),
  ]);

  const candidates: YuiPriorityItem[] = [];

  for (const action of unifiedActions.slice(0, 5)) {
    const baseWeight = action.priority === "high" ? 40 : action.priority === "medium" ? 26 : 14;
    const urgencyBoost = action.actionType === "reply_email" ? 18 : action.actionType === "create_timeblock" ? 16 : 10;
    const goalBoost = goals.some((goal) => {
      const haystack = `${goal.title} ${goal.description ?? ""}`.toLowerCase();
      return haystack.includes(action.title.toLowerCase()) || haystack.includes(action.description.toLowerCase());
    })
      ? 12
      : 0;
    const continuityBoost = conversations.some((conversation) => {
      const haystack = `${conversation.content ?? ""}`.toLowerCase();
      return haystack.includes(action.title.toLowerCase()) || haystack.includes(action.description.toLowerCase());
    })
      ? 10
      : 0;
    const reflectionBoost = reflections.length > 0 ? 8 : 0;
    const emailBoost = gmailInsights.length > 0 ? 6 : 0;
    const score = clampScore(baseWeight + urgencyBoost + goalBoost + continuityBoost + reflectionBoost + emailBoost);

    candidates.push({
      id: action.id,
      title: action.title,
      score,
      why: summarizeReason(action, { calendarEvents, conversations, goals, reflections }),
      actionType: action.actionType,
    });
  }

  if (candidates.length === 0) {
    const activeGoal = goals.find((goal) => goal.status === "active");
    if (activeGoal) {
      candidates.push({
        id: `goal_${activeGoal.id}`,
        title: `${activeGoal.title} を進める`,
        score: 72,
        why: `Goal「${activeGoal.title}」が進行中で、今すぐ着手すると効果的です。`,
        actionType: "create_goal",
      });
    }
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, 3);
}
