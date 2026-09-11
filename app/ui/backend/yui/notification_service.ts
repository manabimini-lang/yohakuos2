import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop: keyof SupabaseClient) {
    const target = getSupabaseAdmin();
    const value = target[prop];
    return typeof value === "function" ? value.bind(target) : value;
  },
});
import type { YuiNotificationPreferences } from "./models";
import { normalizeTimeZone } from "./timezone";

function normalizeClockTime(value: unknown, fallback: string): string {
  const text = String(value ?? "").trim();
  const match = /^(\d{2}):(\d{2})$/.exec(text);
  if (!match) return fallback;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 ? text : fallback;
}

// The development auth store creates synthetic `dev-*` users that do not exist
// in the production users table. Keep notification preferences in memory for
// those users so the local UI remains testable without writing invalid FK rows.
const devNotificationSettings = new Map<string, YuiNotificationPreferences>();

type DbNotificationSettings = {
  id: string;
  user_id: string;
  enabled: boolean;
  morning_enabled: boolean;
  morning_time: string;
  evening_enabled: boolean;
  evening_time: string;
  notification_level?: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
};

function mapFromDb(db: DbNotificationSettings): YuiNotificationPreferences {
  return {
    id: db.id,
    userId: db.user_id,
    enabled: db.enabled,
    morningEnabled: db.morning_enabled,
    morningTime: normalizeClockTime(db.morning_time, "07:00"),
    eveningEnabled: db.evening_enabled,
    eveningTime: normalizeClockTime(db.evening_time, "20:00"),
    notificationLevel: db.notification_level === "light" ? "light" : "standard",
    timezone: normalizeTimeZone(db.timezone),
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export async function createDefaultNotificationSettings(
  userId: string,
): Promise<YuiNotificationPreferences> {
  const { data, error } = await supabaseAdmin
    .from("yui_notification_settings")
    .insert({
      user_id: userId,
      enabled: false,
      morning_enabled: false,
      morning_time: "07:00",
      evening_enabled: false,
      evening_time: "20:00",
      notification_level: "standard",
      timezone: "Asia/Tokyo",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapFromDb(data as DbNotificationSettings);
}

export async function getNotificationSettings(
  userId: string,
): Promise<YuiNotificationPreferences> {
  if (userId.startsWith("dev-")) {
    const existing = devNotificationSettings.get(userId);
    if (existing) return existing;
    const now = new Date().toISOString();
    const defaults: YuiNotificationPreferences = {
      id: `dev-notification-settings-${userId}`,
      userId,
      enabled: false,
      morningEnabled: false,
      morningTime: "07:00",
      eveningEnabled: false,
      eveningTime: "20:00",
      notificationLevel: "standard",
      timezone: "Asia/Tokyo",
      createdAt: now,
      updatedAt: now,
    };
    devNotificationSettings.set(userId, defaults);
    return defaults;
  }

  const { data, error } = await supabaseAdmin
    .from("yui_notification_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return createDefaultNotificationSettings(userId);
  }

  return mapFromDb(data as DbNotificationSettings);
}

export async function saveNotificationSettings(
  userId: string,
  input: Partial<YuiNotificationPreferences>,
): Promise<YuiNotificationPreferences> {
  const existing = await getNotificationSettings(userId);

  const updates: Partial<DbNotificationSettings> = {};

  if (typeof input.enabled === "boolean") updates.enabled = input.enabled;
  if (typeof input.morningEnabled === "boolean") updates.morning_enabled = input.morningEnabled;
  if (typeof input.morningTime === "string") updates.morning_time = normalizeClockTime(input.morningTime, existing.morningTime);
  if (typeof input.eveningEnabled === "boolean") updates.evening_enabled = input.eveningEnabled;
  if (typeof input.eveningTime === "string") updates.evening_time = normalizeClockTime(input.eveningTime, existing.eveningTime);
  if (input.notificationLevel === "light" || input.notificationLevel === "standard") updates.notification_level = input.notificationLevel;
  if (typeof input.timezone === "string") updates.timezone = normalizeTimeZone(input.timezone, existing.timezone);

  if (userId.startsWith("dev-")) {
    const updated: YuiNotificationPreferences = {
      ...existing,
      enabled: updates.enabled ?? existing.enabled,
      morningEnabled: updates.morning_enabled ?? existing.morningEnabled,
      morningTime: updates.morning_time ?? existing.morningTime,
      eveningEnabled: updates.evening_enabled ?? existing.eveningEnabled,
      eveningTime: updates.evening_time ?? existing.eveningTime,
      notificationLevel: updates.notification_level === "light" ? "light" : updates.notification_level === "standard" ? "standard" : existing.notificationLevel,
      timezone: updates.timezone ?? existing.timezone,
      updatedAt: new Date().toISOString(),
    };
    devNotificationSettings.set(userId, updated);
    return updated;
  }

  const { data, error } = await supabaseAdmin
    .from("yui_notification_settings")
    .update(updates)
    .eq("user_id", userId)
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapFromDb(data as DbNotificationSettings);
}
