"use client";

import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function YuiSettingsHeaderActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href="/yui" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50">
        <ArrowLeft className="h-4 w-4" />
        ホームへ戻る
      </Link>
      <button type="button" onClick={() => void signOut({ callbackUrl: "/login" })} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-red-600 transition hover:bg-red-50">
        <LogOut className="h-4 w-4" />
        ログアウト
      </button>
    </div>
  );
}
