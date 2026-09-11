import { NextResponse } from "next/server";
import { cancelYuiCalendarActionForCurrentUser } from "@/app/ui/backend/yui/api";

export async function POST(_: Request, context: { params: { id: string } }) {
  try {
    return NextResponse.json({ calendarAction: await cancelYuiCalendarActionForCurrentUser(context.params.id) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to cancel calendar action" }, { status: 500 });
  }
}
