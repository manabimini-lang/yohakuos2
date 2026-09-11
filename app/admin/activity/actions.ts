"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractPermissionsFromSession, hasPermission, hasMinRoleLevel } from "@/lib/permissions/helpers";
import type { Permission } from "@/lib/permissions/types";
import { revalidatePath } from "next/cache";

async function requireActivityAccess(permission: Permission = "view_analytics") {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const extracted = extractPermissionsFromSession(session);
  if (!extracted || (!hasMinRoleLevel(extracted.roles, "admin") && !hasPermission(extracted.permissions, permission))) {
    throw new Error("Forbidden");
  }
  return { session, actorId: extracted.userId };
}

async function audit(actorId: string, action: string, targetType: string, targetId: string) {
  await prisma.auditLog.create({
    data: { actorId, category: "admin", action, targetType, targetId, severity: "info" },
  });
}

export async function getActivityHubData() {
  await requireActivityAccess();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  try {
  const [insights, campaigns, hypotheses, reports, knowledgeCount] = await Promise.all([
    prisma.adminInsight.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.newsletterCampaign.findMany({ orderBy: { updatedAt: "desc" }, take: 8 }),
    prisma.productHypothesis.findMany({ orderBy: { updatedAt: "desc" }, take: 8 }),
    prisma.activityReport.findMany({ orderBy: { periodEnd: "desc" }, take: 6 }),
    prisma.knowledgeContent.count(),
  ]);
  let snapshots: Awaited<ReturnType<typeof prisma.communityReflectionSnapshot.findMany>> = [];
  try {
    snapshots = await prisma.communityReflectionSnapshot.findMany({ orderBy: { periodEnd: "desc" }, take: 3 });
  } catch (error) {
    console.error("[activity-os] snapshots unavailable", error);
  }
  let metricsReady = false;
  let activity: [number, number, number, number, number, number, { _avg: { openRate: number | null; clickRate: number | null; returnRate: number | null } }] = [0, 0, 0, 0, 0, 0, { _avg: { openRate: null, clickRate: null, returnRate: null } }];
  try {
    activity = await Promise.all([
      prisma.user.count({ where: { OR: [{ dailyLogs: { some: { createdAt: { gte: thirtyDaysAgo } } } }, { reflections: { some: { createdAt: { gte: thirtyDaysAgo } } } }, { yuiConversations: { some: { createdAt: { gte: thirtyDaysAgo } } } }, { yuiReflections: { some: { createdAt: { gte: thirtyDaysAgo } } } }] } }),
      prisma.user.count({ where: { OR: [{ dailyLogs: { some: { createdAt: { gte: sevenDaysAgo } } } }, { reflections: { some: { createdAt: { gte: sevenDaysAgo } } } }, { yuiConversations: { some: { createdAt: { gte: sevenDaysAgo } } } }, { yuiReflections: { some: { createdAt: { gte: sevenDaysAgo } } } }] } }),
      prisma.dailyLog.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.reflection.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.userProgress.count({ where: { completed: true, completedAt: { gte: thirtyDaysAgo } } }),
      prisma.yuiConversation.count({ where: { createdAt: { gte: thirtyDaysAgo }, role: "user" } }),
      prisma.newsletterCampaign.aggregate({ _avg: { openRate: true, clickRate: true, returnRate: true } }),
    ]) as typeof activity;
    metricsReady = true;
  } catch (error) {
    console.error("[activity-os] activity metrics unavailable", error);
  }
  return { storageReady: true, metricsReady, insights, campaigns, hypotheses, reports, knowledgeCount, snapshots, activity: { activeUsers30d: activity[0], activeUsers7d: activity[1], logs30d: activity[2], reflections30d: activity[3], completedContents30d: activity[4], yuiConversations30d: activity[5], newsletterAverages: activity[6]._avg } };
  } catch (error) {
    console.error("[activity-os] failed to load activity hub data", error);
    return {
      storageReady: false, metricsReady: false,
      insights: [], campaigns: [], hypotheses: [], reports: [], knowledgeCount: 0, snapshots: [],
      activity: { activeUsers30d: 0, activeUsers7d: 0, logs30d: 0, reflections30d: 0, completedContents30d: 0, yuiConversations30d: 0, newsletterAverages: { openRate: null, clickRate: null, returnRate: null } },
    };
  }
}

export async function createAdminInsight(formData: FormData) {
  const { actorId } = await requireActivityAccess("manage_product_learning");
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  if (!title || !summary) throw new Error("タイトルと要約は必須です");
  const insight = await prisma.adminInsight.create({
    data: {
      title,
      summary,
      theme: String(formData.get("theme") ?? "").trim() || null,
      sourceType: String(formData.get("sourceType") ?? "manual"),
      audience: String(formData.get("audience") ?? "").trim() || null,
      usagePurposes: String(formData.get("usagePurposes") ?? "").split(",").map((v) => v.trim()).filter(Boolean),
      observedCount: Math.max(0, Number(formData.get("observedCount") ?? 0) || 0),
      anonymizationStatus: "review_required",
      status: "draft",
      reviewedBy: null,
    },
  });
  await audit(actorId, "insight.create", "admin_insight", insight.id);
  revalidatePath("/admin/activity");
}

