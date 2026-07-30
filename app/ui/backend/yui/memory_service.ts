import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop: keyof SupabaseClient) {
    const target = getSupabaseAdmin();
    const value = target[prop];
    return typeof value === "function" ? value.bind(target) : value;
  },
});
import {
  listYuiCalendarEvents,
  listYuiReflections,
  listYuiConversations,
  listYuiEvents,
} from "./service";
import { getNotificationDeliveryStatus } from "./notification_scheduler";
import type { YuiMemoryProfile } from "./models";

export async function upsertYuiMemoryProfile(input: {
  userId: string;
  memoryKey: string;
  memoryValue: string;
  confidence?: number;
}): Promise<YuiMemoryProfile> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("yui_memory_profiles")
    .upsert(
      {
        user_id: input.userId,
        memory_key: input.memoryKey,
        memory_value: input.memoryValue,
        confidence: input.confidence ?? 1.0,
        last_observed_at: now,
        updated_at: now,
      },
      { onConflict: "user_id,memory_key" }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as YuiMemoryProfile;
}

export async function getYuiMemoryProfiles(userId: string): Promise<YuiMemoryProfile[]> {
  const { data, error } = await supabaseAdmin
    .from("yui_memory_profiles")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data || []) as YuiMemoryProfile[];
}

export async function analyzeYuiMemoryProfiles(userId: string): Promise<YuiMemoryProfile[]> {
  const [calendarEvents, reflections, conversations, events, deliveryStatus] =
    await Promise.all([
      listYuiCalendarEvents(userId, { limit: 100 }),
      listYuiReflections(userId, 20),
      listYuiConversations(userId, 30),
      listYuiEvents(userId, 50),
      getNotificationDeliveryStatus(userId),
    ]);

  const profiles: YuiMemoryProfile[] = [];

  // 1. Analyze Preferred Focus Duration (Default: 90分)
  let preferredDuration = "90";
  if (calendarEvents.length > 0) {
    let totalMinutes = 0;
    let count = 0;
    for (const event of calendarEvents) {
      if (event.start_at && event.end_at) {
        const start = new Date(event.start_at).getTime();
        const end = new Date(event.end_at).getTime();
        const diff = (end - start) / (1000 * 60);
        if (diff > 0 && diff <= 240) {
          totalMinutes += diff;
          count++;
        }
      }
    }
    if (count > 0) {
      const avg = Math.round(totalMinutes / count);
      if (avg >= 75 && avg <= 110) {
        preferredDuration = "90";
      } else if (avg < 75) {
        preferredDuration = "60";
      } else {
        preferredDuration = "120";
      }
    }
  }
  const p1 = await upsertYuiMemoryProfile({
    userId,
    memoryKey: "preferred_focus_duration",
    memoryValue: `${preferredDuration}分`,
    confidence: 0.9,
  });
  profiles.push(p1);

  // 2. Analyze Busy Weekday
  const dayNames = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const event of calendarEvents) {
    if (event.start_at) {
      const d = new Date(event.start_at).getDay();
      dayCounts[d]++;
    }
  }
  let maxDayIndex = 2; // Default: 火曜日
  let maxDayCount = -1;
  for (let i = 0; i < 7; i++) {
    if (dayCounts[i] > maxDayCount) {
      maxDayCount = dayCounts[i];
      maxDayIndex = i;
    }
  }
  const busyWeekdayName = dayNames[maxDayIndex];
  const p2 = await upsertYuiMemoryProfile({
    userId,
    memoryKey: "busy_weekday",
    memoryValue: busyWeekdayName,
    confidence: 0.85,
  });
  profiles.push(p2);

  // 3. Analyze Preferred Work Period (午前 / 午後)
  let morningCount = 0;
  let afternoonCount = 0;
  for (const event of calendarEvents) {
    if (event.start_at) {
      const hour = new Date(event.start_at).getHours();
      if (hour >= 5 && hour < 12) morningCount++;
      else if (hour >= 12 && hour < 19) afternoonCount++;
    }
  }
  const preferredPeriod = morningCount >= afternoonCount ? "午前" : "午後";
  const p3 = await upsertYuiMemoryProfile({
    userId,
    memoryKey: "preferred_work_period",
    memoryValue: preferredPeriod,
    confidence: 0.8,
  });
  profiles.push(p3);

  // 4. Analyze Notification Open Time
  const morningTime = deliveryStatus.morningTime || "07:30";
  const p4 = await upsertYuiMemoryProfile({
    userId,
    memoryKey: "notification_open_time",
    memoryValue: `${morningTime}頃`,
    confidence: 0.95,
  });
  profiles.push(p4);

  // 5. Analyze Reflection Frequency
  const refFreq = reflections.length >= 5 ? "高頻度" : "標準";
  const p5 = await upsertYuiMemoryProfile({
    userId,
    memoryKey: "reflection_frequency",
    memoryValue: refFreq,
    confidence: 0.8,
  });
  profiles.push(p5);

  return profiles;
}
