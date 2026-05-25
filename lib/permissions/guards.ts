// ===================================================
// YOHAKU RBAC — Server-Side Guards
// ===================================================
//
// These functions are used in Server Components, API routes,
// and Server Actions to enforce authorization server-side.
//
// They integrate directly with the NextAuth session.
// ===================================================

import { auth } from "@/lib/auth";
import {
  extractPermissionsFromSession,
  AuthorizationError,
  hasPermission,
  hasMinRoleLevel,
  hasRole,
} from "./helpers";
import type { Permission, SystemRole } from "./types";

// ---------------------------------------------------------------------------
// Session Extraction with Error
// ---------------------------------------------------------------------------

async function getPolicyInput() {
  const session = await auth();
  if (!session?.user) {
    throw new AuthorizationError("Authentication required", { userId: undefined });
  }

  const extracted = extractPermissionsFromSession(session);
  if (!extracted) {
    throw new AuthorizationError("Failed to extract permissions from session");
  }

  return extracted;
}

// ---------------------------------------------------------------------------
// Permission Guard
// ---------------------------------------------------------------------------

/**
 * Ensures the current user has the specified permission.
 * Throws AuthorizationError if not granted.
 * Use this in API routes and Server Actions.
 */
export async function guardPermission(
  requiredPermission: Permission,
): Promise<{ userId: string; roles: SystemRole[]; permissions: Permission[] }> {
  const input = await getPolicyInput();

  if (!hasPermission(input.permissions, requiredPermission)) {
    throw new AuthorizationError(
      `Missing required permission: ${requiredPermission}`,
      { requiredPermission, userId: input.userId },
    );
  }

  return input;
}

// ---------------------------------------------------------------------------
// Role Guard
// ---------------------------------------------------------------------------

/**
 * Ensures the current user has the specified role.
 * Throws AuthorizationError if not granted.
 */
export async function guardRole(
  requiredRole: SystemRole,
): Promise<{ userId: string; roles: SystemRole[]; permissions: Permission[] }> {
  const input = await getPolicyInput();

  if (!hasRole(input.roles, requiredRole)) {
    throw new AuthorizationError(
      `Missing required role: ${requiredRole}`,
      { requiredRole, userId: input.userId },
    );
  }

  return input;
}

// ---------------------------------------------------------------------------
// Minimum Role Level Guard
// ---------------------------------------------------------------------------

/**
 * Ensures the current user meets the minimum role level.
 * e.g., guardMinRoleLevel("moderator") → allows moderator, admin, owner.
 * Throws AuthorizationError if not met.
 */
export async function guardMinRoleLevel(
  minRole: SystemRole,
): Promise<{ userId: string; roles: SystemRole[]; permissions: Permission[] }> {
  const input = await getPolicyInput();

  if (!hasMinRoleLevel(input.roles, minRole)) {
    throw new AuthorizationError(
      `Minimum role level required: ${minRole}`,
      { requiredRole: minRole, userId: input.userId },
    );
  }

  return input;
}

// ---------------------------------------------------------------------------
// Authenticated Guard (Simplest)
// ---------------------------------------------------------------------------

/**
 * Ensures the user is authenticated.
 * Throws AuthorizationError if not.
 */
export async function guardAuthenticated(): Promise<{
  userId: string;
  roles: SystemRole[];
  permissions: Permission[];
}> {
  const input = await getPolicyInput();
  return input;
}