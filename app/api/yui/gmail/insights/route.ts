import { NextResponse } from "next/server";
import { requireYuiSession } from "@/app/ui/backend/yui/api";
import { getGmailInsights } from "@/app/ui/backend/yui/gmail_service";

export async function GET(request: Request) {
  try {
    const session = await requireYuiSession();
    const insights = await getGmailInsights(session.user.id);
    return NextResponse.json({ insights });
  } catch (error: any) {
    console.error("Failed to get Gmail insights:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
