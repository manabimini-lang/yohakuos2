// ===================================================
// YOHAKU Audit & Security — Audit Service
// ===================================================
//
// High-level audit service for domain operations.
// Wraps the core audit logger with domain-specific logic.
// ===================================================

import { log, queryAuditLogs, getAuditSummary, getUserAuditLogs } from "@/core/audit/logger";
import type { AuditEvent, AuditQuery, AuditQueryResult, AuditRecord } from "@/core/audit/types";

// Re-export core types and functions
export type { AuditEvent, AuditQuery, AuditQueryResult, AuditRecord } from "@/core/audit/types";

// Re-export typed event creators
export {
  logUserLogin,
  logFailedLogin,
  logRoleChange,
  logModerationAction,
  logBillingAction,
  logPermissionDenied,
  logSettingsChanged,
  logSuspiciousActivity,
  logRoleEscalationAttempt,
  logAccountLocked,
  logApiKeyCreated,
  logUserSignUp,
  logUserDeleted,
  logAIAction,
  logout,
  logPermissionGranted,
  logPermissionRevoked,
} from "@/core/audit/events";

// Re-export logger
export const audit = {
  /** Record a single audit event */
  log,
  /** Record multiple audit events in a transaction */
  logMany: async (events: AuditEvent[]) => {
    const { logMany } = await import("@/core/audit/logger");
    return logMany(events);
  },
  /** Query audit logs with filters */
  query: queryAuditLogs,
  /** Get summary stats for dashboard */
  summary: getAuditSummary,
  /** Get logs for a specific user */
  getUserLogs: getUserAuditLogs,
};