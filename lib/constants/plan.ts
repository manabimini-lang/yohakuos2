export type Plan = "free" | "premium";

export type Role = "FREE_MEMBER" | "PAID_MEMBER" | "ADMIN" | "SUPER_ADMIN" | "EDITOR";

export const PLAN = {
  FREE: "free" as Plan,
  PREMIUM: "premium" as Plan,
} as const;

/** Monthly AI request limits exposed to YUI users. */
export const AI_MONTHLY_REQUEST_LIMIT = {
  FREE: 50,
  PREMIUM: 500,
} as const;

/** Cost guardrails for every Gemini request, including automated reports. */
export const AI_USAGE_GUARDRAILS = {
  MAX_REQUESTS_PER_MINUTE: 5,
  MAX_INPUT_CHARACTERS: 12_000,
  MAX_OUTPUT_TOKENS: 1_024,
  DAILY_TOKEN_LIMIT: 100_000,
  MONTHLY_TOKEN_LIMIT: 2_000_000,
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

export function getAiMonthlyRequestLimit(plan?: string | null, role?: string | null): number {
  return hasPremiumAccess(plan, role)
    ? AI_MONTHLY_REQUEST_LIMIT.PREMIUM
    : AI_MONTHLY_REQUEST_LIMIT.FREE;
}

/**
 * Determines if a role grants administrative privileges.
 */
export function hasAdminAccess(role?: string | null): boolean {
  return role === ROLE.ADMIN || role === ROLE.SUPER_ADMIN;
}
