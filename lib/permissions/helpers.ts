// ===================================================
// YOHAKU RBAC — Authorization Helpers
// ===================================================
//
// IMPORTANT: This file MUST NOT import from @/lib/auth to avoid
// circular dependencies with auth.config.ts.
// Use @/lib/permissions/session-helpers for session-dependent functions.
// ===================================================

import type { Permission, SystemRole, UserPermissions, PermissionCheckResult } from "./types";
import { ROLE_PERMISSION_MAP, ROLE_LEVEL, LEGACY_ROLE_MAP } from "./constants";

// ---------------------------------------------------------------------------
// Permission Helpers
// ---------------------------------------------------------------------------

/**
 * Resolves the effective permissions for a given set of roles.
 * The result is the union of all permissions across assigned roles.
 */
export function resolvePermissions(roles: SystemRole[]): Permission[] {
  const permissionSet = new Set<Permission>();

  for (const role of roles) {
    const perms = ROLE_PERMISSION_MAP[role];
    if (perms) {
      for (const p of perms) {
        permissionSet.add(p);
      }
    }
  }

  return Array.from(permissionSet);
}

/**
 * Checks if a set of permissions includes the required permission.
 */
export function hasPermission(
  userPermissions: Permission[] | undefined | null,
  requiredPermission: Permission,
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  return userPermissions.includes(requiredPermission);
}

/**
 * Checks if a user has ALL of the required permissions.
 */
export function hasAllPermissions(
  userPermissions: Permission[] | undefined | null,
  requiredPermissions: Permission[],
): boolean {
  if (!userPermissions) return false;
  return requiredPermissions.every((p) => userPermissions.includes(p));
}

/**
 * Checks if a user has ANY of the required permissions.
 */
export function hasAnyPermission(
  userPermissions: Permission[] | undefined | null,
  requiredPermissions: Permission[],
): boolean {
  if (!userPermissions) return false;
  return requiredPermissions.some((p) => userPermissions.includes(p));
}

// ---------------------------------------------------------------------------
// Role Helpers
// ---------------------------------------------------------------------------

/**
 * Checks if a user has a specific role assigned.
 */
export function hasRole(
  userRoles: SystemRole[] | undefined | null,
  role: SystemRole,
): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return userRoles.includes(role);
}

/**
 * Checks if a user has at least the specified role level.
 * e.g., hasRoleLevel(userRoles, "moderator") → true if moderator or above.
 */
export function hasMinRoleLevel(
  userRoles: SystemRole[] | undefined | null,
  minRole: SystemRole,
): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  const minLevel = ROLE_LEVEL[minRole];
  return userRoles.some((role) => ROLE_LEVEL[role] >= minLevel);
}

// ---------------------------------------------------------------------------
// Require Helpers (Throwing variants)
// ---------------------------------------------------------------------------

export class AuthorizationError extends Error {
  public readonly code = "AUTHORIZATION_ERROR";
  public readonly statusCode = 403;

  constructor(
    message: string,
    public readonly details?: {
      requiredPermission?: Permission;
      requiredRole?: SystemRole;
      userId?: string;
    },
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Throws AuthorizationError if permission is not granted.
 */
export function requirePermission(
  userPermissions: Permission[] | undefined | null,
  requiredPermission: Permission,
  userId?: string,
): void {
  if (!hasPermission(userPermissions, requiredPermission)) {
    throw new AuthorizationError(
      `Missing required permission: ${requiredPermission}`,
      { requiredPermission, userId },
    );
  }
}

/**
 * Throws AuthorizationError if user does not have the required role.
 */
export function requireRole(
  userRoles: SystemRole[] | undefined | null,
  requiredRole: SystemRole,
  userId?: string,
): void {
  if (!hasRole(userRoles, requiredRole)) {
    throw new AuthorizationError(
      `Missing required role: ${requiredRole}`,
      { requiredRole, userId },
    );
  }
}

/**
 * Throws AuthorizationError if user does not meet minimum role level.
 */
export function requireMinRoleLevel(
  userRoles: SystemRole[] | undefined | null,
  minRole: SystemRole,
  userId?: string,
): void {
  if (!hasMinRoleLevel(userRoles, minRole)) {
    throw new AuthorizationError(
      `Minimum role level required: ${minRole}`,
      { requiredRole: minRole, userId },
    );
  }
}

// ---------------------------------------------------------------------------
// Extract helpers (no @/lib/auth dependency)
// ---------------------------------------------------------------------------

/**
 * Extracts permissions from a session object (no auth() call, safe for config).
 * This function can be used in auth.config.ts without circular dependency.
 */
export function extractPermissionsFromSession(session: {
  user?: { id: string; roles?: SystemRole[]; permissions?: Permission[]; role?: string };
}): {
  userId: string;
  roles: SystemRole[];
  permissions: Permission[];
} | null {
  if (!session.user) return null;

  const userId = session.user.id;

  // If session already has the new permission structure, use it
  if (session.user.roles && session.user.roles.length > 0) {
    return {
      userId,
      roles: session.user.roles,
      permissions: session.user.permissions ?? resolvePermissions(session.user.roles),
    };
  }

  // Fallback: resolve from legacy role field
  const legacyRole = session.user.role as keyof typeof LEGACY_ROLE_MAP;
  const systemRoles = LEGACY_ROLE_MAP[legacyRole] ?? ["user"];
  const permissions = resolvePermissions(systemRoles);

  return {
    userId,
    roles: systemRoles,
    permissions,
  };
}

/**
 * Creates a safe permission check result object.
 */
export function createPermissionResult(
  granted: boolean,
  options?: {
    permission?: Permission;
    userId?: string;
    reason?: string;
  },
): PermissionCheckResult {
  return {
    granted,
    ...options,
  };
}