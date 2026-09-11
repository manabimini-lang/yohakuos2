import { NextResponse } from "next/server";

import { requireYuiSession } from "@/app/ui/backend/yui/api";
import { getMorningBrief } from "@/app/ui/backend/yui/brief_service";
import { getConnectionHealth } from "@/app/ui/backend/yui/connection_health_service";
import { getDailyContext } from "@/app/ui/backend/yui/daily_context_service";
import { generateNotificationPreviews } from "@/app/ui/backend/yui/notification_delivery_service";
import { getNotificationSettings } from "@/app/ui/backend/yui/notification_service";
import { getNotificationDeliveryStatus } from "@/app/ui/backend/yui/notification_scheduler";
import { listYuiRecommendations } from "@/app/ui/backend/yui/recommendation_service";
import {
  buildYuiToday,
  getLatestYuiReflection,
  getYuiProfile,
  listYuiCalendarActions,
  listYuiConversations,
  listYuiDecisions,
  listYuiGoals,
  listYuiMemories,
  listYuiMemoryCandidates,
  listYuiMilestones,
  listYuiReflections,
  listYuiSuggestedTimeBlocks,
} from "@/app/ui/backend/yui/service";
import { getUnifiedActions } from "@/app/ui/backend/yui/unified_action_service";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type DashboardTask = {
  key: string;
  run: () => Promise<unknown>;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "取得に失敗しました";
}

export async function GET() {
  const requestStartedAt = performance.now();
  try {
    // Authenticate once for the whole dashboard. Previously every dashboard
    // section made its own HTTP request and repeated middleware/auth work.
    const session = await requireYuiSession();
    const userId = session.user.id;
    const authDuration = performance.now() - requestStartedAt;

    // Share the notification settings lookup between all time-zone-aware
    // dashboard calculations instead of reading it three times.
    const settingsPromise = getNotificationSettings(userId);

    const tasks: DashboardTask[] = [
      { key: "today", run: () => buildYuiToday(userId) },
      {
        key: "morningBrief",
        run: async () => {
          const settings = await settingsPromise;
          return getMorningBrief(userId, { useAi: false, timeZone: settings.timezone });
        },
      },
      {
        key: "dailyContext",
        run: async () => {
          const settings = await settingsPromise;
          return getDailyContext(userId, { timeZone: settings.timezone });
        },
      },
      { key: "unifiedActions", run: () => getUnifiedActions(userId) },
      { key: "googleHealth", run: async () => (await getConnectionHealth(userId)).google ?? null },
      { key: "profile", run: () => getYuiProfile(userId) },
      { key: "memories", run: () => listYuiMemories(userId, 20) },
      { key: "memoryCandidates", run: () => listYuiMemoryCandidates(userId, "pending", 10) },
      { key: "conversations", run: () => listYuiConversations(userId, 50) },
      { key: "decisions", run: () => listYuiDecisions(userId, 20) },
      { key: "goals", run: () => listYuiGoals(userId, 20) },
      { key: "milestones", run: () => listYuiMilestones(userId, undefined, 50) },
      { key: "reflections", run: () => listYuiReflections(userId, 20) },
      { key: "recommendations", run: () => listYuiRecommendations(userId, { limit: 20 }) },
      { key: "timeBlocks", run: () => listYuiSuggestedTimeBlocks(userId, { limit: 20 }) },
      { key: "calendarActions", run: () => listYuiCalendarActions(userId, { limit: 20 }) },
      { key: "latestReflection", run: () => getLatestYuiReflection(userId) },
      { key: "deliveryStatus", run: () => getNotificationDeliveryStatus(userId) },
      {
        key: "notificationPreviews",
        run: async () => {
          const settings = await settingsPromise;
          return generateNotificationPreviews(userId, { timeZone: settings.timezone });
        },
      },
    ];

    const timings = new Map<string, number>();
    const settled = await Promise.allSettled(tasks.map(async (task) => {
      const startedAt = performance.now();
      try {
        return await task.run();
      } finally {
        timings.set(task.key, performance.now() - startedAt);
      }
    }));
    const data: Record<string, unknown> = {};
    const errors: Record<string, string> = {};

    settled.forEach((result, index) => {
      const key = tasks[index].key;
      if (result.status === "fulfilled") {
        data[key] = result.value;
      } else {
        errors[key] = errorMessage(result.reason);
      }
    });

    const serverTiming = [
      `total;dur=${Math.round(performance.now() - requestStartedAt)}`,
      `auth;dur=${Math.round(authDuration)}`,
      ...tasks.map((task) => `${task.key};dur=${Math.round(timings.get(task.key) ?? 0)}`),
    ].join(", ");

    return NextResponse.json(
      { data, errors },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          "Server-Timing": serverTiming,
        },
      },
    );
  } catch (error) {
    const message = errorMessage(error);
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
