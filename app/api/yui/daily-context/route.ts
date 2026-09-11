import { NextResponse } from "next/server";
import { requireYuiSession } from "@/app/ui/backend/yui/api";
import { getDailyContext } from "@/app/ui/backend/yui/daily_context_service";
import { getNotificationSettings } from "@/app/ui/backend/yui/notification_service";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const session = await requireYuiSession();
    const settings = await getNotificationSettings(session.user.id);
    const contextData = await getDailyContext(session.user.id, { timeZone: settings.timezone });
    return NextResponse.json(contextData);
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Failed to fetch YUI daily context";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
