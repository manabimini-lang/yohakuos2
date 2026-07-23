import { auth } from "@/lib/auth";
import type {
  CreateYuiGoalInput,
  CreateYuiConversationInput,
  CreateYuiCalendarEventInput,
  CreateYuiCalendarActionInput,
  CreateYuiEventInput,
  CreateYuiMemoryInput,
  CreateYuiMilestoneInput,
  CreateYuiRecommendationInput,
  CreateYuiSuggestedTimeBlockInput,
  YuiConnectionInput,
} from "./models";
import {
  buildYuiToday,
  approveYuiMemoryCandidate,
  createYuiConversation,
  createYuiDecision,
  createYuiGoal,
  createYuiMilestone,
  createYuiEvent,
  createYuiConnection,
  createYuiCalendarEvent,
  createYuiCalendarAction,
  createYuiSuggestedTimeBlock,
  createYuiReflectionFromRecentWindow,
  createYuiMemory,
  getLatestYuiReflection,
  listYuiCalendarEvents,
  listYuiCalendarActions,
  listYuiConnections,
  listYuiGoals,
  getYuiMemoryCandidateById,
  getYuiProfile,
  listYuiMilestones,
  listYuiReflections,
  listYuiMemoryCandidates,
  listYuiSuggestedTimeBlocks,
  listYuiConversations,
  listYuiMemories,
  listYuiDecisions,
  rejectYuiMemoryCandidate,
  updateYuiSuggestedTimeBlockStatus,
  updateYuiProfile,
  listYuiEvents,
  updateYuiConnectionStatus,
  updateYuiCalendarActionStatus,
} from "./service";
import {
  generateYuiRecommendation,
  listYuiRecommendations,
  updateYuiRecommendationStatus,
} from "./recommendation_service";
import type { YuiDecisionInput, YuiProfileSettings } from "./models";

export async function requireYuiSession() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function getYuiMemories(limit = 20) {
  const session = await requireYuiSession();
  return listYuiMemories(session.user.id, limit);
}

export async function postYuiMemory(input: CreateYuiMemoryInput) {
  const session = await requireYuiSession();
  return createYuiMemory(session.user, input);
}

export async function getYuiConversations(limit = 50) {
  const session = await requireYuiSession();
  return listYuiConversations(session.user.id, limit);
}

export async function postYuiConversation(input: CreateYuiConversationInput) {
  const session = await requireYuiSession();
  return createYuiConversation(session.user, input);
}

export async function getLatestYuiReflectionForCurrentUser() {
  const session = await requireYuiSession();
  return getLatestYuiReflection(session.user.id);
}

export async function getYuiReflections(limit = 20) {
  const session = await requireYuiSession();
  return listYuiReflections(session.user.id, limit);
}

export async function getYuiProfileForCurrentUser() {
  const session = await requireYuiSession();
  return getYuiProfile(session.user.id);
}

export async function patchYuiProfile(input: Partial<YuiProfileSettings>) {
  const session = await requireYuiSession();
  return updateYuiProfile(session.user, input);
}

export async function getYuiToday() {
  const session = await requireYuiSession();
  return buildYuiToday(session.user.id);
}

export async function getYuiMemoryCandidates(limit = 10) {
  const session = await requireYuiSession();
  return listYuiMemoryCandidates(session.user.id, "pending", limit);
}

export async function approveMemoryCandidate(candidateId: string) {
  const session = await requireYuiSession();
  return approveYuiMemoryCandidate(session.user, candidateId);
}

export async function rejectMemoryCandidate(candidateId: string) {
  const session = await requireYuiSession();
  return rejectYuiMemoryCandidate(session.user, candidateId);
}

export async function getMemoryCandidate(candidateId: string) {
  const session = await requireYuiSession();
  return getYuiMemoryCandidateById(session.user.id, candidateId);
}

export async function getYuiDecisions(limit = 20) {
  const session = await requireYuiSession();
  return listYuiDecisions(session.user.id, limit);
}

export async function postYuiDecision(input: YuiDecisionInput) {
  const session = await requireYuiSession();
  return createYuiDecision(session.user, input);
}

export async function postYuiReflect() {
  const session = await requireYuiSession();
  return createYuiReflectionFromRecentWindow(session.user);
}

export async function getYuiEvents(limit = 50) {
  const session = await requireYuiSession();
  return listYuiEvents(session.user.id, limit);
}

export async function getYuiGoals(limit = 20) {
  const session = await requireYuiSession();
  return listYuiGoals(session.user.id, limit);
}

export async function postYuiGoal(input: CreateYuiGoalInput) {
  const session = await requireYuiSession();
  return createYuiGoal(session.user, input);
}

export async function getYuiMilestones(goalId?: string, limit = 50) {
  const session = await requireYuiSession();
  return listYuiMilestones(session.user.id, goalId, limit);
}

export async function postYuiMilestone(input: CreateYuiMilestoneInput) {
  const session = await requireYuiSession();
  return createYuiMilestone(session.user, input);
}

