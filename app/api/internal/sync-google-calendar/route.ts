import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { syncGoogleCalendarEvents } from "@/app/ui/backend/yui/google_calendar_service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const actual = Buffer.from(request.headers.get("Authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && actual.length > 0 && crypto.timingSafeEqual(actual, expected);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return new NextResponse("Unauthorized", { status: 401 });

  const { data: connections, error } = await getSupabaseAdmin()
    .from("connections")
    .select("user_id")
    .eq("provider", "google_calendar")
    .eq("status", "connected")
    .order("updated_at", { ascending: true })
    .limit(25);
  if (error) return NextResponse.json({ error: "Google Calendar接続を取得できませんでした。" }, { status: 500 });

  const synced: string[] = [];
  const failed: string[] = [];
  for (const connection of connections ?? []) {
    try {
      await syncGoogleCalendarEvents(connection.user_id);
      synced.push(connection.user_id);
    } catch (error) {
      console.info("[Google Calendar Cron] Sync failed", {
        userId: connection.user_id,
        reason: error instanceof Error ? error.message : "unknown",
      });
      failed.push(connection.user_id);
    }
  }

  return NextResponse.json({ ok: true, synced: synced.length, failed: failed.length, checkedAt: new Date().toISOString() });
}
