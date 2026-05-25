// ===================================================
// YOHAKU RBAC — Constants & Role → Permission Mappings
// ===================================================

import type { Permission, SystemRole, PermissionMeta, RoleMeta } from "./types";
import type { UserRole as PrismaUserRole } from "@prisma/client";

// ---------------------------------------------------------------------------
// Permission Metadata Registry
// ---------------------------------------------------------------------------

export const PERMISSIONS: Record<Permission, PermissionMeta> = {
  read_reports: {
    id: "read_reports",
    label: "レポート閲覧",
    description: "通報・レポートの閲覧",
    category: "moderation",
  },
  manage_reports: {
    id: "manage_reports",
    label: "レポート管理",
    description: "通報・レポートの対応・解決",
    category: "moderation",
  },
  manage_users: {
    id: "manage_users",
    label: "ユーザー管理",
    description: "ユーザー情報の編集・停止",
    category: "administration",
  },
  manage_billing: {
    id: "manage_billing",
    label: "課金管理",
    description: "課金情報・プラン管理",
    category: "billing",
  },
  manage_ai: {
    id: "manage_ai",
    label: "AI管理",
    description: "AIモデル・プロンプト管理",
    category: "ai",
  },
  manage_roles: {
    id: "manage_roles",
    label: "ロール管理",
    description: "ロール・権限の割り当て",
    category: "system",
  },
  view_analytics: {
    id: "view_analytics",
    label: "アナリティクス",
    description: "分析ダッシュボードの閲覧",
    category: "analytics",
  },
  manage_system: {
    id: "manage_system",
    label: "システム管理",
    description: "システム全体の管理操作",
    category: "system",
  },
} as const;

// ---------------------------------------------------------------------------
// All Available Permissions as Arrays
// ---------------------------------------------------------------------------

export const ALL_PERMISSIONS: Permission[] = Object.keys(PERMISSIONS) as Permission[];

// ---------------------------------------------------------------------------
// Role → Permission Mappings (Single Source of Truth)
// ---------------------------------------------------------------------------

/**
 * Each system role is defined as a permission group.
 * Roles inherit permissions from lower-level roles implicitly.
 */
export const ROLE_PERMISSION_MAP: Record<SystemRole, Permission[]> = {
  user: [],
  moderator: ["read_reports", "manage_reports"],
  admin: [
    "read_reports",
    "manage_reports",
    "manage_users",
    "manage_billing",
    "view_analytics",
  ],
  owner: ALL_PERMISSIONS,
};

// ---------------------------------------------------------------------------
// Role Hierarchy (for hierarchical checks)
// ---------------------------------------------------------------------------

export const ROLE_HIERARCHY: SystemRole[] = ["user", "moderator", "admin", "owner"];

export const ROLE_LEVEL: Record<SystemRole, number> = {
  user: 0,
  moderator: 10,
  admin: 50,
  owner: 100,
};

// ---------------------------------------------------------------------------
// Role Metadata
// ---------------------------------------------------------------------------

export const ROLE_META: Record<SystemRole, RoleMeta> = {
  user: {
    id: "user",
    label: "ユーザー",
    description: "一般ユーザー",
    level: ROLE_LEVEL.user,
  },
  moderator: {
    id: "moderator",
    label: "モデレーター",
    description: "コンテンツモデレーション権限を持つ",
    level: ROLE_LEVEL.moderator,
  },
  admin: {
    id: "admin",
    label: "管理者",
    description: "管理画面へのアクセス権限を持つ",
    level: ROLE_LEVEL.admin,
  },
  owner: {
    id: "owner",
    label: "オーナー",
    description: "システム全体の完全な権限を持つ",
    level: ROLE_LEVEL.owner,
  },
};

// ---------------------------------------------------------------------------
// Legacy Compatibility Mapping
// Maps Prisma UserRole enum values to new SystemRole values
// ---------------------------------------------------------------------------

export const LEGACY_ROLE_MAP: Record<PrismaUserRole, SystemRole[]> = {
  SUPER_ADMIN: ["owner"],
  ADMIN: ["admin"],
  EDITOR: ["moderator"],
  PAID_MEMBER: ["user"],
  FREE_MEMBER: ["user"],
};