import { NextResponse } from "next/server";
import { getYuiContinuity } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const continuity = await getYuiContinuity();
    return NextResponse.json(continuity);
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Failed to fetch continuity summary";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
