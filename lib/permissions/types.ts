// ===================================================
// YOHAKU RBAC — Core Type Definitions
// ===================================================

/**
 * Available permission identifiers.
 * These are the atomic permission units used for authorization.
 */
export type Permission =
  | "read_reports"
  | "manage_reports"
  | "manage_users"
  | "manage_billing"
  | "manage_ai"
  | "manage_roles"
  | "view_analytics"
  | "manage_system";

/**
 * System role identifiers.
 * Roles are treated as permission groups, not assigned directly.
 */
export type SystemRole = "user" | "moderator" | "admin" | "owner";

/**
 * Maps permission names to their display metadata.
 */
export type PermissionMeta = {
  id: Permission;
  label: string;
  description: string;
  category: PermissionCategory;
};

/**
 * Permission categorization for UI grouping.
 */
export type PermissionCategory =
  | "moderation"
  | "administration"
  | "billing"
  | "ai"
  | "analytics"
  | "system";

/**
 * Role metadata including display info and hierarchy level.
 */
export type RoleMeta = {
  id: SystemRole;
  label: string;
  description: string;
  level: number; // higher = more privileged
};

/**
 * Structure for a user's resolved permissions.
 * This is the runtime representation used throughout the app.
 */
export type UserPermissions = {
  userId: string;
  roles: SystemRole[];
  permissions: Permission[];
};

/**
 * Permission check result with metadata for audit.
 */
export type PermissionCheckResult = {
  granted: boolean;
  permission?: Permission;
  userId?: string;
  reason?: string;
};

/**
 * Extended session user type with permission info.
 */
export type SessionUserWithPermissions = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  roles: SystemRole[];
  permissions: Permission[];
  plan: string;
};