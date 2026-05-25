// ===================================================
// YOHAKU Audit & Security — Type Definitions
// ===================================================

/**
 * Audit event categories.
 * Each category represents a domain of audit activity.
 * Extensible for future domains (organization, moderation, etc.).
 */
export type AuditCategory =
  | "auth"
  | "moderation"
  | "billing"
  | "ai"
  | "admin"
  | "security"
  | "user_management";

/**
 * Audit event severity levels.
 */
export type AuditSeverity = "info" | "warning" | "error" | "critical";

/**
 * Standard audit actions by category.
 * These are the canonical event names used across the system.
 */
export const AuditActions = {
  // Auth events
  AUTH_LOGIN_SUCCESS: "auth.login.success",
  AUTH_LOGIN_FAILED: "auth.login.failed",
  AUTH_LOGOUT: "auth.logout",
  AUTH_SIGNUP: "auth.signup",
  AUTH_SIGNUP_FAILED: "auth.signup.failed",
  AUTH_MAGIC_LINK_SENT: "auth.magic_link.sent",
  AUTH_OAUTH_SUCCESS: "auth.oauth.success",
  AUTH_SESSION_REFRESHED: "auth.session.refreshed",
  AUTH_SESSION_INVALIDATED: "auth.session.invalidated",
  AUTH_PASSWORD_RESET: "auth.password.reset",
  AUTH_MFA_ENABLED: "auth.mfa.enabled",
  AUTH_MFA_DISABLED: "auth.mfa.disabled",

  // Moderation events
  MODERATION_REPORT_CREATED: "moderation.report.created",
  MODERATION_REPORT_RESOLVED: "moderation.report.resolved",
  MODERATION_REPORT_DISMISSED: "moderation.report.dismissed",
  MODERATION_CONTENT_REMOVED: "moderation.content.removed",
  MODERATION_USER_WARNED: "moderation.user.warned",
  MODERATION_USER_SUSPENDED: "moderation.user.suspended",
  MODERATION_USER_BANNED: "moderation.user.banned",

  // Billing events
  BILLING_SUBSCRIPTION_CREATED: "billing.subscription.created",
  BILLING_SUBSCRIPTION_UPDATED: "billing.subscription.updated",
  BILLING_SUBSCRIPTION_CANCELLED: "billing.subscription.cancelled",
  BILLING_PAYMENT_SUCCEEDED: "billing.payment.succeeded",
  BILLING_PAYMENT_FAILED: "billing.payment.failed",
  BILLING_REFUND_ISSUED: "billing.refund.issued",
  BILLING_PLAN_CHANGED: "billing.plan.changed",

  // AI events
  AI_MODEL_DEPLOYED: "ai.model.deployed",
  AI_PROMPT_UPDATED: "ai.prompt.updated",
  AI_JOB_COMPLETED: "ai.job.completed",
  AI_JOB_FAILED: "ai.job.failed",
  AI_RATE_LIMIT_HIT: "ai.rate_limit.hit",
  AI_TOKEN_USAGE: "ai.token.usage",

  // Admin events
  ADMIN_SETTINGS_CHANGED: "admin.settings.changed",
  ADMIN_ROLE_CHANGED: "admin.role.changed",
  ADMIN_PERMISSION_GRANTED: "admin.permission.granted",
  ADMIN_PERMISSION_REVOKED: "admin.permission.revoked",
  ADMIN_CONTENT_PUBLISHED: "admin.content.published",
  ADMIN_CONTENT_UNPUBLISHED: "admin.content.unpublished",
  ADMIN_USER_DELETED: "admin.user.deleted",

  // Security events
  SECURITY_PERMISSION_DENIED: "security.permission.denied",
  SECURITY_ROLE_ESCALATION_ATTEMPT: "security.role_escalation.attempt",
  SECURITY_RATE_LIMIT_EXCEEDED: "security.rate_limit.exceeded",
  SECURITY_SUSPICIOUS_ACTIVITY: "security.suspicious.activity",
  SECURITY_API_KEY_CREATED: "security.api_key.created",
  SECURITY_API_KEY_REVOKED: "security.api_key.revoked",
  SECURITY_ACCOUNT_LOCKED: "security.account.locked",
  SECURITY_MFA_CHALLENGE_FAILED: "security.mfa.challenge.failed",

  // User management events
  USER_CREATED: "user.created",
  USER_PROFILE_UPDATED: "user.profile.updated",
  USER_ACCOUNT_DELETED: "user.account.deleted",
  USER_DISCORD_LINKED: "user.discord.linked",
  USER_DISCORD_UNLINKED: "user.discord.unlinked",
} as const;

export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions];

/**
 * Audit event payload for the logger.
 * This is the input to the audit logging system.
 */
export type AuditEvent = {
  /** Who performed the action (user ID, null for system actions) */
  actorId?: string | null;
  /** Event category */
  category: AuditCategory;
  /** Specific action identifier */
  action: AuditAction | string;
  /** Type of the target resource */
  targetType?: string | null;
  /** ID of the target resource */
  targetId?: string | null;
  /** Severity level */
  severity?: AuditSeverity;
  /** Additional structured data */
  metadata?: Record<string, unknown>;
  /** IP address of the actor */
  ipAddress?: string | null;
  /** User agent of the actor */
  userAgent?: string | null;
  /** Session identifier */
  sessionId?: string | null;
};

/**
 * Audit log record as stored in the database (read model).
 */
export type AuditRecord = {
  id: string;
  actorId: string | null;
  category: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  severity: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  sessionId: string | null;
  createdAt: Date;
  /** Joined actor info (for display) */
  actorEmail?: string | null;
  actorName?: string | null;
};

/**
 * Audit query filters for the admin UI.
 */
export type AuditQuery = {
  category?: AuditCategory | "all";
  severity?: AuditSeverity | "all";
  actorId?: string;
  action?: string;
  targetType?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

/**
 * Audit query result with pagination.
 */
export type AuditQueryResult = {
  records: AuditRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};