export async function createNewsletterCampaign(formData: FormData) {
  const { actorId } = await requireActivityAccess("manage_comms");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("企画名は必須です");
  const campaign = await prisma.newsletterCampaign.create({
    data: {
      title,
      purpose: String(formData.get("purpose") ?? "").trim() || null,
      segment: String(formData.get("segment") ?? "all"),
      status: "draft",
      createdBy: actorId,
    },
  });
  await audit(actorId, "newsletter.create", "newsletter_campaign", campaign.id);
  revalidatePath("/admin/activity");
  revalidatePath("/admin/newsletter");
}

export async function createProductHypothesis(formData: FormData) {
  const { actorId } = await requireActivityAccess("manage_product_learning");
  const title = String(formData.get("title") ?? "").trim();
  const problem = String(formData.get("problem") ?? "").trim();
  const hypothesis = String(formData.get("hypothesis") ?? "").trim();
  if (!title || !problem || !hypothesis) throw new Error("タイトル・課題・仮説は必須です");
  const item = await prisma.productHypothesis.create({
    data: {
      title,
      problem,
      hypothesis,
      evidence: String(formData.get("evidence") ?? "").trim() || null,
      targetSegment: String(formData.get("targetSegment") ?? "").trim() || null,
      successMetric: String(formData.get("successMetric") ?? "").trim() || null,
      ownerId: actorId,
    },
  });
  await audit(actorId, "product_hypothesis.create", "product_hypothesis", item.id);
  revalidatePath("/admin/activity");
  revalidatePath("/admin/product-learning");
}

export async function createActivityReport(formData: FormData) {
  const { actorId } = await requireActivityAccess("publish_reports");
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const periodStart = new Date(String(formData.get("periodStart") ?? ""));
  const periodEnd = new Date(String(formData.get("periodEnd") ?? ""));
  if (!title || !summary || Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
    throw new Error("タイトル・期間・概要は必須です");
  }
  const report = await prisma.activityReport.create({
    data: { title, summary, periodStart, periodEnd, createdBy: actorId },
  });
  await audit(actorId, "activity_report.create", "activity_report", report.id);
  revalidatePath("/admin/activity");
  revalidatePath("/admin/reports");
}

const INSIGHT_TRANSITIONS: Record<string, string[]> = {
  draft: ["review_required"],
  review_required: ["approved", "rejected"],
  approved: ["published", "archived"],
  published: ["archived"],
  rejected: ["draft"],
};

const SIMPLE_TRANSITIONS: Record<string, string[]> = {
  draft: ["planned", "archived"],
  planned: ["in_progress", "archived"],
  in_progress: ["completed", "archived"],
  completed: ["archived"],
  backlog: ["planned", "archived"],
};

export async function transitionInsight(id: string, nextStatus: string) {
  const { actorId } = await requireActivityAccess("manage_product_learning");
  const current = await prisma.adminInsight.findUnique({ where: { id } });
  if (!current || !INSIGHT_TRANSITIONS[current.status]?.includes(nextStatus)) throw new Error("許可されていない状態遷移です");
  if (nextStatus === "approved" && current.observedCount < current.minimumGroupSize) throw new Error(`最低集計人数（${current.minimumGroupSize}人）に達していません`);
  const approved = nextStatus === "approved" || nextStatus === "published";
  await prisma.adminInsight.update({ where: { id }, data: { status: nextStatus, reviewedBy: approved ? actorId : current.reviewedBy, reviewedAt: approved ? new Date() : current.reviewedAt, publishedAt: nextStatus === "published" ? new Date() : current.publishedAt } });
  await audit(actorId, `insight.${nextStatus}`, "admin_insight", id);
  revalidatePath("/admin/activity");
  revalidatePath("/admin/product-learning");
}

export async function updateInsightReview(id: string, formData: FormData) {
  const { actorId } = await requireActivityAccess("manage_product_learning");
  const current = await prisma.adminInsight.findUnique({ where: { id } });
  if (!current) throw new Error("インサイトが見つかりません");
  const observedCount = Math.max(0, Number(formData.get("observedCount") ?? current.observedCount) || 0);
  const minimumGroupSize = Math.max(1, Number(formData.get("minimumGroupSize") ?? current.minimumGroupSize) || current.minimumGroupSize);
  await prisma.adminInsight.update({ where: { id }, data: { observedCount, minimumGroupSize, reviewNotes: String(formData.get("reviewNotes") ?? "").trim() || null } });
  await audit(actorId, "insight.review_update", "admin_insight", id);
  revalidatePath("/admin/product-learning");
  revalidatePath("/admin/activity");
}

