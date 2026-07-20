import { NextResponse } from "next/server";
import { getYuiRecommendations, postYuiRecommendation } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "20") || 20, 100);
    const status = searchParams.get("status") ?? undefined;
    const recommendations = await getYuiRecommendations(status, limit);
    return NextResponse.json({ recommendations });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : "Failed to fetch YUI recommendations";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const recommendation = await postYuiRecommendation({
      type: body?.type,
      context: body?.context,
      title: body?.title,
      content: body?.content,
      reason: body?.reason,
      score: body?.score,
      related_goal_id: body?.related_goal_id,
      related_decision_ids: body?.related_decision_ids,
      related_memory_ids: body?.related_memory_ids,
      status: body?.status,
    });

    return NextResponse.json({ recommendation }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to save YUI recommendation";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
