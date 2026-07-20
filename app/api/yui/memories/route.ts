import { NextResponse } from "next/server";
import { getYuiMemories, postYuiMemory } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "20") || 20, 100);
    const memories = await getYuiMemories(limit);
    return NextResponse.json({ memories });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : "Failed to fetch YUI memories";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.title || !body?.summary || !body?.body) {
      return NextResponse.json(
        { error: "title, summary, and body are required" },
        { status: 400 },
      );
    }

    const memory = await postYuiMemory({
      title: body.title,
      summary: body.summary,
      body: body.body,
      importance: body.importance,
      tags: body.tags,
      source_type: body.source_type,
    });

    return NextResponse.json({ memory }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to save YUI memory";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
