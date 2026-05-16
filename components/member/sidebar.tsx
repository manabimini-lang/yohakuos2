"use client";

import {
  BookOpen,
  Home,
  MessageCircle,
  History,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { NavItem } from "@/components/admin/nav-item";

type NavEntry = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const MEMBER_NAV_ITEMS: NavEntry[] = [
  { href: "/member", label: "ホーム", icon: Home },
  { href: "/member/contents", label: "コンテンツ", icon: BookOpen },
  { href: "/member/ai", label: "思考の整理", icon: MessageCircle },
  { href: "/member/ai/history", label: "過去の対話", icon: History },
  { href: "/member/settings", label: "設定", icon: Settings },
];

export function MemberSidebarNav() {
  return (
    <nav className="space-y-1">
      {MEMBER_NAV_ITEMS.map((item) => (
        <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
      ))}
    </nav>
  );
}

export function MemberSidebar() {
  return (
    <aside className="hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          YOHAKU
        </p>
        <p className="mt-1 text-sm font-medium text-slate-800">マイページ</p>
      </div>
      <div className="p-4">
        <MemberSidebarNav />
      </div>
    </aside>
  );
}
