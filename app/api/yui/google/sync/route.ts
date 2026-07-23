import { NextResponse } from "next/server";
import { syncGoogleCalendarForUser } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await syncGoogleCalendarForUser();
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Failed to sync Google Calendar";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
