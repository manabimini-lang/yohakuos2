import { NextResponse } from "next/server";
import { requireYuiSession } from "@/app/ui/backend/yui/api";
import { syncGmailMessages } from "@/app/ui/backend/yui/gmail_service";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await requireYuiSession();
    const result = await syncGmailMessages(session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "";
    const unauthorized = rawMessage === "Unauthorized";
    const disconnected = rawMessage.includes("not connected") || rawMessage.includes("needs re-authentication");
    if (!unauthorized && !disconnected) {
      console.error("Gmail sync failed", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
    }
    return NextResponse.json(
      {
        error: unauthorized
          ? "Unauthorized"
          : disconnected
            ? "Googleアカウントが未接続です。設定から接続してください。"
            : "Gmailを同期できませんでした。しばらくしてから再試行してください。",
      },
      { status: unauthorized ? 401 : disconnected ? 409 : 500 },
    );
  }
}
