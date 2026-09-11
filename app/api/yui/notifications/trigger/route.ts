import { NextResponse } from "next/server";
import { triggerNotificationDeliveryForUser } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const type = body.type === "evening" ? "evening" : "morning";

    const log = await triggerNotificationDeliveryForUser(type);
    return NextResponse.json(
      log
        ? { success: true, log }
        : { success: false, log: null, error: "自動ブリーフはPremiumで利用できます。" },
      { status: log ? 200 : 403 },
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Failed to trigger notification delivery";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
