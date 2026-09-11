import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { deliverNotification, listNotificationLogs } from "./notification_scheduler";
import { normalizeTimeZone } from "./timezone";

function authorized(request: Request) {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const actual = Buffer.from(request.headers.get("Authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && actual.length > 0 && crypto.timingSafeEqual(actual, expected);
}

function localMinutes(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  return Number(parts.find((part) => part.type === "hour")?.value ?? 0) * 60
    + Number(parts.find((part) => part.type === "minute")?.value ?? 0);
}

function configuredMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return (hour || 0) * 60 + (minute || 0);
}

export async function processScheduledNotifications(
  request: Request,
  forcedType?: "morning" | "evening",
) {
  if (!authorized(request)) return new NextResponse("Unauthorized", { status: 401 });
  const { data: settings, error } = await getSupabaseAdmin()
    .from("yui_notification_settings")
    .select("user_id, enabled, morning_enabled, morning_time, evening_enabled, evening_time, timezone");
  if (error) return NextResponse.json({ error: "通知設定を取得できませんでした" }, { status: 500 });

  const delivered: string[] = [];
  for (const setting of settings ?? []) {
    if (!setting.enabled) continue;
    const timezone = normalizeTimeZone(setting.timezone);
    const now = localMinutes(timezone);
    const logs = await listNotificationLogs(setting.user_id, 10);
    const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
    const already = (type: "morning" | "evening") => logs.some((log) =>
      log.type === type
      && new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date(log.delivered_at)) === todayKey);
    const due: Array<"morning" | "evening"> = [];

    if (forcedType === "morning") {
      if (setting.morning_enabled && !already("morning")) due.push("morning");
    } else if (forcedType === "evening") {
      if (setting.evening_enabled && !already("evening")) due.push("evening");
    } else {
      if (setting.morning_enabled && now >= configuredMinutes(setting.morning_time) && now < configuredMinutes(setting.morning_time) + 5 && !already("morning")) due.push("morning");
      if (setting.evening_enabled && now >= configuredMinutes(setting.evening_time) && now < configuredMinutes(setting.evening_time) + 5 && !already("evening")) due.push("evening");
    }

    for (const type of due) {
      if (await deliverNotification(setting.user_id, type)) delivered.push(`${setting.user_id}:${type}`);
    }
  }

  return NextResponse.json({ ok: true, delivered, checkedAt: new Date().toISOString() });
}
