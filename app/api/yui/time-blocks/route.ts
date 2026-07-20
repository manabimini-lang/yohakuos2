import { NextResponse } from "next/server";
import { getYuiTimeBlocks, postYuiTimeBlock } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "20") || 20, 100);
    const status = searchParams.get("status") ?? undefined;
    const timeBlocks = await getYuiTimeBlocks(status, limit);
    return NextResponse.json({ timeBlocks });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : "Failed to fetch YUI time blocks";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.title || !body?.reason || !body?.start_at || !body?.end_at) {
      return NextResponse.json(
        { error: "title, reason, start_at, and end_at are required" },
        { status: 400 },
      );
    }

    const timeBlock = await postYuiTimeBlock({
      goal_id: body.goal_id,
      title: body.title,
      reason: body.reason,
      start_at: body.start_at,
      end_at: body.end_at,
      source: body.source,
      status: body.status,
    });

    return NextResponse.json({ timeBlock }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to save YUI time block";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
