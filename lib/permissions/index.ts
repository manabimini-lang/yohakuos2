// ===================================================
// YOHAKU RBAC — Public API
// ===================================================
//
// Export everything from a single entry point.
// External modules should import from this file.
// ===================================================

// Types
export type {
  Permission,
  SystemRole,
  PermissionMeta,
  RoleMeta,
  UserPermissions,
  PermissionCheckResult,
  PermissionCategory,
  SessionUserWithPermissions,
} from "./types";

// Constants & Role Mappings
export {
  PERMISSIONS,
  ALL_PERMISSIONS,
  ROLE_PERMISSION_MAP,
  ROLE_HIERARCHY,
  ROLE_LEVEL,
  ROLE_META,
  LEGACY_ROLE_MAP,
} from "./constants";

// Helpers
export {
  resolvePermissions,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  hasRole,
  hasMinRoleLevel,
  requirePermission,
  requireRole,
  requireMinRoleLevel,
  extractPermissionsFromSession,
  createPermissionResult,
  AuthorizationError,
} from "./helpers";

// Policies
export {
  canReadReports,
  canManageReports,
  canModerateContent,
  canManageUsers,
  canManageBilling,
  canManageAI,
  canManageRoles,
  canViewAnalytics,
  canManageSystem,
  canAccessAdmin,
  canAccessModeration,
  canAccessOwner,
  isFullAdmin,
  canAccessSettingsSection,
} from "./policies";
export type { PolicyInput } from "./policies";

