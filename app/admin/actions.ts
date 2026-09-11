"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { isAdminAccessEmail } from "@/lib/auth/admin-access";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

async function verifyAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  if (!isAdminAccessEmail(session.user.email)) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function getAdminStats() {
  await verifyAdmin();

  const [
    totalUsers,
    premiumUsers,
    discordShares,
    suggestedCount,
    externalCount,
    geminiUsersCount
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        AND: [
          { role: { notIn: ["ADMIN", "SUPER_ADMIN"] } },
          { OR: [{ role: "PAID_MEMBER" }, { plan: "premium" }] },
        ],
      }
    }),
    prisma.sharedKnowledge.count(),
    prisma.suggestedContent.count(),
    prisma.externalContent.count(),
    prisma.userAISettings.count({
      where: { isEnabled: true }
    })
  ]);

  const geminiRatio = totalUsers > 0 ? Math.round((geminiUsersCount / totalUsers) * 100) : 0;

  // Discord status
  const discordWebhookStatus = !!process.env.DISCORD_WEBHOOK_URL;
  const discordBotStatus = !!process.env.DISCORD_BOT_TOKEN;

  return {
    stats: {
      totalUsers,
      premiumUsers,
      discordShares,
      suggestedCount,
      externalCount,
      geminiRatio,
    },
    discord: {
      webhook: discordWebhookStatus,
      bot: discordBotStatus,
    }
  };
}

export async function getSuggestedContents() {
  await verifyAdmin();
  return prisma.suggestedContent.findMany({
    orderBy: { createdAt: "desc" }
  });
}

