import { NextResponse } from "next/server";
import { getYuiConversations, postYuiConversation } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 200);
    const conversations = await getYuiConversations(limit);
    return NextResponse.json({ conversations });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : "Failed to fetch YUI conversations";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

import { requireYuiSession } from "@/app/ui/backend/yui/api";
import { generateYuiResponse } from "@/app/ui/backend/yui/ai_integration_service";
import { createYuiRecommendation } from "@/app/ui/backend/yui/recommendation_service";

export async function POST(request: Request) {
  try {
    const session = await requireYuiSession();
    const body = await request.json();
    if (!body?.role || !body?.content) {
      return NextResponse.json(
        { error: "role and content are required" },
        { status: 400 },
      );
    }

    // 1. Save user's message
    const userResult = await postYuiConversation({
      role: body.role,
      content: body.content,
    });

    // 2. Fetch recent conversation history
    const history = await getYuiConversations(20);

    // 3. Generate assistant's response and proposed action
    const chatHistory = history.map((c) => ({
      role: c.role,
      content: c.content,
    })).reverse(); // Oldest first for Gemini

    const yuiResponse = await generateYuiResponse(
      session.user.id,
      body.content,
      chatHistory
    );

    // 4. Save assistant's message
    const assistantResult = await postYuiConversation({
      role: "assistant",
      content: yuiResponse.reply,
    });

    // 5. If proposed action exists, save it as a pending recommendation
    if (yuiResponse.proposedAction) {
      const actionLabelMap: Record<string, string> = {
        create_goal: "目標の追加",
        update_goal: "目標の更新",
        delete_goal: "目標の削除",
        create_milestone: "マイルストーンの追加",
        update_milestone: "マイルストーンの更新",
        delete_milestone: "マイルストーンの削除",
        create_calendar_event: "カレンダー登録",
      };
      await createYuiRecommendation(session.user, {
        type: "action",
        title: `${actionLabelMap[yuiResponse.proposedAction.type] ?? "YUIアクション"}: ${
          yuiResponse.proposedAction.params.title ||
          yuiResponse.proposedAction.params.title_hint ||
          ""
        }`,
        content: JSON.stringify(yuiResponse.proposedAction),
        reason: "YUI Chatでの対話から自動提案されました。",
        score: 100,
        status: "pending",
      });
    }

    return NextResponse.json({
      userMessage: userResult.conversation,
      assistantMessage: assistantResult.conversation,
      proposedAction: yuiResponse.proposedAction ?? null,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to save YUI conversation";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
