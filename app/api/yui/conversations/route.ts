import { NextResponse } from "next/server";
import { getYuiConversations, postYuiConversation } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 200);
    const conversations = await getYuiConversations(limit);
    return NextResponse.json({ conversations });
  } catch (error) {
    const message = errorMessage(error, "Failed to fetch YUI conversations");
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

import { requireYuiSession } from "@/app/ui/backend/yui/api";
import { generateYuiResponse, isYuiAiEnabled } from "@/app/ui/backend/yui/ai_integration_service";
import { createYuiRecommendation } from "@/app/ui/backend/yui/recommendation_service";

export async function POST(request: Request) {
  try {
    const session = await requireYuiSession();
    const body = await request.json();
    if (!body?.role || typeof body?.content !== "string" || !body.content.trim()) {
      return NextResponse.json(
        { error: "role and content are required" },
        { status: 400 },
      );
    }
    if (body.content.length > 2_000) {
      return NextResponse.json(
        { error: "相談内容は2,000文字以内に短くしてください。" },
        { status: 400 },
      );
    }

    if (!await isYuiAiEnabled(session.user.id)) {
      return NextResponse.json({ error: "AI相談が未接続です。無料プランではGeminiまたはGroqのAPIキーを設定してください。Premiumはキー不要です。相談内容は保存していません。" }, { status: 409 });
    }

    // 1. Save user's message
    const userResult = await postYuiConversation({
      role: body.role,
      content: body.content,
      goal_id: body.goal_id ?? null,
      goal_association_source: body.goal_association_source,
      goal_association_confidence: body.goal_association_confidence,
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

    if (yuiResponse.error) {
      return NextResponse.json({ error: `${yuiResponse.reply} 入力した内容は会話に保存されています。` }, { status: 503 });
    }

    // 4. Save assistant's message
    const assistantResult = await postYuiConversation({
      role: "assistant",
      content: yuiResponse.reply,
      goal_id: userResult.conversation.goal_id,
      goal_association_source: userResult.conversation.goal_association_source,
      goal_association_confidence: userResult.conversation.goal_association_confidence,
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
    console.error("[yui/conversations] save failed", error);
    const message = errorMessage(error, "Failed to save YUI conversation");
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