export async function deleteSuggestedContent(id: string) {
  await verifyAdmin();
  await prisma.suggestedContent.delete({
    where: { id }
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function promoteSuggestedContent(id: string) {
  await verifyAdmin();

  const suggestion = await prisma.suggestedContent.findUnique({
    where: { id }
  });

  if (!suggestion) {
    throw new Error("Suggestion not found");
  }

  // Create external content
  await prisma.externalContent.create({
    data: {
      title: suggestion.title,
      url: suggestion.url,
      type: suggestion.type,
      road: suggestion.road,
      tags: suggestion.tags || [],
      description: suggestion.description,
      createdBy: suggestion.createdBy,
    }
  });

  // Delete suggestion
  await prisma.suggestedContent.delete({
    where: { id }
  });

  revalidatePath("/admin");
  return { ok: true };
}

export async function getRoadPrompts() {
  await verifyAdmin();
  return prisma.road.findMany({
    where: { isActive: true },
    include: { roadPrompt: true },
    orderBy: { createdAt: "asc" }
  });
}

export async function saveRoadPrompt(roadId: string, systemPrompt: string) {
  await verifyAdmin();

  const existing = await prisma.roadPrompt.findUnique({
    where: { roadId }
  });

  if (existing) {
    await prisma.roadPrompt.update({
      where: { roadId },
      data: { systemPrompt }
    });
  } else {
    await prisma.roadPrompt.create({
      data: {
        roadId,
        systemPrompt
      }
    });
  }

  revalidatePath("/admin/prompts");
  revalidatePath("/api/roads");
  return { ok: true };
}

// ===================================================
// Sprint 2 Backend Actions
// ===================================================

import { UserRole } from "@prisma/client";
import { getStripe, getStripeSecretKey } from "@/lib/stripe";

export async function getDashboardStatsAndRecentEvents() {
  await verifyAdmin();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);

  const [
    totalUsers,
    premiumUsers,
    activeUsersToday,
    aiFailedCount,
    savesToday,
    logsToday,
    suggestionsViewedToday,
    discordSharesToday,
    suspiciousSubscriptionsCount,
    auditLogs
  ] = await Promise.all([
    // stats
    prisma.user.count(),
    prisma.user.count({
      where: {
        AND: [
          { role: { notIn: ["ADMIN", "SUPER_ADMIN"] } },
          { OR: [{ role: "PAID_MEMBER" }, { plan: "premium" }] },
        ],
      }
    }),
    prisma.user.count({
      where: {
        OR: [
          { dailyLogs: { some: { createdAt: { gte: todayStart } } } },
          { reflections: { some: { createdAt: { gte: todayStart } } } }
        ]
      }
    }),
    prisma.communityReflectionSnapshot.count({
      where: { status: "AI_FAILED" }
    }),
    // 今日のYOHAKU
    prisma.userMemory.count({
      where: { createdAt: { gte: todayStart } }
    }),
    prisma.dailyLog.count({
      where: { createdAt: { gte: todayStart } }
    }).then(async (dlCount) => {
      const refCount = await prisma.reflection.count({
        where: { createdAt: { gte: todayStart } }
      });
      return dlCount + refCount;
    }),
    prisma.userProgress.count({
      where: {
        completed: true,
        completedAt: { gte: todayStart }
      }
    }),
    prisma.auditLog.count({
      where: {
        action: "discord.share",
        createdAt: { gte: todayStart }
      }
    }),
    // 要確認課金件数
    prisma.subscription.count({
      where: {
        OR: [
          { status: { in: ["past_due", "unpaid", "canceled"] } },
          {
            AND: [
              { status: "trialing" },
              { currentPeriodEnd: { lte: threeDaysLater } }
            ]
          }
        ]
      }
    }),
    // Timeline events from AuditLog
    prisma.auditLog.findMany({
      where: {
        OR: [
          { action: { in: ["discord.share", "user.suspend", "user.activate", "role.change"] } },
          { action: { startsWith: "auth." } },
          { action: { startsWith: "billing.subscription." } }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        actor: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
  ]);

  // Map AuditLog to clean Japanese messages
  const recentEvents = auditLogs.map((log) => {
    let message = "";
    const name = log.actor?.name || log.actor?.email || "システム";

    switch (log.action) {
      case "auth.signup":
      case "auth.signup.success":
        message = `${name}さんが新規メンバー登録しました。`;
        break;
      case "billing.subscription.created":
        message = `${name}さんがプレミアムプランに登録しました。`;
        break;
      case "billing.subscription.cancelled":
        message = `${name}さんがプレミアムプランを解約しました。`;
        break;
      case "discord.share":
        const roadName = log.targetId === "beginner" ? "初任者ロード" : log.targetId === "side-hustle" ? "副業ロード" : "退職ロード";
        message = `${name}さんがDiscordで知見（ロード: ${roadName}）を共有しました。`;
        break;
      case "user.suspend":
        message = `管理者によって ${(log.metadata as any)?.targetEmail || "ユーザー"} が利用停止されました。`;
        break;
      case "user.activate":
        message = `管理者によって ${(log.metadata as any)?.targetEmail || "ユーザー"} の利用停止が解除されました。`;
        break;
      case "role.change":
        const role = (log.metadata as any)?.newRole === "ADMIN" ? "管理者" : "一般ユーザー";
        message = `管理者によって ${(log.metadata as any)?.targetEmail || "ユーザー"} の権限が「${role}」に変更されました。`;
        break;
      default:
        message = `${name}さんがアクション ${log.action} を実行しました。`;
    }

    return {
      id: log.id,
      message,
      timestamp: log.createdAt
    };
  });

  return {
    stats: {
      totalUsers,
      premiumUsers,
      activeUsersToday,
      aiFailedCount,
      suspiciousSubscriptionsCount
    },
    todayYohaku: {
      savesToday,
      logsToday,
      suggestionsViewedToday,
      discordSharesToday
    },
    recentEvents
  };
}

export async function getAdminMembersList() {
  await verifyAdmin();

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      dailyLogs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true }
      },
      reflections: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true }
      },
      yuiConversations: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true }
      },
      yuiReflections: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true }
      },
      yuiEvents: {
        orderBy: { occurredAt: "desc" },
        take: 1,
        select: { occurredAt: true }
      },
      _count: {
        select: {
          dailyLogs: true,
          reflections: true,
          userMemories: true,
          progress: true,
          yuiConversations: true,
          yuiReflections: true,
          yuiEvents: true,
          yuiMemories: true,
          yuiGoals: true,
          yuiMilestones: true
        }
      },
      progress: {
        orderBy: { createdAt: "desc" },
        include: {
          content: {
            select: { title: true }
          }
        }
      },
      subscription: {
        select: {
          status: true,
          currentPeriodEnd: true
        }
      }
    }
  });

  return users.map((user) => {
    const dailyLogTime = user.dailyLogs[0]?.createdAt ?? null;
    const reflectionTime = user.reflections[0]?.createdAt ?? null;
    const lastLogRecordedAt = dailyLogTime && reflectionTime 
      ? new Date(Math.max(dailyLogTime.getTime(), reflectionTime.getTime()))
      : dailyLogTime || reflectionTime || null;

    const yuiConversationTime = user.yuiConversations[0]?.createdAt ?? null;
    const yuiReflectionTime = user.yuiReflections[0]?.createdAt ?? null;
    const yuiEventTime = user.yuiEvents[0]?.occurredAt ?? null;
    const yuiActivityTimes = [yuiConversationTime, yuiReflectionTime, yuiEventTime].filter(Boolean) as Date[];
    const lastYuiActivityAt = yuiActivityTimes.length > 0
      ? new Date(Math.max(...yuiActivityTimes.map((time) => time.getTime())))
      : null;
    const yuiActivityCount = user._count.yuiConversations + user._count.yuiReflections + user._count.yuiEvents;

    const completedProgresses = user.progress.filter(p => p.completed && p.completedAt);
    const lastSuggestionViewedAt = completedProgresses.length > 0
      ? new Date(Math.max(...completedProgresses.map(p => p.completedAt!.getTime())))
      : null;

    const lastSuggestionTitle = user.progress[0]?.content?.title ?? null;

    const times = [user.createdAt, lastLogRecordedAt, lastSuggestionViewedAt, lastYuiActivityAt].filter(Boolean) as Date[];
    const lastActiveAt = new Date(Math.max(...times.map(t => t.getTime())));

    const totalProgress = user._count.progress;
    const completedProgress = completedProgresses.length;
    const suggestionRate = totalProgress > 0 ? Math.round((completedProgress / totalProgress) * 100) : 0;

    const isSuspended = user.lockedUntil && new Date(user.lockedUntil) > new Date();
    
    // YUI conversations, reflections, and events are first-class usage. A
    // member who uses YUI without legacy daily logs must not be flagged idle.
    const lastMeaningfulActivityAt = [lastLogRecordedAt, lastYuiActivityAt].filter(Boolean) as Date[];
    const noLog14d = !isSuspended && (!lastMeaningfulActivityAt.length || Math.max(...lastMeaningfulActivityAt.map((time) => time.getTime())) < fourteenDaysAgo.getTime());
    const noView14d = !isSuspended && (!lastSuggestionViewedAt || lastSuggestionViewedAt < fourteenDaysAgo);
    
    const isTrial = user.subscription?.status === "trialing";
    const trialEndingSoon = isTrial && user.subscription?.currentPeriodEnd 
      ? new Date(user.subscription.currentPeriodEnd) <= threeDaysLater 
      : false;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      role: user.role,
      plan: user.plan,
      lockedUntil: user.lockedUntil,
      discordId: user.discordId,
      discordName: user.discordName,
      lastActiveAt,
      accompaniment: {
        lastSuggestionViewedAt,
        lastSuggestionTitle,
        lastLogRecordedAt
      },
      yuiUsage: {
        count: yuiActivityCount,
        lastActiveAt: lastYuiActivityAt,
        goalsCount: user._count.yuiGoals,
        milestonesCount: user._count.yuiMilestones,
      },
      risks: {
        noLog14d,
        noView14d,
        trialEndingSoon
      },
      stats: {
        savedCount: user._count.userMemories,
        logsCount: user._count.dailyLogs + user._count.reflections,
        suggestionRate,
        isDiscordConnected: !!user.discordId
      }
    };
  });
}

