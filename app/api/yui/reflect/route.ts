import { NextResponse } from "next/server";
import { postYuiReflect, postYuiReflection } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const reflection = body?.summary
      ? await postYuiReflection({
          summary: String(body.summary),
          insights: Array.isArray(body.insights) ? body.insights.map(String) : [],
          next_actions: Array.isArray(body.next_actions) ? body.next_actions.map(String) : [],
        })
      : await postYuiReflect();
    return NextResponse.json({ reflection }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to generate YUI reflection";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
