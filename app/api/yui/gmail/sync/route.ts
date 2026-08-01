import { NextResponse } from "next/server";
import { requireYuiSession } from "@/app/ui/backend/yui/api";
import { syncGmailMessages } from "@/app/ui/backend/yui/gmail_service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await requireYuiSession();
    const result = await syncGmailMessages(session.user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Gmail sync failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
