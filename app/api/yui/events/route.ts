import { NextResponse } from "next/server";
import { getYuiEvents, postYuiEvent } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 200);
    const events = await getYuiEvents(limit);
    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : "Failed to fetch YUI events";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.event_type || !body?.source || !body?.title) {
      return NextResponse.json(
        { error: "event_type, source, and title are required" },
        { status: 400 },
      );
    }

    const event = await postYuiEvent({
      event_type: body.event_type,
      source: body.source,
      title: body.title,
      content: body.content,
      metadata: body.metadata,
      occurred_at: body.occurred_at,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to save YUI event";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
