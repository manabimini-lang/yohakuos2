import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function recentBriefs(userId: string) {
  const { data, error } = await getSupabaseAdmin().from("yui_notification_logs")
    .select("type,body,delivered_at").eq("user_id", userId)
    .order("delivered_at", { ascending: false }).limit(4);
  if (error) return [];
  return (data ?? []).map(item => ({ type: item.type, date: item.delivered_at, text: String(item.body ?? "").slice(0, 650) }));
}