export async function toggleUserSuspension(userId: string) {
  const session = await verifyAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true, email: true }
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isSuspended = user.lockedUntil && user.lockedUntil > new Date();
  const nextLockedUntil = isSuspended ? null : new Date("9999-12-31T23:59:59.999Z");

  await prisma.user.update({
    where: { id: userId },
    data: { lockedUntil: nextLockedUntil }
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      category: "user_management",
      action: isSuspended ? "user.activate" : "user.suspend",
      targetType: "user",
      targetId: userId,
      severity: "warning",
      metadata: { targetEmail: user.email }
    }
  });

  revalidatePath("/admin/members");
  return { ok: true };
}

export async function changeUserRole(userId: string, isAdmin: boolean) {
  const session = await verifyAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  if (!user) {
    throw new Error("User not found");
  }

  const targetRole: UserRole = isAdmin ? "ADMIN" : "FREE_MEMBER";

  await prisma.user.update({
    where: { id: userId },
    data: { role: targetRole }
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      category: "user_management",
      action: "role.change",
      targetType: "user",
      targetId: userId,
      severity: "warning",
      metadata: { targetEmail: user.email, newRole: targetRole }
    }
  });

  revalidatePath("/admin/members");
  return { ok: true };
}

export async function getAdminBillingList() {
  await verifyAdmin();

  const subscriptions = await prisma.subscription.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          plan: true
        }
      }
    }
  });

  return subscriptions.map((sub) => ({
    id: sub.id,
    userId: sub.userId,
    userName: sub.user?.name ?? null,
    userEmail: sub.user?.email ?? "",
    stripeCustomerId: sub.stripeCustomerId,
    stripeSubscriptionId: sub.stripeSubscriptionId,
    status: sub.status,
    stripePriceId: sub.stripePriceId,
    plan: sub.user?.plan ?? "free",
    stripeVerified: Boolean(
      sub.stripeSubscriptionId &&
      ["active", "trialing"].includes(sub.status) &&
      ![sub.stripeCustomerId, sub.stripeSubscriptionId, sub.stripePriceId].some((value) => value?.toLowerCase().includes("mock"))
    ),
    currentPeriodEnd: sub.currentPeriodEnd
  }));
}

