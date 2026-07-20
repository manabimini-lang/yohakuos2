import { NextResponse } from "next/server";
import { approveMemoryCandidate } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const result = await approveMemoryCandidate(id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to approve memory candidate";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
