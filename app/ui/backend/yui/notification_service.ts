import { supabaseAdmin } from "@/lib/supabase/admin";
import type { YuiNotificationPreferences } from "./models";

type DbNotificationSettings = {
  id: string;
  user_id: string;
  enabled: boolean;
  morning_enabled: boolean;
  morning_time: string;
  evening_enabled: boolean;
  evening_time: string;
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
    morningTime: db.morning_time,
    eveningEnabled: db.evening_enabled,
    eveningTime: db.evening_time,
    timezone: db.timezone,
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
      enabled: true,
      morning_enabled: true,
      morning_time: "07:00",
      evening_enabled: false,
      evening_time: "20:00",
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
  if (typeof input.morningTime === "string") updates.morning_time = input.morningTime.trim() || "07:00";
  if (typeof input.eveningEnabled === "boolean") updates.evening_enabled = input.eveningEnabled;
  if (typeof input.eveningTime === "string") updates.evening_time = input.eveningTime.trim() || "20:00";
  if (typeof input.timezone === "string") updates.timezone = input.timezone.trim() || "Asia/Tokyo";

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
