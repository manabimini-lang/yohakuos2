import { NextResponse } from "next/server";
import { requireYuiSession } from "@/app/ui/backend/yui/api";
import { executeAction } from "@/app/ui/backend/yui/action_execution_service";
import type { YuiUnifiedAction } from "@/app/ui/backend/yui/unified_action_service";

export async function POST(request: Request) {
  try {
    const session = await requireYuiSession();
    const body = await request.json();
    const action = body.action as YuiUnifiedAction;
    
    if (!action || !action.actionType) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const result = await executeAction(session.user.id, action);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed to execute action:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
