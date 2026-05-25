// ===================================================
// YOHAKU RBAC — Session-Based Helpers
// ===================================================
//
// These helpers depend on @/lib/auth and should NOT be
// imported from auth.config.ts to avoid circular deps.
// ===================================================

import { auth } from "@/lib/auth";
import { extractPermissionsFromSession, resolvePermissions } from "./helpers";
import type { Permission, SystemRole } from "./types";

/**
 * Extracts permissions from the current auth session.
 * Returns null if no session exists.
 */
export async function getSessionPermissions(): Promise<{
  userId: string;
  roles: SystemRole[];
  permissions: Permission[];
} | null> {
  const session = await auth();
  if (!session?.user) return null;

  return extractPermissionsFromSession(session);
}