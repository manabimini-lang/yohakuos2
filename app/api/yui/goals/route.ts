import { NextResponse } from "next/server";
import { getYuiGoals, postYuiGoal, patchYuiGoal, deleteGoal } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "20") || 20, 100);
    const goals = await getYuiGoals(limit);
    return NextResponse.json({ goals });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : "Failed to fetch YUI goals";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.title || !body?.description) {
      return NextResponse.json(
        { error: "title and description are required" },
        { status: 400 },
      );
    }

    const goal = await postYuiGoal({
      title: body.title,
      description: body.description,
      status: body.status,
      progress: body.progress,
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to save YUI goal";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = body?.id;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const goal = await patchYuiGoal(id, {
      title: body.title,
      description: body.description,
      status: body.status,
      progress: typeof body.progress === "number" ? body.progress : undefined,
    });

    return NextResponse.json({ goal });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to update YUI goal";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    await deleteGoal(id);
    return NextResponse.json({ status: "deleted" });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to delete YUI goal";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
