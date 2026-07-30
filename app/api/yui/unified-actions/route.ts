import { NextResponse } from "next/server";
import { requireYuiSession } from "@/app/ui/backend/yui/api";
import { getUnifiedActions } from "@/app/ui/backend/yui/unified_action_service";

export async function GET(request: Request) {
  try {
    const session = await requireYuiSession();
    const actions = await getUnifiedActions(session.user.id);
    return NextResponse.json({ actions });
  } catch (error: any) {
    console.error("Failed to get unified actions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
