import { NextResponse } from "next/server";
import { getNotificationDeliveryStatusForUser } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getNotificationDeliveryStatusForUser();
    return NextResponse.json(status);
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Failed to fetch notification delivery status";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
