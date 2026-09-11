import { NextResponse } from "next/server";
import { patchYuiConversationGoal } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const conversation = await patchYuiConversationGoal(params.id, body?.goal_id ? String(body.goal_id) : null);
    return NextResponse.json({ conversation });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : error instanceof Error ? error.message : "Failed to update conversation";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
