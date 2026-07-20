import { NextResponse } from "next/server";
import { getYuiDecisions, postYuiDecision } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "20") || 20, 100);
    const decisions = await getYuiDecisions(limit);
    return NextResponse.json({ decisions });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : "Failed to fetch YUI decisions";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.question || !body?.context || !body?.decision || !body?.rationale) {
      return NextResponse.json(
        { error: "question, context, decision, and rationale are required" },
        { status: 400 },
      );
    }

    const decision = await postYuiDecision({
      question: body.question,
      context: body.context,
      decision: body.decision,
      rationale: body.rationale,
      confidence: body.confidence,
    });

    return NextResponse.json({ decision }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to save YUI decision";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