export async function transitionNewsletter(id: string, nextStatus: string) {
  const { actorId } = await requireActivityAccess("manage_comms");
  const current = await prisma.newsletterCampaign.findUnique({ where: { id } });
  if (!current || !["draft", "planned"].includes(current.status) || !["planned", "ready", "archived"].includes(nextStatus)) throw new Error("許可されていない状態遷移です");
  await prisma.newsletterCampaign.update({ where: { id }, data: { status: nextStatus } });
  await audit(actorId, `newsletter.${nextStatus}`, "newsletter_campaign", id);
  revalidatePath("/admin/newsletter");
  revalidatePath("/admin/activity");
}

export async function transitionProductHypothesis(id: string, nextStatus: string) {
  const { actorId } = await requireActivityAccess("manage_product_learning");
  const current = await prisma.productHypothesis.findUnique({ where: { id } });
  if (!current || !SIMPLE_TRANSITIONS[current.status]?.includes(nextStatus)) throw new Error("許可されていない状態遷移です");
  await prisma.productHypothesis.update({ where: { id }, data: { status: nextStatus } });
  await audit(actorId, `product_hypothesis.${nextStatus}`, "product_hypothesis", id);
  revalidatePath("/admin/product-learning");
  revalidatePath("/admin/activity");
}

export async function transitionActivityReport(id: string, nextStatus: string) {
  const { actorId } = await requireActivityAccess("publish_reports");
  const current = await prisma.activityReport.findUnique({ where: { id } });
  if (!current || !["draft", "review_required"].includes(current.status) || !["review_required", "published", "archived"].includes(nextStatus)) throw new Error("許可されていない状態遷移です");
  await prisma.activityReport.update({ where: { id }, data: { status: nextStatus, publishedAt: nextStatus === "published" ? new Date() : current.publishedAt } });
  await audit(actorId, `activity_report.${nextStatus}`, "activity_report", id);
  revalidatePath("/admin/reports");
  revalidatePath("/admin/activity");
}

export async function updateNewsletterCampaign(id: string, formData: FormData) {
  const { actorId } = await requireActivityAccess("manage_comms");
  const current = await prisma.newsletterCampaign.findUnique({ where: { id } });
  if (!current) throw new Error("企画が見つかりません");
  const numberOrNull = (value: FormDataEntryValue | null) => {
    const n = Number(value);
    return value && String(value).trim() !== "" && Number.isFinite(n) ? n : null;
  };
  await prisma.newsletterCampaign.update({
    where: { id },
    data: {
      subject: String(formData.get("subject") ?? "").trim() || null,
      body: String(formData.get("body") ?? "").trim() || null,
      openRate: numberOrNull(formData.get("openRate")),
      clickRate: numberOrNull(formData.get("clickRate")),
      returnRate: numberOrNull(formData.get("returnRate")),
      unsubscribeRate: numberOrNull(formData.get("unsubscribeRate")),
      learnings: String(formData.get("learnings") ?? "").trim() || null,
    },
  });
  await audit(actorId, "newsletter.update", "newsletter_campaign", id);
  revalidatePath("/admin/newsletter");
  revalidatePath("/admin/activity");
}

export async function updateProductHypothesis(id: string, formData: FormData) {
  const { actorId } = await requireActivityAccess("manage_product_learning");
  const current = await prisma.productHypothesis.findUnique({ where: { id } });
  if (!current) throw new Error("仮説が見つかりません");
  await prisma.productHypothesis.update({
    where: { id },
    data: {
      evidence: String(formData.get("evidence") ?? "").trim() || null,
      result: String(formData.get("result") ?? "").trim() || null,
      successMetric: String(formData.get("successMetric") ?? "").trim() || null,
    },
  });
  await audit(actorId, "product_hypothesis.update", "product_hypothesis", id);
  revalidatePath("/admin/product-learning");
  revalidatePath("/admin/activity");
}

export async function createHypothesisFromInsight(insightId: string) {
  const { actorId } = await requireActivityAccess("manage_product_learning");
  const insight = await prisma.adminInsight.findUnique({ where: { id: insightId } });
  if (!insight || !["approved", "published"].includes(insight.status)) throw new Error("承認済みインサイトのみ仮説化できます");
  const item = await prisma.productHypothesis.create({
    data: {
      title: `${insight.title}からの製品仮説`,
      problem: insight.summary,
      hypothesis: `このテーマに関する体験を改善すると、${insight.audience ?? "対象ユーザー"}の継続的な振り返りにつながる`,
      evidence: `AdminInsight: ${insight.id}`,
      targetSegment: insight.audience,
      status: "backlog",
      ownerId: actorId,
    },
  });
  await audit(actorId, "product_hypothesis.create_from_insight", "product_hypothesis", item.id);
  revalidatePath("/admin/activity");
  revalidatePath("/admin/product-learning");
}
