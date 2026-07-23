import { supabaseAdmin } from "@/lib/supabase/admin";
import { getNotificationSettings } from "./notification_service";
import { generateNotificationPreviews } from "./notification_delivery_service";
import { defaultNotificationProvider, NotificationProvider } from "./notification_provider";
import type { YuiNotificationLog, YuiNotificationDeliveryStatus } from "./models";

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
  provider: NotificationProvider = defaultNotificationProvider
): Promise<YuiNotificationLog | null> {
  const settings = await getNotificationSettings(userId);
  if (!settings.enabled) {
    return null;
  }

  const previews = await generateNotificationPreviews(userId);
  const preview = type === "morning" ? previews.morning : previews.evening;

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

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const todayMorningLog = logs.find((l) => {
    const t = new Date(l.delivered_at).getTime();
    return l.type === "morning" && t >= startOfDay.getTime() && t <= endOfDay.getTime();
  });

  const todayEveningLog = logs.find((l) => {
    const t = new Date(l.delivered_at).getTime();
    return l.type === "evening" && t >= startOfDay.getTime() && t <= endOfDay.getTime();
  });

  const lastLog = logs[0] || null;

  // Calculate next delivery time estimate
  let nextDeliveryTime: string | null = null;
  if (settings.enabled) {
    const [morningH, morningM] = settings.morningTime.split(":").map(Number);
    const [eveningH, eveningM] = settings.eveningTime.split(":").map(Number);

    const morningToday = new Date(now);
    morningToday.setHours(morningH || 7, morningM || 30, 0, 0);

    const eveningToday = new Date(now);
    eveningToday.setHours(eveningH || 21, eveningM || 0, 0, 0);

    if (now.getTime() < morningToday.getTime() && !todayMorningLog) {
      nextDeliveryTime = `本日 ${settings.morningTime}`;
    } else if (now.getTime() < eveningToday.getTime() && !todayEveningLog) {
      nextDeliveryTime = `本日 ${settings.eveningTime}`;
    } else {
      nextDeliveryTime = `明日 ${settings.morningTime}`;
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
  };
}
