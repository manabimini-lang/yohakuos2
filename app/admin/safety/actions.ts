"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hasMinRoleLevel } from "@/lib/permissions/helpers";
import {
  applySafetyStateTransition,
  resolveReview,
  emitReviewResolved,
  createSignal,
} from "@/core/safety";
import { queue } from "@/services/queue";
import type { SafetyState, RiskLevel, SignalType } from "@/core/safety/types";

/**
 * Helper to verify that the caller is an admin or moderator.
 */
async function verifyAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  
  // Extract user roles from session (RBAC foundation)
  const roles = (session.user as any).roles || [];
  const oldRole = (session.user as any).role;
  
  const isModerator = hasMinRoleLevel(roles, "moderator") || oldRole === "ADMIN" || oldRole === "SUPER_ADMIN";
  if (!isModerator) {
    throw new Error("Forbidden");
  }
  return session;
}

/**
 * Fetches dashboard overview metrics, recent reviews, state transitions, and signal logs.
 */
export async function getSafetyOverview() {
  await verifyAdmin();

  // 1. Fetch safety state transition history to determine active states
  const transitions = await prisma.stateTransition.findMany({
    where: { entityType: "safety" },
    orderBy: { createdAt: "desc" },
  });

  // Calculate current safety state for each user
  const userStateMap = new Map<string, string>();
  for (const t of transitions) {
    if (!userStateMap.has(t.entityId)) {
      userStateMap.set(t.entityId, t.toState);
    }
  }

  // Count instances of each state
  const counts = {
    safe: 0,
    monitoring: 0,
    review_required: 0,
    restricted: 0,
    escalated: 0,
  };

  userStateMap.forEach((stateName) => {
    if (stateName in counts) {
      counts[stateName as keyof typeof counts]++;
    }
  });

  const totalUsers = await prisma.user.count();
  const nonSafeCount =
    counts.monitoring + counts.review_required + counts.restricted + counts.escalated;
  counts.safe = Math.max(0, totalUsers - nonSafeCount);

  // 2. Count queue statistics
  const pendingReviews = await prisma.riskReview.count({
    where: { status: { in: ["pending", "in_review"] } },
  });

  const escalatedCases = await prisma.riskReview.count({
    where: { status: "escalated" },
  });

  const activeIncidents = nonSafeCount;

  // 3. Fetch reviews including user profiles
  const reviews = await prisma.riskReview.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const reviewUserIds = Array.from(new Set(reviews.map((r) => r.userId)));
  const reviewUsers = await prisma.user.findMany({
    where: { id: { in: reviewUserIds } },
    select: { id: true, name: true, email: true, image: true },
  });
  const reviewUserMap = new Map(reviewUsers.map((u) => [u.id, u]));

  const reviewsWithUser = reviews.map((r) => ({
    id: r.id,
    userId: r.userId,
    assessmentId: r.assessmentId,
    riskLevel: r.riskLevel as RiskLevel,
    riskScore: r.riskScore,
    signals: (r.signals as any) || [],
    status: r.status,
    assignedTo: r.assignedTo,
    notes: r.notes,
    resolution: r.resolution,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    user: reviewUserMap.get(r.userId) || {
      name: "Unknown User",
      email: r.userId,
      image: null,
    },
  }));

  // 4. Fetch recent state transitions with user profiles
  const recentTransitions = await prisma.stateTransition.findMany({
    where: { entityType: "safety" },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const transUserIds = Array.from(new Set(recentTransitions.map((t) => t.entityId)));
  const transUsers = await prisma.user.findMany({
    where: { id: { in: transUserIds } },
    select: { id: true, name: true, email: true },
  });
  const transUserMap = new Map(transUsers.map((u) => [u.id, u]));

  const transitionsWithUser = recentTransitions.map((t) => ({
    id: t.id,
    entityId: t.entityId,
    fromState: t.fromState,
    toState: t.toState,
    reason: t.reason,
    createdAt: t.createdAt.toISOString(),
    user: transUserMap.get(t.entityId) || { name: "Unknown User", email: t.entityId },
  }));

  // 5. Fetch a list of active users to select from in the UI
  const activeUsersList = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return {
    metrics: {
      activeIncidents,
      pendingReviews,
      escalatedCases,
      states: counts,
    },
    reviews: reviewsWithUser,
    transitions: transitionsWithUser,
    users: activeUsersList,
  };
}

/**
 * Resolves a pending risk review from the moderator console.
 */
export async function resolveReviewAction(
  reviewId: string,
  decision: "approved" | "rejected" | "escalated",
  notes: string,
) {
  const session = await verifyAdmin();
  const reviewerId = session.user.id || "moderator";

  const updatedReview = await resolveReview(reviewId, decision, reviewerId, notes);
  if (!updatedReview) {
    throw new Error("Review not found");
  }

  // Trigger state transition based on decision
  let riskLevel: RiskLevel = "low";
  if (decision === "rejected") {
    riskLevel = "critical"; // restricted
  } else if (decision === "escalated") {
    riskLevel = "critical"; // escalated
  }

  const transitionReason = `モデレーター裁定 [${decision}]. メモ: ${notes}`;
  await applySafetyStateTransition(updatedReview.entityId, riskLevel, transitionReason, reviewerId);

  // Emit event
  await emitReviewResolved(updatedReview);

  revalidatePath("/admin/safety");
  return { success: true };
}

/**
 * Manually changes a user's safety state.
 */
export async function transitionSafetyStateAction(
  userId: string,
  targetState: SafetyState,
  reason: string,
) {
  const session = await verifyAdmin();
  const adminId = session.user.id || "admin";

  let riskLevel: RiskLevel = "low";
  switch (targetState) {
    case "safe":
      riskLevel = "low";
      break;
    case "monitoring":
      riskLevel = "medium";
      break;
    case "review_required":
      riskLevel = "high";
      break;
    case "restricted":
    case "escalated":
      riskLevel = "critical";
      break;
  }

  await applySafetyStateTransition(userId, riskLevel, `管理者による手動変更: ${reason}`, adminId);

  revalidatePath("/admin/safety");
  return { success: true };
}

/**
 * Simulates a safety signal and runs the safety pipeline.
 */
export async function triggerSimulatedSignalAction(
  userId: string,
  signalType: SignalType,
  value: number,
  metadata: string,
) {
  const session = await verifyAdmin();
  const adminId = session.user.id || "admin";

  // Create audit log event representing the signal injection
  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      category: "security",
      action: `simulation.inject_signal`,
      targetType: "user",
      targetId: userId,
      severity: value >= 0.7 ? "warning" : "info",
      metadata: {
        signalType,
        value,
        details: metadata,
      },
    },
  });

  // Enqueue safety analysis job to trigger pipeline
  await queue.enqueue({
    jobType: "safety.analysis",
    payload: {
      entityType: "user",
      entityId: userId,
      userId,
      actorId: adminId,
    },
  });

  return { success: true };
}
