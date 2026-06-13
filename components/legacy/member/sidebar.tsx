"use client";

import {
  Home,
  PenLine,
  BookMarked,
  Settings,
  BookOpen,
  User,
  Sparkles,
  Compass,
  Activity,
  type LucideIcon,
  Download,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { hasPremiumAccess } from "@/lib/constants/plan";

type NavEntry = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const MEMBER_NAV_ITEMS: NavEntry[] = [
  { href: "/member", label: "ホーム", icon: Home },
  { href: "/member/ai", label: "整理する", icon: PenLine },
  { href: "/member/ai/history", label: "記録", icon: BookMarked },
  { href: "/life/timeline", label: "人生の流れ", icon: Activity },
  { href: "/landscape", label: "内面の風景", icon: Compass },
  { href: "/knowledge", label: "小さな実践", icon: BookOpen },
  { href: "/profile", label: "自分をみる", icon: User },
  { href: "/member/settings", label: "設定", icon: Settings },
];

function SidebarNavItem({ href, label, icon: Icon }: NavEntry) {
  const pathname = usePathname();
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
          ? "bg-slate-100 text-foreground font-medium"
          : "text-muted-foreground hover:bg-slate-50 hover:text-slate-700",
      ].join(" ")}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

export function MemberSidebarNav() {
  const { data: session } = useSession();
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);

  const isPremium = !!session?.user && hasPremiumAccess(
    (session.user as any).plan,
    (session.user as any).role
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ((window as any).deferredPrompt) {
        setInstallPromptEvent((window as any).deferredPrompt);
      }

      const handleInstallReady = () => {
        setInstallPromptEvent((window as any).deferredPrompt);
      };

      window.addEventListener("yohaku-pwa-install-ready", handleInstallReady);
      return () => {
        window.removeEventListener("yohaku-pwa-install-ready", handleInstallReady);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    (window as any).deferredPrompt = null;
    setInstallPromptEvent(null);
  };

  return (
    <div className="h-full flex flex-col justify-between">
      <nav aria-label="メインナビゲーション" className="space-y-0.5">
        {MEMBER_NAV_ITEMS.map((item) => (
          <SidebarNavItem key={item.href} {...item} />
        ))}

        {installPromptEvent && (
          <button
            onClick={handleInstallClick}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-slate-50 hover:text-slate-700 transition-colors font-medium mt-4 border border-dashed border-slate-200"
          >
            <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>アプリをインストール</span>
          </button>
        )}
      </nav>

      {!isPremium && (
        <div className="p-4 mt-6 rounded-2xl bg-slate-50 border border-slate-100 text-foreground space-y-3.5 select-none transition-all duration-300">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground flex items-center gap-1.5 tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-muted-foreground stroke-[1.5]" />
              PremiumでAI整理を解放
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
              静かな振り返りを、AIとともに。
            </p>
          </div>
          <Link
            href="/pricing"
            className="block w-full text-center rounded-xl bg-slate-900 hover:bg-slate-800 text-foreground text-xs font-medium py-2 transition-colors shadow-sm cursor-pointer"
          >
            Premiumに参加
          </Link>
        </div>
      )}
    </div>
  );
}

export function MemberSidebar() {
  return null;
}
