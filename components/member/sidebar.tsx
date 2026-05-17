"use client";

import {
  Home,
  PenLine,
  BookMarked,
  Settings,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavEntry = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// YOHAKUらしいナビゲーション文言に統一
const MEMBER_NAV_ITEMS: NavEntry[] = [
  { href: "/member",             label: "ホーム",    icon: Home },
  { href: "/member/ai",          label: "整理する",  icon: PenLine },
  { href: "/member/ai/history",  label: "記録",      icon: BookMarked },
  { href: "/member/settings",    label: "設定",      icon: Settings },
];

function SidebarNavItem({ href, label, icon: Icon }: NavEntry) {
  const pathname = usePathname();
  // /member/ai/history は /member/ai より先にチェック
  const isActive =
    href === "/member"
      ? pathname === "/member"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
        isActive
          ? "bg-slate-100 text-slate-900 font-medium"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
      ].join(" ")}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

export function MemberSidebarNav() {
  return (
    <nav aria-label="メインナビゲーション" className="space-y-0.5">
      {MEMBER_NAV_ITEMS.map((item) => (
        <SidebarNavItem key={item.href} {...item} />
      ))}
    </nav>
  );
}

export function MemberSidebar() {
  return (
    <aside
      aria-label="サイドバー"
      className="hidden w-56 border-r border-slate-100 bg-white lg:flex lg:flex-col"
    >
      {/* ロゴエリア */}
      <div className="px-5 py-6 border-b border-slate-100">
        <p className="text-base font-medium tracking-widest text-slate-800">
          YOHAKU
        </p>
        <p className="mt-0.5 text-xs text-slate-400">止まっても、戻れる場所</p>
      </div>
      {/* ナビ */}
      <div className="flex-1 p-3">
        <MemberSidebarNav />
      </div>
    </aside>
  );
}
