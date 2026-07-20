import { NextResponse } from "next/server";
import { getYuiCalendarEvents, postYuiCalendarEvent } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 200);
    const calendarEvents = await getYuiCalendarEvents(limit);
    return NextResponse.json({ calendarEvents });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : "Failed to fetch YUI calendar events";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (
      !body?.connection_id
      || !body?.provider
      || !body?.external_id
      || !body?.title
      || !body?.start_at
      || !body?.end_at
    ) {
      return NextResponse.json(
        {
          error: "connection_id, provider, external_id, title, start_at, and end_at are required",
        },
        { status: 400 },
      );
    }

    const calendarEvent = await postYuiCalendarEvent({
      connection_id: body.connection_id,
      provider: body.provider,
      external_id: body.external_id,
      title: body.title,
      description: body.description,
      start_at: body.start_at,
      end_at: body.end_at,
      location: body.location,
      status: body.status,
      metadata: body.metadata,
    });

    return NextResponse.json({ calendarEvent }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to save YUI calendar event";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
