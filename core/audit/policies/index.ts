// ===================================================
// YOHAKU Audit & Security — Audit Policies
// ===================================================
//
// Retention and access policies for audit data.
// Defines who can view what, and for how long data is kept.
// ===================================================

import type { AuditCategory } from "../types";
import { hasMinRoleLevel, hasPermission } from "@/lib/permissions/helpers";
import type { Permission, SystemRole } from "@/lib/permissions/types";

/**
 * Minimum role level required to view audit logs.
 */
const AUDIT_VIEW_MIN_ROLE: SystemRole = "admin";

/**
 * Minimum role level required to view security audit logs.
 */
const SECURITY_AUDIT_MIN_ROLE: SystemRole = "admin";

/**
 * Permissions required to view each audit category.
 */
const CATEGORY_PERMISSION_MAP: Record<AuditCategory, Permission | null> = {
  auth: null, // All admins can view auth events
  moderation: "manage_reports",
  billing: "manage_billing",
  ai: "manage_ai",
  admin: "manage_system",
  security: null, // Requires admin+ role (checked separately)
  user_management: "manage_users",
};

/**
 * Checks if a user can view audit logs.
 */
export function canViewAuditLogs(
  roles: SystemRole[],
  permissions: Permission[],
): boolean {
  return hasMinRoleLevel(roles, AUDIT_VIEW_MIN_ROLE);
}

/**
 * Checks if a user can view a specific audit category.
 */
export function canViewAuditCategory(
  roles: SystemRole[],
  permissions: Permission[],
  category: AuditCategory,
): boolean {
  if (!hasMinRoleLevel(roles, AUDIT_VIEW_MIN_ROLE)) return false;

  // Security audit requires elevated access
  if (category === "security" && !hasMinRoleLevel(roles, SECURITY_AUDIT_MIN_ROLE)) {
    return false;
  }

  const requiredPermission = CATEGORY_PERMISSION_MAP[category];
  if (requiredPermission && !hasPermission(permissions, requiredPermission)) {
    return false;
  }

  return true;
}

/**
 * Retention periods for audit categories (in days).
 * After this period, logs may be archived or purged.
 */
export const AUDIT_RETENTION_DAYS: Record<AuditCategory, number> = {
  auth: 90,
  moderation: 365, // Compliance requirement
  billing: 365 * 7, // Tax compliance (7 years)
  ai: 30,
  admin: 365,
  security: 365 * 2, // Security incidents kept longer
  user_management: 365,
};

/**
 * Returns the retention period for a given category.
 */
export function getRetentionDays(category: AuditCategory): number {
  return AUDIT_RETENTION_DAYS[category] ?? 90;
}