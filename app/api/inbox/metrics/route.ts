import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reportError } from "@/app/inbox/report-error";

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
      latestResurfacing,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.session.groupBy({
        by: ["userId"],
        where: { expires: { gte: sevenDaysAgo } },
      }).then((res: { userId: string }[]) => res.length),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.contentItem.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.contentItem.count(),
      prisma.memoryResurfacing.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const metrics = {
      totalUsers,
      activeUsers7d,
      usersCreatedToday,
      contentItemsCreatedToday,
      totalContentItems,
      totalResurfacings: await prisma.memoryResurfacing.count(),
      pendingResurfacings: {
        supported: false,
        reason: "MemoryResurfacing model does not have a 'status' field.",
      },
      meaningfulCount: {
        supported: false,
        reason: "MemoryResurfacing model does not have a 'feedback' field.",
      },
      dismissedCount: {
        supported: false,
        reason: "MemoryResurfacing model does not have a 'feedback' field.",
      },
      neutralCount: {
        supported: false,
        reason: "MemoryResurfacing model does not have a 'feedback' field.",
      },
    };

    const exportRequestsToday = 0;
    const deletionRequestsToday = 0;

    return NextResponse.json({
      ...metrics,
      feedbackRate: { supported: false, reason: "Feedback metrics are not supported by schema." },
      meaningfulRate: { supported: false, reason: "Feedback metrics are not supported by schema." },
      exportRequestsToday,
      deletionRequestsToday,
      latestResurfacingAt: latestResurfacing?.createdAt?.toISOString() || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    reportError("FOUNDER_METRICS", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
