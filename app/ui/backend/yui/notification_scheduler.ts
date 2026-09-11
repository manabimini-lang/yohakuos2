import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop: keyof SupabaseClient) {
    const target = getSupabaseAdmin();
    const value = target[prop];
    return typeof value === "function" ? value.bind(target) : value;
  },
});
import { getNotificationSettings } from "./notification_service";
import { generateNotificationPreview } from "./notification_delivery_service";
import { defaultNotificationProvider, NotificationProvider } from "./notification_provider";
import type { YuiNotificationLog, YuiNotificationDeliveryStatus } from "./models";
import { prisma } from "@/lib/prisma";
import { hasPremiumAccess } from "@/lib/constants/plan";
import { getMinuteOfDayInZone, getZonedDayWindow } from "./timezone";

async function canUseAutomaticBriefs(userId: string): Promise<boolean> {
  if (process.env.NODE_ENV !== "production" && userId.startsWith("dev-")) {
    return true;
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true },
  });
  return hasPremiumAccess(user?.plan, user?.role);
}

async function refreshConnectedSources(userId: string): Promise<void> {
  try {
    const { syncGoogleCalendarEvents } = await import("./google_calendar_service");
    await syncGoogleCalendarEvents(userId);
  } catch (error) {
    console.info("[YUI Notification] Calendar sync skipped", {
      userId,
      reason: error instanceof Error ? error.message : "unknown",
    });
  }

  try {
    const { syncGmailMessages } = await import("./gmail_service");
    await syncGmailMessages(userId);
  } catch (error) {
    console.info("[YUI Notification] Gmail sync skipped", {
      userId,
      reason: error instanceof Error ? error.message : "unknown",
    });
  }
}

export async function logNotificationDelivery(input: {
  userId: string;
  type: "morning" | "evening";
  title: string;
  body: string;
  provider: string;
  status: string;
}): Promise<YuiNotificationLog> {
  const { data, error } = await supabaseAdmin
    .from("yui_notification_logs")
    .insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      provider: input.provider,
      status: input.status,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as YuiNotificationLog;
}

export async function listNotificationLogs(
  userId: string,
  limit = 20
): Promise<YuiNotificationLog[]> {
  const { data, error } = await supabaseAdmin
    .from("yui_notification_logs")
    .select("*")
    .eq("user_id", userId)
    .order("delivered_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data || []) as YuiNotificationLog[];
}

export async function deliverNotification(
  userId: string,
  type: "morning" | "evening",
  provider: NotificationProvider = defaultNotificationProvider,
  options: { manual?: boolean } = {},
): Promise<YuiNotificationLog | null> {
  if (!(await canUseAutomaticBriefs(userId))) {
    return null;
  }

  const settings = await getNotificationSettings(userId);
  if (!settings.enabled && !options.manual) {
    return null;
  }
  if (settings.notificationLevel === "light" && type === "evening" && !options.manual) {
    return null;
  }

  await refreshConnectedSources(userId);
  const preview = await generateNotificationPreview(userId, type, { timeZone: settings.timezone });

  const result = await provider.sendNotification(userId, preview.title, preview.message, type);

  if (result.success) {
    return logNotificationDelivery({
      userId,
      type,
      title: preview.title,
      body: preview.message,
      provider: result.provider,
      status: "delivered",
    });
  }

  return null;
}

export async function getNotificationDeliveryStatus(
  userId: string
): Promise<YuiNotificationDeliveryStatus> {
  const settings = await getNotificationSettings(userId);
  const logs = await listNotificationLogs(userId, 20);
  const automaticBriefsAvailable = await canUseAutomaticBriefs(userId);

  const now = new Date();
  const { start: startOfDay, end: endOfDay } = getZonedDayWindow(now, settings.timezone);

  const todayMorningLog = logs.find((l) => {
    const t = new Date(l.delivered_at).getTime();
    return l.type === "morning" && t >= startOfDay.getTime() && t < endOfDay.getTime();
  });

  const todayEveningLog = logs.find((l) => {
    const t = new Date(l.delivered_at).getTime();
    return l.type === "evening" && t >= startOfDay.getTime() && t < endOfDay.getTime();
  });

  const toPreview = (log: YuiNotificationLog | undefined) => log
    ? {
        type: log.type,
        title: log.title,
        message: log.body,
        generatedAt: log.delivered_at,
      }
    : null;

  const lastLog = logs[0] || null;

  // Calculate next delivery time estimate
  let nextDeliveryTime: string | null = null;
  if (automaticBriefsAvailable && settings.enabled) {
    const configuredMinutes = (value: string) => {
      const [hour, minute] = value.split(":").map(Number);
      return (hour || 0) * 60 + (minute || 0);
    };
    const nowMinutes = getMinuteOfDayInZone(now, settings.timezone);
    if (settings.morningEnabled && nowMinutes < configuredMinutes(settings.morningTime) + 60 && !todayMorningLog) {
      nextDeliveryTime = `本日 ${settings.morningTime}頃`;
    } else if (settings.eveningEnabled && settings.notificationLevel !== "light" && nowMinutes < configuredMinutes(settings.eveningTime) + 60 && !todayEveningLog) {
      nextDeliveryTime = `本日 ${settings.eveningTime}頃`;
    } else if (settings.morningEnabled) {
      nextDeliveryTime = `明日 ${settings.morningTime}頃`;
    } else if (settings.eveningEnabled && settings.notificationLevel !== "light") {
      nextDeliveryTime = `明日 ${settings.eveningTime}頃`;
    }
  }

  return {
    enabled: settings.enabled,
    morningTime: settings.morningTime,
    eveningTime: settings.eveningTime,
    timezone: settings.timezone || "Asia/Tokyo",
    lastDeliveredAt: lastLog ? lastLog.delivered_at : null,
    lastDeliveredType: lastLog ? lastLog.type : null,
    nextDeliveryTime,
    isTodayMorningDelivered: Boolean(todayMorningLog),
    isTodayEveningDelivered: Boolean(todayEveningLog),
    todayMorningNotification: toPreview(todayMorningLog),
    todayEveningNotification: toPreview(todayEveningLog),
    automaticBriefsAvailable,
  };
}