/** Live Stripe customer list. Payment details are intentionally not returned. */
export async function getAdminStripeCustomers() {
  await verifyAdmin();
  const key = getStripeSecretKey() ?? "";
  const stripeMode = key.startsWith("sk_live_") ? "live" : key.startsWith("sk_test_") ? "test" : "unknown";
  try {
    const stripe = getStripe();
    const customers = await stripe.customers.list({ limit: 100 });
    return { stripeMode, customers: customers.data.map((customer) => ({ id: customer.id, name: customer.name, email: customer.email, created: customer.created, delinquent: customer.delinquent })), error: null };
  } catch (error) {
    console.error("[STRIPE_CUSTOMERS] list failed", error);
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    const errorCode = message.includes("api key") || message.includes("authentication") ? "invalid_key" : message.includes("network") || message.includes("fetch") ? "network" : "api_error";
    return { stripeMode, customers: [], error: errorCode };
  }
}

export async function getAdminStripePortalUrl(customerId: string) {
  await verifyAdmin();

  if (!customerId) {
    throw new Error("Customer ID is required");
  }

  const stripe = getStripe();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/admin/billing`,
  });

  return portalSession.url;
}

// ===================================================
// Sprint 2 Moderation & Analytics Actions
// ===================================================

export async function getModerationList() {
  await verifyAdmin();

  // 1. Get all Discord shares
  const shares = await prisma.auditLog.findMany({
    where: {
      action: "discord.share"
    },
    orderBy: { createdAt: "desc" },
    include: {
      actor: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  // 2. Get all moderation actions targeting discord shares
  const modLogs = await prisma.auditLog.findMany({
    where: {
      targetType: "discord.share",
      action: { in: ["moderation.hide", "moderation.publish", "moderation.delete", "moderation.report"] }
    },
    orderBy: { createdAt: "asc" }
  });

  return shares.map((share) => {
    const relatedModLogs = modLogs.filter(log => log.targetId === share.id);
    
    // Calculate report count
    const reports = relatedModLogs.filter(log => log.action === "moderation.report").length;

    // Get current status based on latest moderation action
    const latestActionLog = [...relatedModLogs]
      .reverse()
      .find(log => log.action !== "moderation.report");

    let status = "公開中";
    if (latestActionLog) {
      if (latestActionLog.action === "moderation.hide") {
        status = "非表示";
      } else if (latestActionLog.action === "moderation.delete") {
        status = "削除済み";
      } else if (latestActionLog.action === "moderation.publish") {
        status = "公開中";
      }
    }

    return {
      id: share.id,
      createdAt: share.createdAt,
      actorName: share.actor?.name || "未設定",
      actorEmail: share.actor?.email || "unknown",
      content: share.metadata as any,
      reports,
      status
    };
  });
}

export async function moderateContent(shareId: string, action: "hide" | "publish" | "delete") {
  const session = await verifyAdmin();

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      category: "moderation",
      action: `moderation.${action}`,
      targetType: "discord.share",
      targetId: shareId,
      severity: action === "delete" ? "critical" : "warning",
      metadata: { moderatedAt: new Date() }
    }
  });

  revalidatePath("/admin/moderation");
  return { ok: true };
}

export async function reportContent(shareId: string) {
  const session = await verifyAdmin();

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      category: "moderation",
      action: "moderation.report",
      targetType: "discord.share",
      targetId: shareId,
      severity: "warning",
      metadata: { reportedAt: new Date() }
    }
  });

  revalidatePath("/admin/moderation");
  return { ok: true };
}

export async function getAnalyticsData() {
  await verifyAdmin();

  const now = new Date();
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  // A member can now use YUI without creating a legacy DailyLog or
  // Reflection. Include the current product's member-authored activity.
  const activeWithin = (since: Date) => ({
    OR: [
      { dailyLogs: { some: { createdAt: { gte: since } } } },
      { reflections: { some: { createdAt: { gte: since } } } },
      { yuiConversations: { some: { createdAt: { gte: since }, role: "user" } } },
      { yuiReflections: { some: { createdAt: { gte: since } } } },
    ],
  });

  // 1. Retention rate calculation
  const [
    usersRegistered7d,
    usersRegistered30d,
    active7dUsers,
    active30dUsers,
    totalProgress,
    completedProgress,
    totalYuiRecommendations,
    respondedYuiRecommendations,
    totalUsers,
    activeUsersPast7d
  ] = await Promise.all([
    // Count of users registered >= 7 days ago
    prisma.user.count({ where: { createdAt: { lte: sevenDaysAgo } } }),
    // Count of users registered >= 30 days ago
    prisma.user.count({ where: { createdAt: { lte: thirtyDaysAgo } } }),
    // Users registered >= 7 days ago who are active in last 7 days
    prisma.user.count({
      where: {
        createdAt: { lte: sevenDaysAgo },
        ...activeWithin(sevenDaysAgo),
      }
    }),
    // Users registered >= 30 days ago who are active in last 30 days
    prisma.user.count({
      where: {
        createdAt: { lte: thirtyDaysAgo },
        ...activeWithin(thirtyDaysAgo),
      }
    }),
    // Total UserProgress
    prisma.userProgress.count(),
    // Completed UserProgress
    prisma.userProgress.count({ where: { completed: true } }),
    // YUI recommendations are the current proposal flow. A non-pending
    // status is an explicit member response (accept, reject, or complete).
    prisma.yuiRecommendation.count(),
    prisma.yuiRecommendation.count({ where: { status: { not: "pending" } } }),
    // Total users count
    prisma.user.count(),
    // Active users in past 7 days
    prisma.user.count({ where: activeWithin(sevenDaysAgo) })
  ]);

  // Calculates retention
  const retention7d = usersRegistered7d > 0 ? Math.round((active7dUsers / usersRegistered7d) * 100) : 0;
  const retention30d = usersRegistered30d > 0 ? Math.round((active30dUsers / usersRegistered30d) * 100) : 0;

  // Calculates proposal response rate across legacy content and YUI.
  const totalSuggestions = totalProgress + totalYuiRecommendations;
  const respondedSuggestions = completedProgress + respondedYuiRecommendations;
  const suggestionViewRate = totalSuggestions > 0
    ? Math.round((respondedSuggestions / totalSuggestions) * 100)
    : 0;

  // Calculates reflection rate (active past 7 days / total)
  const reflectionRate = totalUsers > 0 ? Math.round((activeUsersPast7d / totalUsers) * 100) : 0;

  // Calculates saves trend (past 7 days counts)
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return d;
  }).reverse();

  const savesTrend = await Promise.all(
    dates.map(async (date) => {
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);

      const [legacyMemoryCount, yuiMemoryCount] = await Promise.all([
        prisma.userMemory.count({
          where: { createdAt: { gte: date, lt: nextDay } }
        }),
        prisma.yuiMemory.count({
          where: { createdAt: { gte: date, lt: nextDay } }
        }),
      ]);
      const count = legacyMemoryCount + yuiMemoryCount;

      return {
        date: date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" }),
        count
      };
    })
  );

  // Optional feedback table: keep the rest of analytics available before migration.
  let feedback = { helpful: 0, dismissed: 0, busy: 0, notRelevant: 0, later: 0 };
  try {
    const { data: rows, error } = await getSupabaseAdmin()
      .from("yui_unified_action_feedback")
      .select("feedback, dismiss_reason");
    if (!error && rows) {
      feedback = rows.reduce((summary, row) => {
        if (row.feedback === "helpful") summary.helpful += 1;
        if (row.feedback === "dismissed") summary.dismissed += 1;
        if (row.dismiss_reason === "busy") summary.busy += 1;
        if (row.dismiss_reason === "not_relevant") summary.notRelevant += 1;
        if (row.dismiss_reason === "later") summary.later += 1;
        return summary;
      }, feedback);
    }
  } catch {
    // The table is introduced by a separate migration.
  }

  return {
    retention7d,
    retention30d,
    suggestionViewRate,
    reflectionRate,
    savesTrend,
    feedback,
  };
}
