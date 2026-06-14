"use client";

import Link from "next/link";
import { Key, MessageSquare, CreditCard, Database, Settings, ChevronRight, Sliders } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-12 md:py-24 space-y-10 selection:bg-slate-100 pb-32">
      {/* Page Title */}
      <div className="space-y-2">
        <h1 className="text-2xl font-serif text-foreground tracking-wide">
          設定
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          あなただけの振り返り空間を整えます。
        </p>
      </div>

      {/* Settings Navigation Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">空間を整える</h2>
        <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl bg-white overflow-hidden text-sm shadow-sm">
          {/* General Settings */}
          <Link 
            href="/settings/general"
            className="flex items-center justify-between p-5 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Sliders className="w-4 h-4 text-muted-foreground stroke-[1.5]" />
              <span className="font-medium text-[13px]">全般（外観・通知・プライバシー）</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          {/* Gemini Key Config */}
          <Link 
            href="/settings/ai"
            className="flex items-center justify-between p-5 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Key className="w-4 h-4 text-muted-foreground stroke-[1.5]" />
              <span className="font-medium text-[13px]">AI（Gemini API）の接続設定</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          {/* Discord Connection Settings */}
          <Link 
            href="/settings/account"
            className="flex items-center justify-between p-5 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-4 h-4 text-muted-foreground stroke-[1.5]" />
              <span className="font-medium text-[13px]">外部サービス連携 (Discord)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          {/* Local Data Management */}
          <Link 
            href="/settings/data"
            className="flex items-center justify-between p-5 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Database className="w-4 h-4 text-muted-foreground stroke-[1.5]" />
              <span className="font-medium text-[13px]">データ管理（バックアップ）</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          {/* Premium Billing Settings */}
          <Link 
            href="/member/settings"
            className="flex items-center justify-between p-5 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <CreditCard className="w-4 h-4 text-muted-foreground stroke-[1.5]" />
              <span className="font-medium text-[13px]">Premium 加入管理 / プランの変更</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </div>
  );
}
