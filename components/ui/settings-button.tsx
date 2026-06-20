"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function SettingsButton() {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/login" || pathname.startsWith("/settings")) {
    return null;
  }

  // ============================================================================
  // 【Phase 2 準備】プロフィール導線への移行構造
  // 
  // 将来的にここを DropdownMenu / Popover のトリガーとし、
  // アイコンを「◯（プロフィール画像）」に変更します。
  // タップすると以下のメニューが展開される設計へ発展させます。
  //
  // - あなた (Account)
  // - 環境 (Experience)
  // - 伴走AI (AI)
  // - 記録 (Data)
  // - ログアウト (Logout)
  // ============================================================================

  const isPhase1 = true; // 現在は Phase 1 (現状維持)

  if (isPhase1) {
    return (
      <Link
        href="/settings"
        className={cn(
          "fixed top-4 right-4 z-50 p-2 rounded-full",
          "bg-white/50 backdrop-blur-md border border-slate-200/50 shadow-sm",
          "text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-all",
          "sm:top-6 sm:right-6"
        )}
        aria-label="Settings"
      >
        <Settings className="w-5 h-5" />
      </Link>
    );
  }

  // Phase 2 実装時のプレースホルダー
  return (
    <div className="fixed top-4 right-4 z-50 sm:top-6 sm:right-6">
      {/* <DropdownMenu> 等をここに実装する */}
    </div>
  );
}
