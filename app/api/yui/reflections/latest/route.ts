import { NextResponse } from "next/server";
import { getLatestYuiReflectionForCurrentUser } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const reflection = await getLatestYuiReflectionForCurrentUser();
    return NextResponse.json({ reflection });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : "Failed to fetch latest YUI reflection";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
