import { NextResponse } from "next/server";
import { requireYuiSession } from "@/app/ui/backend/yui/api";
import { getUnifiedActions } from "@/app/ui/backend/yui/unified_action_service";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: Request) {
  try {
    const session = await requireYuiSession();
    const actions = await getUnifiedActions(session.user.id);
    return NextResponse.json(
      { actions },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error: any) {
    console.error("Failed to get unified actions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
