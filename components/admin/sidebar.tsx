"use client";

import {
  BookOpen,
  LayoutDashboard,
  Settings,
  Tags,
  Users,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { NavItem } from "@/components/admin/nav-item";

type NavEntry = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const ADMIN_NAV_ITEMS: NavEntry[] = [
  { href: "/admin", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/admin/contents", label: "コンテンツ管理", icon: BookOpen },
  { href: "/admin/tags", label: "タグ管理", icon: Tags },
  { href: "/admin/members", label: "メンバー管理", icon: Users },
  { href: "/admin/prompts", label: "AI整理文脈管理", icon: Sparkles },
  { href: "/admin/settings", label: "サイト設定", icon: Settings },
];

export function SidebarNav() {
  return (
    <nav className="space-y-1">
      {ADMIN_NAV_ITEMS.map((item) => (
        <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
      ))}
    </nav>
  );
}

export function AdminSidebar() {
  return (
    <aside className="hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          YOHAKU OS
        </p>
        <p className="mt-1 text-sm font-medium text-slate-800">管理画面</p>
      </div>
      <div className="p-4">
        <SidebarNav />
      </div>
    </aside>
  );
}
