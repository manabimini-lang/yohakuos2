export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "EDITOR"
  | "PAID_MEMBER"
  | "FREE_MEMBER";

const ADMIN_ROLES: readonly UserRole[] = ["SUPER_ADMIN", "ADMIN", "EDITOR"];

export const isAdmin = (role?: UserRole | null): boolean =>
  !!role && ADMIN_ROLES.includes(role);

export const isPaidMember = (role?: UserRole | null): boolean =>
  role === "PAID_MEMBER";

export const isMember = (role?: UserRole | null): boolean =>
  role === "PAID_MEMBER" || role === "FREE_MEMBER";

export const canAccessAdmin = (role?: UserRole | null): boolean => isAdmin(role);

export const canAccessMember = (role?: UserRole | null): boolean => isMember(role);

export const canAccessPremium = (role?: UserRole | null): boolean =>
  isPaidMember(role);
