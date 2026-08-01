import { Sparkles } from "lucide-react";
import { signOut } from "@/lib/auth";
import { GeminiStatusIndicator } from "@/components/member/gemini-status-indicator";

import Link from "next/link";
import SettingsMenu from "@/components/member/settings-menu";

type MemberHeaderProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    plan?: string;
  };
};

import { hasPremiumAccess } from "@/lib/constants/plan";

export function MemberHeader({ user }: MemberHeaderProps) {
  const displayName = user.name || user.email || "ユーザー";
  const initial = displayName.charAt(0).toUpperCase();
  const isPaidMember = hasPremiumAccess(user.plan, user.role);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
      <div className="flex h-12 items-center justify-between gap-4 px-4 lg:px-8">
        {/* モバイルのみ：ロゴ */}
        <span className="text-sm font-medium tracking-widest text-slate-600 lg:hidden">
          YOHAKU
        </span>

        {/* ユーザーエリア：設定メニュー1つに集約 */}
        <div className="ml-auto flex items-center gap-3">
          {/* プレミアムバッジ等はメニューへ移行。ここでは単一の設定アイコンにする */}
          <SettingsMenu />
        </div>
      </div>
    </header>
  );
}
