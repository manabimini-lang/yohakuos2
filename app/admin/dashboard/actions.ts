"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function startOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
function subDays(now: Date, days: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d;
}
function subHours(now: Date, hours: number): Date {
  const d = new Date(now);
  d.setHours(d.getHours() - hours);
  return d;
}


async function verifyAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function getDashboardMetrics() {
  await verifyAdmin();
  
  const now = new Date();
  const startOfThisMonth = startOfMonth(now);
  const thirtyDaysAgo = subDays(now, 30);
  const twentyFourHoursAgo = subHours(now, 24);

  // 1. Business KPI
  const [
    totalUsers,
    totalPaidMembers,
    newRegistrationsThisMonth,
    savedContentsDailyLogs,
    savedContentsReflections,
    totalAiProcessings
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "PAID_MEMBER" } }),
    prisma.user.count({ where: { createdAt: { gte: startOfThisMonth } } }),
    prisma.dailyLog.count(),
    prisma.reflection.count(),
    prisma.aIJob.count()
  ]);
  
  const newPaidConversionsThisMonth = await prisma.subscription.count({
    where: { 
      status: "active",
      createdAt: { gte: startOfThisMonth }
    }
  });

  const totalSavedContents = savedContentsDailyLogs + savedContentsReflections;

  // 2. Subscription Health
  const subscriptions = await prisma.subscription.groupBy({
    by: ["status"],
    _count: { status: true }
  });
  
  const subsMap = subscriptions.reduce((acc, curr) => {
    acc[curr.status] = curr._count.status;
    return acc;
  }, {} as Record<string, number>);

  const activeSubs = subsMap["active"] || 0;
  const trialingSubs = subsMap["trialing"] || 0;
  const pastDueSubs = subsMap["past_due"] || 0;
  const canceledSubs = subsMap["canceled"] || 0;

  const mrr = activeSubs * 980;

  const recentChurn = await prisma.subscription.count({
    where: {
      status: "canceled",
      updatedAt: { gte: thirtyDaysAgo }
    }
  });

  // 3. AI Runtime Health
  const aiJobs = await prisma.aIJob.groupBy({
    by: ["status"],
    _count: { status: true }
  });

  const aiJobMap = aiJobs.reduce((acc, curr) => {
    acc[curr.status] = curr._count.status;
    return acc;
  }, {} as Record<string, number>);

  const geminiErrors24h = await prisma.aIJob.count({
    where: {
      status: "failed",
      createdAt: { gte: twentyFourHoursAgo }
    }
  });

  // 4. Content Health
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
  const startOfWeek = subDays(now, now.getDay());

  const [
    todayDailyLogs,
    todayReflections,
    todayLandscapes,
    weekDailyLogs,
    weekReflections,
    weekLandscapes,
    totalLandscapes,
    totalConversations
  ] = await Promise.all([
    prisma.dailyLog.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.reflection.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.innerLandscape.count({ where: { generatedAt: { gte: startOfToday } } }),
    prisma.dailyLog.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.reflection.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.innerLandscape.count({ where: { generatedAt: { gte: startOfWeek } } }),
    prisma.innerLandscape.count(),
    prisma.companionConversation.count()
  ]);

  const todaySavedCount = todayDailyLogs + todayReflections + todayLandscapes;
  const weekSavedCount = weekDailyLogs + weekReflections + weekLandscapes;
  const totalContentCount = totalSavedContents + totalLandscapes;

  // 5. System Health
  let dbStatus = false;
  try {
    await prisma.user.findFirst({ select: { id: true } });
    dbStatus = true;
  } catch (e) {
    dbStatus = false;
  }

  const stripeStatus = !!process.env.STRIPE_SECRET_KEY;
  const geminiStatus = !!process.env.GEMINI_API_KEY;
  
  const recentWebhook = await prisma.auditLog.findFirst({
    where: {
      OR: [
        { category: "billing", createdAt: { gte: twentyFourHoursAgo } },
        { action: { contains: "webhook" }, createdAt: { gte: twentyFourHoursAgo } }
      ]
    }
  });

  // 6. Recent Errors
  const recentAuditErrors = await prisma.auditLog.findMany({
    where: {
      severity: { in: ["error", "critical"] }
    },
    orderBy: { createdAt: "desc" },
    take: 25
  });

  const recentAiErrors = await prisma.aIJob.findMany({
    where: {
      status: "failed"
    },
    orderBy: { createdAt: "desc" },
    take: 25
  });

  // Combine and sort recent errors
  const allErrors = [
    ...recentAuditErrors.map(e => ({ type: "AuditLog", date: e.createdAt, data: e })),
    ...recentAiErrors.map(e => ({ type: "AIJob", date: e.createdAt, data: e }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 50);

  return {
    business: {
      totalUsers,
      totalPaidMembers,
      newRegistrationsThisMonth,
      newPaidConversionsThisMonth,
      totalSavedContents,
      totalAiProcessings
    },
    subscription: {
      active: activeSubs,
      trialing: trialingSubs,
      past_due: pastDueSubs,
      canceled: canceledSubs,
      mrr,
      recentChurn
    },
    aiRuntime: {
      pending: aiJobMap["pending"] || 0,
      processing: aiJobMap["processing"] || 0,
      completed: aiJobMap["completed"] || 0,
      failed: aiJobMap["failed"] || 0,
      geminiErrors24h
    },
    content: {
      totalContentCount,
      todaySavedCount,
      weekSavedCount,
      totalReflections: savedContentsReflections,
      totalLandscapes,
      totalConversations
    },
    system: {
      db: dbStatus,
      stripe: stripeStatus,
      gemini: geminiStatus,
      webhook: !!recentWebhook,
      cron: true // Mocked
    },
    recentErrors: allErrors
  };
}
