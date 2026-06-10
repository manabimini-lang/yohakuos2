import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { reportError } from "@/lib/monitoring/report-error";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers7d,
      usersCreatedToday,
      contentItemsCreatedToday,
      totalContentItems,
      resurfacingMetrics,
      latestResurfacing
    ] = await Promise.all([
      prisma.user.count(),
      prisma.session.groupBy({
        // Active users in the last 7 days based on session expiry
        by: ['userId'],
        where: { expires: { gte: sevenDaysAgo } }
      }).then(res => res.length),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.contentItem.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.contentItem.count(),
      prisma.memoryResurfacing.groupBy({
        by: ['feedback', 'status'],
        _count: true
      }),
      prisma.memoryResurfacing.findFirst({
        orderBy: { surfacedAt: 'desc' },
        select: { surfacedAt: true }
      })
      // Note: exportRequestsToday and deletionRequestsToday require a dedicated audit log table
      // or specific tracking within the reportError function that can be aggregated.
      // Without schema changes, these cannot be accurately tracked via Prisma.
      // Returning 0 for now, as per "Avoid schema changes unless absolutely necessary" constraint.
    ]);

    const metrics = {
      totalUsers,
      activeUsers7d,
      usersCreatedToday,
      contentItemsCreatedToday,
      totalContentItems,
      totalResurfacings: resurfacingMetrics.reduce((sum, m) => sum + m._count, 0),
      pendingResurfacings: resurfacingMetrics.find(m => m.status === "PENDING")?._count || 0,
      meaningfulCount: resurfacingMetrics.find(m => m.feedback === "MEANINGFUL")?._count || 0,
      dismissedCount: resurfacingMetrics.find(m => m.feedback === "DISMISSED")?._count || 0,
      neutralCount: resurfacingMetrics.find(m => m.feedback === "NEUTRAL")?._count || 0,
    };
    
    // Placeholder for metrics requiring dedicated logging infrastructure
    const exportRequestsToday = 0; 
    const deletionRequestsToday = 0;

    const feedbackTotal = metrics.meaningfulCount + metrics.dismissedCount + metrics.neutralCount;

    return NextResponse.json({
      ...metrics,
      feedbackRate: metrics.totalResurfacings > 0 ? feedbackTotal / metrics.totalResurfacings : 0,
      meaningfulRate: feedbackTotal > 0 ? metrics.meaningfulCount / feedbackTotal : 0,
      exportRequestsToday,
      deletionRequestsToday,
      latestResurfacingAt: latestResurfacing?.surfacedAt?.toISOString() || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    reportError("FOUNDER_METRICS", error);
    return new NextResponse("Internal Server Error", { status: 500 }); // Fail closed
  }
}