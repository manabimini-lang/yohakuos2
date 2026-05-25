// ===================================================
// YOHAKU RBAC — Authorization Service
// ===================================================
//
// This service provides a higher-level API for role & permission
// management operations (assigning roles, querying permissions, etc.)
// that interact with the database.
//
// For read-only checks, prefer the helpers and policies from
// @/lib/permissions.
// ===================================================

import { prisma } from "@/lib/prisma";
import {
  resolvePermissions,
  hasPermission,
} from "@/lib/permissions/helpers";
import { ROLE_LEVEL } from "@/lib/permissions/constants";
import type { SystemRole, Permission } from "@/lib/permissions/types";

// ---------------------------------------------------------------------------
// Role Assignment
// ---------------------------------------------------------------------------

export type RoleAssignmentResult = {
  userId: string;
  roles: SystemRole[];
  permissions: Permission[];
};

/**
 * Assigns a system role to a user.
 * Records the assignment in the database via the system_role_assignments table.
 */
export async function assignRole(
  userId: string,
  role: SystemRole,
  assignedBy?: string,
): Promise<RoleAssignmentResult> {
  // Upsert the role assignment
  await prisma.systemRoleAssignment.upsert({
    where: {
      userId_role: {
        userId,
        role,
      },
    },
    update: {
      assignedBy: assignedBy ?? null,
    },
    create: {
      userId,
      role,
      assignedBy: assignedBy ?? null,
    },
  });

  return await getUserPermissions(userId);
}

/**
 * Removes a role assignment from a user.
 */
export async function removeRole(
  userId: string,
  role: SystemRole,
): Promise<RoleAssignmentResult> {
  await prisma.systemRoleAssignment.deleteMany({
    where: {
      userId,
      role,
    },
  });

  return await getUserPermissions(userId);
}

/**
 * Gets all role assignments for a user.
 */
export async function getUserRoles(userId: string): Promise<SystemRole[]> {
  const records = await prisma.systemRoleAssignment.findMany({
    where: { userId },
    select: { role: true },
  });

  return records.map((r) => r.role) as SystemRole[];
}

/**
 * Gets the resolved permissions for a user.
 */
export async function getUserPermissions(userId: string): Promise<RoleAssignmentResult> {
  const roles = await getUserRoles(userId);

  // If no roles assigned yet, default to "user"
  const effectiveRoles = roles.length > 0 ? roles : (["user"] as SystemRole[]);
  const permissions = resolvePermissions(effectiveRoles);

  return {
    userId,
    roles: effectiveRoles,
    permissions,
  };
}

// ---------------------------------------------------------------------------
// Bulk Operations
// ---------------------------------------------------------------------------

/**
 * Gets all users with a specific role.
 */
export async function getUsersByRole(role: SystemRole): Promise<string[]> {
  const records = await prisma.systemRoleAssignment.findMany({
    where: { role },
    select: { userId: true },
  });

  return records.map((r) => r.userId);
}

/**
 * Gets a summary of all role assignments.
 */
export async function getRoleSummary(): Promise<
  Record<SystemRole, number>
> {
  const roles = ["user", "moderator", "admin", "owner"] as const;
  const summary: Record<string, number> = {} as Record<SystemRole, number>;

  for (const role of roles) {
    summary[role] = await prisma.systemRoleAssignment.count({
      where: { role },
    });
  }

  return summary as Record<SystemRole, number>;
}

// ---------------------------------------------------------------------------
// Permission Query
// ---------------------------------------------------------------------------

/**
 * Checks if a specific user has a permission (database-backed).
 */
export async function userHasPermission(
  userId: string,
  permission: Permission,
): Promise<boolean> {
  const { permissions } = await getUserPermissions(userId);
  return permissions.includes(permission);
}

/**
 * Gets the effective role level for a user.
 */
export async function getUserRoleLevel(userId: string): Promise<number> {
  const roles = await getUserRoles(userId);
  if (roles.length === 0) return 0;

  return Math.max(...roles.map((r) => ROLE_LEVEL[r] ?? 0));
}