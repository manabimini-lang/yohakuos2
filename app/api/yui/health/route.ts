import { NextResponse } from "next/server";
import { getYuiConnectionHealth } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const health = await getYuiConnectionHealth();
    return NextResponse.json(health);
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Failed to fetch YUI connection health";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
