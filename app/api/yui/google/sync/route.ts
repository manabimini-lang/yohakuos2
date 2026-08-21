import { NextResponse } from "next/server";
import { syncGoogleCalendarForUser } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await syncGoogleCalendarForUser();
    return NextResponse.json(result);
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "";
    const unauthorized = rawMessage === "Unauthorized";
    const disconnected = rawMessage.includes("not connected") || rawMessage.includes("needs re-authentication");
    const message = unauthorized
      ? "Unauthorized"
      : disconnected
        ? "Googleアカウントが未接続です。設定から接続してください。"
        : "Google Calendarを同期できませんでした。しばらくしてから再試行してください。";
    return NextResponse.json(
      { error: message },
      { status: unauthorized ? 401 : disconnected ? 409 : 500 },
    );
  }
}
