import { NextResponse } from "next/server";
import { getYuiCalendarActions, postYuiCalendarAction } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "20") || 20, 100);
    const status = searchParams.get("status") ?? undefined;
    const calendarActions = await getYuiCalendarActions(status, limit);
    return NextResponse.json({ calendarActions });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : "Failed to fetch YUI calendar actions";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!body?.time_block_id) {
      return NextResponse.json({ error: "time_block_id is required" }, { status: 400 });
    }

    const calendarAction = await postYuiCalendarAction({
      time_block_id: body.time_block_id,
      provider: body.provider,
      title: body.title,
      start_at: body.start_at,
      end_at: body.end_at,
      status: body.status,
    });

    return NextResponse.json({ calendarAction }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to save YUI calendar action";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
