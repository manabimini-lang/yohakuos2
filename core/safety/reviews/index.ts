import { prisma } from "@/lib/prisma";
import { ulid } from "ulid";
import type {
  HumanReview,
  ReviewItem,
  RiskAssessment,
  SafetyState,
  EscalationAction,
  RiskLevel,
  SafetySignal,
  RiskScore,
} from "../types";

// ===================================================
// Human Review Queue Management (Prisma Backed)
// ===================================================

/**
 * Maps a Prisma RiskReview record to a HumanReview type.
 */
function mapPrismaToHumanReview(record: any): HumanReview {
  const signals = (record.signals as any) || [];
  const riskScore: RiskScore = {
    score: record.riskScore,
    level: record.riskLevel as RiskLevel,
    reasons: [],
    signals,
  };

  return {
    id: record.id,
    entityType: "user",
    entityId: record.userId,
    riskAssessmentId: record.assessmentId,
    riskScore,
    suggestedState: riskLevelToSafetyState(record.riskLevel as RiskLevel),
    reviewerId: record.assignedTo ?? undefined,
    decision: (record.resolution as any) ?? undefined,
    notes: record.notes ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Maps a Prisma RiskReview record to a ReviewItem type.
 */
function mapPrismaToReviewItem(record: any): ReviewItem {
  const signals = (record.signals as any) || [];
  const riskScore: RiskScore = {
    score: record.riskScore,
    level: record.riskLevel as RiskLevel,
    reasons: [],
    signals,
  };

  return {
    id: ulid(),
    humanReviewId: record.id,
    entityType: "user",
    entityId: record.userId,
    riskScore,
    currentSafetyState: riskLevelToSafetyState(record.riskLevel as RiskLevel),
    suggestedAction: getSuggestedActionFromRiskLevel(record.riskLevel as RiskLevel),
    createdAt: record.createdAt,
    metadata: { riskAssessmentId: record.assessmentId },
  };
}

/**
 * Maps a risk level to safety state.
 */
function riskLevelToSafetyState(riskLevel: RiskLevel): SafetyState {
  switch (riskLevel) {
    case "low":
      return "safe";
    case "medium":
      return "monitoring";
    case "high":
      return "review_required";
    case "critical":
      return "restricted";
    default:
      return "safe";
  }
}

/**
 * Maps risk level to escalation action.
 */
function getSuggestedActionFromRiskLevel(riskLevel: RiskLevel): EscalationAction {
  switch (riskLevel) {
    case "low":
      return "monitoring";
    case "medium":
      return "review_queue";
    case "high":
      return "moderator_escalation";
    case "critical":
      return "safety_restriction";
    default:
      return "monitoring";
  }
}

/**
 * Adds a new review item to the queue.
 */
export async function addToReviewQueue(
  userId: string,
  riskLevel: RiskLevel,
  riskScore: number,
  signals: SafetySignal[],
  assessmentId: string,
): Promise<HumanReview> {
  const record = await prisma.riskReview.create({
    data: {
      userId,
      assessmentId,
      riskLevel,
      riskScore,
      signals: signals as any,
      status: "pending",
    },
  });

  console.log(`[HumanReviewQueue] Added review item ${record.id} for user ${userId}.`);
  return mapPrismaToHumanReview(record);
}

/**
 * Alias for addToReviewQueue used by background workers.
 */
export async function addReviewItemToQueue(
  assessment: RiskAssessment,
  suggestedState: SafetyState,
): Promise<HumanReview> {
  return addToReviewQueue(
    assessment.entityId,
    assessment.riskLevel,
    assessment.riskScore,
    assessment.signals,
    assessment.id,
  );
}

/**
 * Get pending reviews from the database.
 */
export async function getPendingReviews(): Promise<ReviewItem[]> {
  const records = await prisma.riskReview.findMany({
    where: {
      status: { in: ["pending", "in_review"] },
    },
    orderBy: { createdAt: "desc" },
  });

  return records.map(mapPrismaToReviewItem);
}

/**
 * Alias for getPendingReviews.
 */
export async function getPendingReviewItems(): Promise<ReviewItem[]> {
  return getPendingReviews();
}

/**
 * Count pending reviews in the queue.
 */
export async function countPendingReviews(): Promise<number> {
  return prisma.riskReview.count({
    where: {
      status: { in: ["pending", "in_review"] },
    },
  });
}

/**
 * Assign a review item to a moderator.
 */
export async function assignReview(
  reviewId: string,
  reviewerId: string,
): Promise<HumanReview | null> {
  const record = await prisma.riskReview.update({
    where: { id: reviewId },
    data: {
      assignedTo: reviewerId,
      status: "in_review",
    },
  });

  return mapPrismaToHumanReview(record);
}

/**
 * Resolves a review item.
 */
export async function resolveReview(
  reviewId: string,
  decision: "approved" | "rejected" | "escalated",
  reviewerId: string,
  notes?: string,
): Promise<HumanReview | null> {
  const status = decision === "escalated" ? "escalated" : "resolved";

  const record = await prisma.riskReview.update({
    where: { id: reviewId },
    data: {
      status,
      assignedTo: reviewerId,
      notes,
      resolution: decision,
    },
  });

  console.log(`[HumanReviewQueue] Review item ${reviewId} resolved with decision: ${decision}`);
  return mapPrismaToHumanReview(record);
}

/**
 * Alias for resolveReview.
 */
export async function updateReviewItem(
  reviewId: string,
  decision: "approved" | "rejected" | "escalated",
  reviewerId: string,
  notes?: string,
): Promise<HumanReview | null> {
  return resolveReview(reviewId, decision, reviewerId, notes);
}