export async function postYuiEvent(input: CreateYuiEventInput) {
  const session = await requireYuiSession();
  return createYuiEvent(session.user, input);
}

export async function getYuiConnections() {
  const session = await requireYuiSession();
  return listYuiConnections(session.user.id);
}

export async function postYuiConnection(input: YuiConnectionInput) {
  const session = await requireYuiSession();
  return createYuiConnection(session.user, input);
}

export async function patchYuiConnection(connectionId: string, status: string) {
  const session = await requireYuiSession();
  return updateYuiConnectionStatus(session.user, connectionId, status);
}

export async function getYuiCalendarEvents(limit = 50) {
  const session = await requireYuiSession();
  return listYuiCalendarEvents(session.user.id, { limit });
}

export async function postYuiCalendarEvent(input: CreateYuiCalendarEventInput) {
  const session = await requireYuiSession();
  return createYuiCalendarEvent(session.user, input);
}

export async function getYuiTimeBlocks(status?: string, limit = 20) {
  const session = await requireYuiSession();
  return listYuiSuggestedTimeBlocks(session.user.id, status ? { status, limit } : { limit });
}

export async function postYuiTimeBlock(input: CreateYuiSuggestedTimeBlockInput) {
  const session = await requireYuiSession();
  return createYuiSuggestedTimeBlock(session.user, input);
}

export async function patchYuiTimeBlock(blockId: string, status: string) {
  const session = await requireYuiSession();
  return updateYuiSuggestedTimeBlockStatus(session.user, blockId, status);
}

export async function getYuiRecommendations(status?: string, limit = 20) {
  const session = await requireYuiSession();
  return listYuiRecommendations(session.user.id, status ? { status, limit } : { limit });
}

export async function postYuiRecommendation(
  input?: CreateYuiRecommendationInput & { context?: string },
) {
  const session = await requireYuiSession();
  return generateYuiRecommendation(session.user, input);
}

export async function patchYuiRecommendation(recommendationId: string, status: string) {
  const session = await requireYuiSession();
  return updateYuiRecommendationStatus(session.user, recommendationId, status);
}

export async function getYuiCalendarActions(status?: string, limit = 20) {
  const session = await requireYuiSession();
  return listYuiCalendarActions(session.user.id, status ? { status, limit } : { limit });
}

export async function postYuiCalendarAction(input: CreateYuiCalendarActionInput) {
  const session = await requireYuiSession();
  return createYuiCalendarAction(session.user, input);
}

export async function patchYuiCalendarAction(actionId: string, status: string) {
  const session = await requireYuiSession();
  return updateYuiCalendarActionStatus(session.user, actionId, status);
}

export async function scheduleYuiCalendarAction(actionId: string) {
  const session = await requireYuiSession();
  const { scheduleYuiCalendarAction: scheduleAction } = await import("./service");
  return scheduleAction(session.user, actionId);
}

export async function getYuiContext() {
  const session = await requireYuiSession();
  const { computeYuiContext } = await import("./context_service");
  return computeYuiContext(session.user.id);
}

export async function getYuiMorningBrief() {
  const session = await requireYuiSession();
  const { getMorningBrief } = await import("./brief_service");
  return getMorningBrief(session.user.id);
}

export async function getYuiNotificationSettings() {
  const session = await requireYuiSession();
  const { getNotificationSettings } = await import("./notification_service");
  return getNotificationSettings(session.user.id);
}

export async function postYuiNotificationSettings(input: Record<string, unknown>) {
  const session = await requireYuiSession();
  const { saveNotificationSettings } = await import("./notification_service");
  return saveNotificationSettings(session.user.id, input);
}

export async function getYuiNotificationPreviews() {
  const session = await requireYuiSession();
  const { generateNotificationPreviews } = await import("./notification_delivery_service");
  return generateNotificationPreviews(session.user.id);
}

export async function getGoogleCalendarStatusForUser() {
  const session = await requireYuiSession();
  const { getGoogleCalendarStatus } = await import("./google_calendar_service");
  return getGoogleCalendarStatus(session.user.id);
}

export async function syncGoogleCalendarForUser() {
  const session = await requireYuiSession();
  const { syncGoogleCalendarEvents } = await import("./google_calendar_service");
  return syncGoogleCalendarEvents(session.user.id);
}

export async function postYuiCompleteOnboarding() {
  const session = await requireYuiSession();
  const { completeYuiOnboarding } = await import("./service");
  return completeYuiOnboarding(session.user.id);
}

export async function getYuiContinuity() {
  const session = await requireYuiSession();
  const { computeYuiContinuity } = await import("./continuity_service");
  return computeYuiContinuity(session.user.id);
}

export async function getNotificationDeliveryStatusForUser() {
  const session = await requireYuiSession();
  const { getNotificationDeliveryStatus } = await import("./notification_scheduler");
  return getNotificationDeliveryStatus(session.user.id);
}

export async function triggerNotificationDeliveryForUser(type: "morning" | "evening") {
  const session = await requireYuiSession();
  const { deliverNotification } = await import("./notification_scheduler");
  return deliverNotification(session.user.id, type);
}



