import { NextResponse } from "next/server";
import { getYuiMilestones, postYuiMilestone, patchYuiMilestone, deleteMilestone } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get("goalId") ?? undefined;
    const limit = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 200);
    const milestones = await getYuiMilestones(goalId, limit);
    return NextResponse.json({ milestones });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : "Failed to fetch YUI milestones";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.goal_id || !body?.title) {
      return NextResponse.json(
        { error: "goal_id and title are required" },
        { status: 400 },
      );
    }

    const milestone = await postYuiMilestone({
      goal_id: body.goal_id,
      title: body.title,
      status: body.status,
    });

    return NextResponse.json({ milestone }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to save YUI milestone";
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

    const milestone = await patchYuiMilestone(id, {
      title: body.title,
      status: body.status,
    });

    return NextResponse.json({ milestone });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to update YUI milestone";
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
    await deleteMilestone(id);
    return NextResponse.json({ status: "deleted" });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to delete YUI milestone";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
