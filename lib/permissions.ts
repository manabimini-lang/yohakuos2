import { UserRole } from "@prisma/client";

export { UserRole };

const ADMIN_ROLES: readonly UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.EDITOR,
];

export const isAdmin = (role?: UserRole | null): boolean =>
  !!role && ADMIN_ROLES.includes(role);

export const isPaidMember = (role?: UserRole | null): boolean =>
  role === UserRole.PAID_MEMBER;

export const isMember = (role?: UserRole | null): boolean =>
  role === UserRole.PAID_MEMBER || role === UserRole.FREE_MEMBER;

export const canAccessAdmin = (role?: UserRole | null): boolean =>
  isAdmin(role);

export const canAccessMember = (role?: UserRole | null): boolean =>
  isMember(role);

export const canAccessPremium = (role?: UserRole | null): boolean =>
  isPaidMember(role);
