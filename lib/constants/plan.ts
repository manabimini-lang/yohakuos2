export type Plan = "free" | "premium";

export type Role = "FREE_MEMBER" | "PAID_MEMBER" | "ADMIN" | "SUPER_ADMIN" | "EDITOR";

export const PLAN = {
  FREE: "free" as Plan,
  PREMIUM: "premium" as Plan,
} as const;

export const ROLE = {
  FREE_MEMBER: "FREE_MEMBER" as Role,
  PAID_MEMBER: "PAID_MEMBER" as Role,
  ADMIN: "ADMIN" as Role,
  SUPER_ADMIN: "SUPER_ADMIN" as Role,
  EDITOR: "EDITOR" as Role,
} as const;

export const PREMIUM_ROUTES = [
  "/member/organize",
  "/member/ai",
] as const;

/**
 * Checks if a route path requires premium membership.
 */
export function isPremiumRoute(pathname: string): boolean {
  return PREMIUM_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

/**
 * Centrally determines if a user has premium privileges based on their plan or role.
 */
export function hasPremiumAccess(plan?: string | null, role?: string | null): boolean {
  return (
    plan === PLAN.PREMIUM ||
    role === ROLE.PAID_MEMBER ||
    role === ROLE.ADMIN ||
    role === ROLE.SUPER_ADMIN
  );
}

/**
 * Determines if a role grants administrative privileges.
 */
export function hasAdminAccess(role?: string | null): boolean {
  return role === ROLE.ADMIN || role === ROLE.SUPER_ADMIN;
}
