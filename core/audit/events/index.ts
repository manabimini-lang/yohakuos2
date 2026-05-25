// ===================================================
// YOHAKU Audit & Security — Typed Audit Events
// ===================================================
//
// These are convenience functions that create typed audit events
// for common operations. They ensure consistent metadata structure
// and reduce boilerplate in service code.
// ===================================================

import type { AuditEvent } from "../types";
import { AuditActions } from "../types";

// ---------------------------------------------------------------------------
// Auth Events
// ---------------------------------------------------------------------------

export function logUserLogin(actorId: string, ipAddress?: string | null, userAgent?: string | null): AuditEvent {
  return {
    actorId,
    category: "auth",
    action: AuditActions.AUTH_LOGIN_SUCCESS,
    severity: "info",
    ipAddress,
    userAgent,
  };
}

export function logFailedLogin(email: string, ipAddress?: string | null, reason?: string): AuditEvent {
  return {
    actorId: null,
    category: "auth",
    action: AuditActions.AUTH_LOGIN_FAILED,
    severity: "warning",
    metadata: { email, reason },
    ipAddress,
  };
}

export function logout(actorId: string): AuditEvent {
  return {
    actorId,
    category: "auth",
    action: AuditActions.AUTH_LOGOUT,
    severity: "info",
  };
}

export function logUserSignUp(actorId: string, email: string): AuditEvent {
  return {
    actorId,
    category: "auth",
    action: AuditActions.AUTH_SIGNUP,
    severity: "info",
    metadata: { email },
  };
}

// ---------------------------------------------------------------------------
// Security Events
// ---------------------------------------------------------------------------

export function logPermissionDenied(
  actorId: string,
  requiredPermission: string,
  targetPath?: string,
  ipAddress?: string | null,
): AuditEvent {
  return {
    actorId,
    category: "security",
    action: AuditActions.SECURITY_PERMISSION_DENIED,
    severity: "warning",
    metadata: { requiredPermission, targetPath },
    ipAddress,
  };
}

export function logRoleEscalationAttempt(
  actorId: string,
  attemptedRole: string,
  ipAddress?: string | null,
): AuditEvent {
  return {
    actorId,
    category: "security",
    action: AuditActions.SECURITY_ROLE_ESCALATION_ATTEMPT,
    severity: "critical",
    metadata: { attemptedRole },
    ipAddress,
  };
}

export function logSuspiciousActivity(
  actorId: string,
  description: string,
  ipAddress?: string | null,
  metadata?: Record<string, unknown>,
): AuditEvent {
  return {
    actorId,
    category: "security",
    action: AuditActions.SECURITY_SUSPICIOUS_ACTIVITY,
    severity: "error",
    metadata: { description, ...metadata },
    ipAddress,
  };
}

export function logAccountLocked(
  actorId: string,
  reason: string,
  ipAddress?: string | null,
): AuditEvent {
  return {
    actorId,
    category: "security",
    action: AuditActions.SECURITY_ACCOUNT_LOCKED,
    severity: "error",
    metadata: { reason },
    ipAddress,
  };
}

export function logApiKeyCreated(actorId: string, keyName: string): AuditEvent {
  return {
    actorId,
    category: "security",
    action: AuditActions.SECURITY_API_KEY_CREATED,
    severity: "info",
    metadata: { keyName },
  };
}

// ---------------------------------------------------------------------------
// Admin & Role Events
// ---------------------------------------------------------------------------

export function logRoleChange(
  actorId: string,
  targetUserId: string,
  oldRole: string,
  newRole: string,
): AuditEvent {
  return {
    actorId,
    category: "admin",
    action: AuditActions.ADMIN_ROLE_CHANGED,
    severity: "warning",
    targetType: "user",
    targetId: targetUserId,
    metadata: { oldRole, newRole },
  };
}

export function logPermissionGranted(
  actorId: string,
  targetUserId: string,
  permission: string,
): AuditEvent {
  return {
    actorId,
    category: "admin",
    action: AuditActions.ADMIN_PERMISSION_GRANTED,
    severity: "warning",
    targetType: "user",
    targetId: targetUserId,
    metadata: { permission },
  };
}

