"use client";

import {
  BookOpen,
  LayoutDashboard,
  Settings,
  Tags,
  Users,
  Sparkles,
  BarChart3,
  Flag,
  CreditCard,
  Shield,
  Link2,
  Layers3,
  Mail,
  FlaskConical,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { NavItem } from "@/components/admin/nav-item";
import { hasPermission, hasMinRoleLevel } from "@/lib/permissions/helpers";
import type { Permission, SystemRole } from "@/lib/permissions/types";

type NavEntry = {
  href: string;
  label: string;
  icon: LucideIcon;
  requiredPermission?: Permission;
  requiredRole?: SystemRole;
};

const ADMIN_NAV_ITEMS: NavEntry[] = [
  { href: "/admin", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/admin/contents", label: "外部コンテンツ", icon: BookOpen },
  { href: "/admin/tags", label: "タグ管理", icon: Tags },
  { href: "/admin/members", label: "メンバー管理", icon: Users, requiredPermission: "manage_users" },
  { href: "/admin/prompts", label: "AI整理文脈管理", icon: Sparkles, requiredPermission: "manage_ai" },
  { href: "/admin/moderation", label: "モデレーション", icon: Flag, requiredRole: "moderator" },
  { href: "/admin/safety", label: "セーフティ", icon: Shield, requiredRole: "moderator" },
  { href: "/admin/analytics", label: "アナリティクス", icon: BarChart3, requiredPermission: "view_analytics" },
  { href: "/admin/acquisition", label: "記事からの成果", icon: BarChart3, requiredPermission: "view_analytics" },
  { href: "/admin/billing", label: "課金管理", icon: CreditCard, requiredPermission: "manage_billing" },
  { href: "/admin/settings", label: "サイト設定", icon: Settings, requiredPermission: "manage_system" },
  { href: "/admin/activity", label: "知識循環ハブ", icon: Layers3, requiredPermission: "view_analytics" },
  { href: "/admin/newsletter", label: "メルマガ企画", icon: Mail, requiredPermission: "manage_comms" },
  { href: "/admin/product-learning", label: "製品学習", icon: FlaskConical, requiredPermission: "manage_product_learning" },
  { href: "/admin/reports", label: "活動レポート", icon: ScrollText, requiredPermission: "publish_reports" },
];

export function SidebarNav() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const roles: SystemRole[] = user?.roles ?? [];
  const permissions: Permission[] = user?.permissions ?? [];

  const visibleItems = ADMIN_NAV_ITEMS.filter((item) => {
    // If no specific requirement, show to all admin users
    if (!item.requiredPermission && !item.requiredRole) return true;

    // Check permission if specified
    if (item.requiredPermission) {
      return hasPermission(permissions, item.requiredPermission);
    }

    // Check role level if specified
    if (item.requiredRole) {
      return hasMinRoleLevel(roles, item.requiredRole);
    }

    return true;
  });

  return (
    <nav className="space-y-1">
      {visibleItems.map((item) => (
        <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
      ))}
    </nav>
  );
}

export function AdminSidebar() {
  return (
    <aside className="hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          YOHAKU OS
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">管理画面</p>
      </div>
      <div className="p-4">
        <SidebarNav />
      </div>
    </aside>
  );
}
