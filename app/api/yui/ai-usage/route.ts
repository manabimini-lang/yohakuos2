import { NextResponse } from "next/server";
import { requireYuiSession } from "@/app/ui/backend/yui/api";
import { prisma } from "@/lib/prisma";
import { getAiMonthlyRequestLimit, hasPremiumAccess } from "@/lib/constants/plan";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const session = await requireYuiSession();
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const used = await prisma.yuiEvent.count({
      where: { userId: session.user.id, eventType: "ai_request", occurredAt: { gte: monthStart } },
    });
    const plan = hasPremiumAccess(session.user.plan, session.user.role) ? "premium" : "free";
    const limit = getAiMonthlyRequestLimit(session.user.plan, session.user.role);
    return NextResponse.json({ plan, used, limit, remaining: Math.max(0, limit - used), resetAt: new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1)).toISOString() });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : "AI利用状況を取得できませんでした";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
