import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireYuiSession } from "@/app/ui/backend/yui/api";
import { executeAction } from "@/app/ui/backend/yui/action_execution_service";
import type { YuiUnifiedAction } from "@/app/ui/backend/yui/unified_action_service";
import {
  createYuiGoal,
  createYuiMilestone,
  createYuiSuggestedTimeBlock,
  listYuiGoals,
  listYuiMilestones,
  updateYuiGoal,
  updateYuiMilestone,
  deleteYuiGoal,
  deleteYuiMilestone,
} from "@/app/ui/backend/yui/service";
import { updateYuiRecommendationStatus } from "@/app/ui/backend/yui/recommendation_service";
import { recordFirstValue } from '@/lib/analytics/funnel-server';

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await requireYuiSession();
    const body = await request.json();
    const recommendationId = body?.recommendationId;
    const action = body?.action as YuiUnifiedAction | undefined;

    if (!recommendationId && action?.actionType) {
      const result = await executeAction(session.user.id, action);
      return NextResponse.json(result);
    }

    if (!recommendationId) {
      return NextResponse.json({ error: "recommendationId is required" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch pending recommendation
    const { data: recommendation, error: readError } = await supabaseAdmin
      .from("yui_recommendations")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("id", recommendationId)
      .maybeSingle();

    if (readError || !recommendation) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }

    if (recommendation.status !== "pending") {
      return NextResponse.json({ error: "Recommendation is already processed" }, { status: 400 });
    }

    // 2. Parse action payload
    let proposedAction;
    try {
      proposedAction = JSON.parse(recommendation.content);
    } catch (e) {
      return NextResponse.json({ error: "Invalid action payload" }, { status: 400 });
    }

    const { type, params } = proposedAction;
    let executionResult;

    // 3. Dispatch execution
    if (type === "create_goal") {
      executionResult = await createYuiGoal(session.user, {
        title: params.title || "新しい目標",
        description: params.description || "",
        status: "active",
        progress: 0,
      });
    } else if (type === "update_goal") {
      let goalId = params.goal_id;
      if (!goalId && params.title_hint) {
        const goals = await listYuiGoals(session.user.id, 20);
        goalId = goals.find((goal) => goal.title.includes(String(params.title_hint)))?.id;
      }
      if (!goalId) {
        return NextResponse.json({ error: "更新するGoalを特定できませんでした" }, { status: 400 });
      }

      executionResult = await updateYuiGoal(session.user, goalId, {
        title: params.title,
        description: params.description,
        status: params.status,
        progress: typeof params.progress === "number" ? params.progress : undefined,
      });
    } else if (type === "delete_goal") {
      let goalId = params.goal_id;
      if (!goalId && params.title_hint) {
        const goals = await listYuiGoals(session.user.id, 20);
        goalId = goals.find((goal) => goal.title.includes(String(params.title_hint)))?.id;
      }
      if (!goalId) {
        return NextResponse.json({ error: "削除するGoalを特定できませんでした" }, { status: 400 });
      }

      await deleteYuiGoal(session.user, goalId);
      executionResult = { id: goalId, status: "deleted" };
    } else if (type === "create_milestone") {
      let goalId = params.goal_id;
      if (!goalId) {
        const goals = await listYuiGoals(session.user.id, 1);
        if (goals.length > 0) {
          goalId = goals[0].id;
        }
      }
      if (!goalId) {
        return NextResponse.json({ error: "紐づけるGoalを特定できませんでした" }, { status: 400 });
      }

      executionResult = await createYuiMilestone(session.user, {
        goal_id: goalId,
        title: params.title || "新しいマイルストーン",
        status: "pending",
      });
    } else if (type === "update_milestone") {
      let milestoneId = params.milestone_id;
      if (!milestoneId && params.title_hint) {
        const milestones = await listYuiMilestones(session.user.id, undefined, 50);
        milestoneId = milestones.find((milestone) => milestone.title.includes(String(params.title_hint)))?.id;
      }
      if (!milestoneId) {
        return NextResponse.json({ error: "更新するMilestoneを特定できませんでした" }, { status: 400 });
      }

      executionResult = await updateYuiMilestone(session.user, milestoneId, {
        title: params.title,
        status: params.status,
      });
    } else if (type === "delete_milestone") {
      let milestoneId = params.milestone_id;
      if (!milestoneId && params.title_hint) {
        const milestones = await listYuiMilestones(session.user.id, undefined, 50);
        milestoneId = milestones.find((milestone) => milestone.title.includes(String(params.title_hint)))?.id;
      }
      if (!milestoneId) {
        return NextResponse.json({ error: "削除するMilestoneを特定できませんでした" }, { status: 400 });
      }

      await deleteYuiMilestone(session.user, milestoneId);
      executionResult = { id: milestoneId, status: "deleted" };
    } else if (type === "create_calendar_event") {
      if (!params.start_at || !params.end_at) {
        return NextResponse.json({ error: "予定の開始時刻と終了時刻を確認してください" }, { status: 400 });
      }
      const startAt = new Date(params.start_at);
      const endAt = new Date(params.end_at);
      if (
        Number.isNaN(startAt.getTime())
        || Number.isNaN(endAt.getTime())
        || endAt.getTime() <= startAt.getTime()
        || startAt.getTime() <= Date.now()
      ) {
        return NextResponse.json({ error: "予定の開始時刻と終了時刻を確認してください" }, { status: 400 });
      }
      executionResult = await createYuiSuggestedTimeBlock(session.user, {
        goal_id: recommendation.related_goal_id ?? null,
        title: params.title || "カレンダーの予定",
        reason: params.description || recommendation.reason || "YUI Chatで確認した予定です。",
        start_at: params.start_at,
        end_at: params.end_at,
        source: "yui_chat",
        status: "approved",
      });
    } else {
      return NextResponse.json({ error: `Unsupported action type: ${type}` }, { status: 400 });
    }

    // 4. Update status to accepted
    await updateYuiRecommendationStatus(session.user, recommendationId, "accepted");
    if (type === 'create_goal' || type === 'create_milestone') {
      await recordFirstValue(session.user.id);
    }

    return NextResponse.json({
      success: true,
      message: "Action executed successfully",
      result: executionResult,
    });
  } catch (error) {
    console.error("[Action Execution API Error]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
