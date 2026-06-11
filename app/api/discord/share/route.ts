import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPremiumAccess } from "@/lib/constants/plan";
import { log as logAuditEvent } from "@/core/audit/logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Verify user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify premium plan
    if (!hasPremiumAccess(session.user.plan, session.user.role)) {
      return NextResponse.json({ error: "Forbidden: Premium plan required" }, { status: 403 });
    }

    const { title, summary, tags, road } = await req.json();

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error("DISCORD_WEBHOOK_URL is not set");
      return NextResponse.json({ success: false }, { status: 500 });
    }

    const tagString = tags && tags.length > 0 
      ? tags.map((t: string) => `#${t}`).join(" ")
      : "なし";

    const content = `【ロード】
${road || "未設定"}

【タイトル】
${title || "無題"}

【気づき】
${summary || ""}

【タグ】
${tagString}`;

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.statusText}`);
    }

    // Record Discord share audit log
    await logAuditEvent({
      actorId: session.user.id,
      category: "admin",
      action: "discord.share",
      targetType: "content",
      targetId: road || "unknown",
      severity: "info",
      metadata: { title, summary, tags, road },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Discord share error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
