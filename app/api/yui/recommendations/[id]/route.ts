import { NextResponse } from "next/server";
import { patchYuiRecommendation } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    const body = await request.json().catch(() => ({}));
    if (!body?.status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const recommendation = await patchYuiRecommendation(id, body.status);
    return NextResponse.json({ recommendation });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to update YUI recommendation";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
