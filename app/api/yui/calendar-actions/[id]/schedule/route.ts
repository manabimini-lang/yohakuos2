import { NextResponse } from "next/server";
import { scheduleYuiCalendarAction } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    const result = await scheduleYuiCalendarAction(id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to schedule YUI calendar action";
    const status = message === "Unauthorized" ? 401 : message.includes("connection is required") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
