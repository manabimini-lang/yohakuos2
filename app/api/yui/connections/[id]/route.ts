import { NextResponse } from "next/server";
import { patchYuiConnection } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    const body = await request.json();
    if (!body?.status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const connection = await patchYuiConnection(id, body.status);
    return NextResponse.json({ connection });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to update YUI connection";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
