import { NextResponse } from "next/server";
import { getYuiConnections, postYuiConnection } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const connections = await getYuiConnections();
    return NextResponse.json({ connections });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : "Failed to fetch YUI connections";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.provider) {
      return NextResponse.json({ error: "provider is required" }, { status: 400 });
    }

    const connection = await postYuiConnection({
      provider: body.provider,
      status: body.status,
      permissions: body.permissions,
      metadata: body.metadata,
      connected_at: body.connected_at,
    });

    return NextResponse.json({ connection }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to save YUI connection";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
