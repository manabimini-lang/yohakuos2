import { NextResponse } from "next/server";
import { postYuiReflect } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function POST() {
  try {
    const reflection = await postYuiReflect();
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
