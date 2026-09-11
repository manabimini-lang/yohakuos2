import { NextResponse } from "next/server";
import { requireYuiSession } from "@/app/ui/backend/yui/api";
import {
  saveUnifiedActionFeedback,
  type YuiUnifiedActionFeedback,
  type YuiUnifiedActionDismissReason,
} from "@/app/ui/backend/yui/unified_action_service";

const allowedFeedback = new Set<YuiUnifiedActionFeedback>(["helpful", "dismissed"]);
const allowedDismissReasons = new Set<YuiUnifiedActionDismissReason>(["busy", "not_relevant", "later"]);

export async function POST(request: Request) {
  try {
    const session = await requireYuiSession();
    const body = await request.json().catch(() => null);
    const actionId = typeof body?.actionId === "string" ? body.actionId.trim() : "";
    const feedback = body?.feedback as YuiUnifiedActionFeedback;
    const dismissReason = body?.dismissReason as YuiUnifiedActionDismissReason | undefined;

    if (!actionId || !allowedFeedback.has(feedback)) {
      return NextResponse.json({ error: "actionIdとfeedbackが不正です" }, { status: 400 });
    }
    if (feedback === "dismissed" && dismissReason && !allowedDismissReasons.has(dismissReason)) {
      return NextResponse.json({ error: "dismissReasonが不正です" }, { status: 400 });
    }

    const saved = await saveUnifiedActionFeedback(session.user.id, actionId, feedback, dismissReason);
    return NextResponse.json({ feedback: saved });
  } catch (error: any) {
    console.error("Failed to save unified action feedback:", error);
    return NextResponse.json({ error: error?.message ?? "フィードバックの保存に失敗しました" }, { status: 500 });
  }
}