export function logPermissionRevoked(
  actorId: string,
  targetUserId: string,
  permission: string,
): AuditEvent {
  return {
    actorId,
    category: "admin",
    action: AuditActions.ADMIN_PERMISSION_REVOKED,
    severity: "warning",
    targetType: "user",
    targetId: targetUserId,
    metadata: { permission },
  };
}

export function logSettingsChanged(
  actorId: string,
  settingKey: string,
  oldValue?: unknown,
  newValue?: unknown,
): AuditEvent {
  return {
    actorId,
    category: "admin",
    action: AuditActions.ADMIN_SETTINGS_CHANGED,
    severity: "info",
    targetType: "settings",
    metadata: { settingKey, oldValue, newValue },
  };
}

// ---------------------------------------------------------------------------
// Moderation Events
// ---------------------------------------------------------------------------

export function logModerationAction(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: Record<string, unknown>,
): AuditEvent {
  const actionMap: Record<string, string> = {
    resolve: AuditActions.MODERATION_REPORT_RESOLVED,
    dismiss: AuditActions.MODERATION_REPORT_DISMISSED,
    remove: AuditActions.MODERATION_CONTENT_REMOVED,
    warn: AuditActions.MODERATION_USER_WARNED,
    suspend: AuditActions.MODERATION_USER_SUSPENDED,
    ban: AuditActions.MODERATION_USER_BANNED,
  };

  return {
    actorId,
    category: "moderation",
    action: actionMap[action] || `moderation.${action}`,
    severity: action === "ban" ? "error" : "warning",
    targetType,
    targetId,
    metadata: details,
  };
}

// ---------------------------------------------------------------------------
// Billing Events
// ---------------------------------------------------------------------------

export function logBillingAction(
  actorId: string,
  action: string,
  targetId: string,
  details?: Record<string, unknown>,
): AuditEvent {
  const actionMap: Record<string, string> = {
    created: AuditActions.BILLING_SUBSCRIPTION_CREATED,
    updated: AuditActions.BILLING_SUBSCRIPTION_UPDATED,
    cancelled: AuditActions.BILLING_SUBSCRIPTION_CANCELLED,
    payment_succeeded: AuditActions.BILLING_PAYMENT_SUCCEEDED,
    payment_failed: AuditActions.BILLING_PAYMENT_FAILED,
    refunded: AuditActions.BILLING_REFUND_ISSUED,
    plan_changed: AuditActions.BILLING_PLAN_CHANGED,
  };

  return {
    actorId,
    category: "billing",
    action: actionMap[action] || `billing.${action}`,
    severity: action === "payment_failed" ? "error" : "info",
    targetType: "subscription",
    targetId,
    metadata: details,
  };
}

// ---------------------------------------------------------------------------
// AI Events
// ---------------------------------------------------------------------------

export function logAIAction(
  actorId: string,
  action: string,
  details?: Record<string, unknown>,
): AuditEvent {
  const actionMap: Record<string, string> = {
    prompt_updated: AuditActions.AI_PROMPT_UPDATED,
    job_completed: AuditActions.AI_JOB_COMPLETED,
    job_failed: AuditActions.AI_JOB_FAILED,
    rate_limited: AuditActions.AI_RATE_LIMIT_HIT,
  };

  return {
    actorId,
    category: "ai",
    action: actionMap[action] || `ai.${action}`,
    severity: action === "job_failed" ? "error" : "info",
    metadata: details,
  };
}

// ---------------------------------------------------------------------------
// User Management Events
// ---------------------------------------------------------------------------

export function logUserDeleted(actorId: string, targetUserId: string): AuditEvent {
  return {
    actorId,
    category: "user_management",
    action: AuditActions.USER_ACCOUNT_DELETED,
    severity: "error",
    targetType: "user",
    targetId: targetUserId,
  };
}