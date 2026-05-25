// ===================================================
// YOHAKU RBAC — Policy Abstraction Layer
// ===================================================
//
// Policies are the HIGHEST level of authorization abstraction.
// Components, pages, and API routes should use these policy functions
// instead of calling hasPermission() directly.
//
// This prevents permission logic from leaking into UI code
// and makes authorization rules discoverable in one place.
// ===================================================

import type { Permission, SystemRole, UserPermissions } from "./types";
import {
  hasPermission,
  hasAllPermissions,
  hasMinRoleLevel,
  createPermissionResult,
  type AuthorizationError,
} from "./helpers";
import { resolvePermissions } from "./helpers";

// ---------------------------------------------------------------------------
// Policy Input Types
// ---------------------------------------------------------------------------

export type PolicyInput = {
  permissions?: Permission[];
  roles?: SystemRole[];
  userId?: string;
};

// ---------------------------------------------------------------------------
// Moderation Policies
// ---------------------------------------------------------------------------

/**
 * Can the user view reports?
 */
export function canReadReports(input: PolicyInput): boolean {
  return hasPermission(input.permissions, "read_reports");
}

/**
 * Can the user manage (respond to / resolve) reports?
 */
export function canManageReports(input: PolicyInput): boolean {
  return hasPermission(input.permissions, "manage_reports");
}

/**
 * Can the user perform full moderation actions?
 * (read + manage reports)
 */
export function canModerateContent(input: PolicyInput): boolean {
  return hasAllPermissions(input.permissions, ["read_reports", "manage_reports"]);
}

// ---------------------------------------------------------------------------
// User Management Policies
// ---------------------------------------------------------------------------

/**
 * Can the user manage other users?
 */
export function canManageUsers(input: PolicyInput): boolean {
  return hasPermission(input.permissions, "manage_users");
}

// ---------------------------------------------------------------------------
// Billing Policies
// ---------------------------------------------------------------------------

/**
 * Can the user manage billing/subscriptions?
 */
export function canManageBilling(input: PolicyInput): boolean {
  return hasPermission(input.permissions, "manage_billing");
}

// ---------------------------------------------------------------------------
// AI Management Policies
// ---------------------------------------------------------------------------

/**
 * Can the user manage AI models/prompts?
 */
export function canManageAI(input: PolicyInput): boolean {
  return hasPermission(input.permissions, "manage_ai");
}

// ---------------------------------------------------------------------------
// Role Management Policies
// ---------------------------------------------------------------------------

/**
 * Can the user manage roles & permissions assignments?
 */
export function canManageRoles(input: PolicyInput): boolean {
  return hasPermission(input.permissions, "manage_roles");
}

// ---------------------------------------------------------------------------
// Analytics Policies
// ---------------------------------------------------------------------------

/**
 * Can the user view analytics?
 */
export function canViewAnalytics(input: PolicyInput): boolean {
  return hasPermission(input.permissions, "view_analytics");
}

// ---------------------------------------------------------------------------
// System Policies
// ---------------------------------------------------------------------------

/**
 * Can the user perform system-level operations?
 */
export function canManageSystem(input: PolicyInput): boolean {
  return hasPermission(input.permissions, "manage_system");
}

// ---------------------------------------------------------------------------
// Admin Access Policies
// ---------------------------------------------------------------------------

/**
 * Can the user access the admin dashboard at all?
 * Requires admin role or higher.
 */
export function canAccessAdmin(input: PolicyInput): boolean {
  return hasMinRoleLevel(input.roles, "admin");
}

/**
 * Can the user access the moderation area?
 * Requires moderator role or higher.
 */
export function canAccessModeration(input: PolicyInput): boolean {
  return hasMinRoleLevel(input.roles, "moderator");
}

/**
 * Can the user access owner-only areas?
 */
export function canAccessOwner(input: PolicyInput): boolean {
  return hasMinRoleLevel(input.roles, "owner");
}

// ---------------------------------------------------------------------------
// Compound / Domain-Specific Policies
// ---------------------------------------------------------------------------

/**
 * Full administrative access (can do everything except system-level).
 */
export function isFullAdmin(input: PolicyInput): boolean {
  return (
    hasMinRoleLevel(input.roles, "admin") &&
    hasAllPermissions(input.permissions, [
      "read_reports",
      "manage_reports",
      "manage_users",
      "manage_billing",
      "view_analytics",
    ])
  );
}

/**
 * Can the user access admin settings sections?
 * Different settings sections may require different permissions.
 */
export function canAccessSettingsSection(
  input: PolicyInput,
  section: "general" | "billing" | "users" | "ai" | "roles" | "system",
): boolean {
  const sectionPermissionMap: Record<string, Permission> = {
    general: "manage_system",
    billing: "manage_billing",
    users: "manage_users",
    ai: "manage_ai",
    roles: "manage_roles",
    system: "manage_system",
  };

  const required = sectionPermissionMap[section];
  if (!required) return false;
  return hasPermission(input.permissions, required);
}