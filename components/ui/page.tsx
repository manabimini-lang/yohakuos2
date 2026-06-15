"use client";

import { useState, useEffect } from "react";
import { Caption, PageTitle, Body } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HeroSection() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // PWAの状態検知（スタンドアロンモードかどうか）
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
    
    // 本来は 'beforeinstallprompt' イベント等で制御しますが、
    // 指示に基づき、ロジックの枠組みとして初期表示を想定します
    setShowInstallPrompt(true); 
  }, []);

  const showInstall = showInstallPrompt && !isStandalone;

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground/80">
      <div className="max-w-5xl mx-auto px-6 pt-14 pb-24 flex flex-col items-center text-center space-y-12">
        <header className="space-y-4 max-w-2xl">
          <Caption>YOHAKU OS</Caption>
          <PageTitle>戻ってくる場所をつくる</PageTitle>
          <Body>
            忙しなさの中に、自分へ戻るための時間を。
            日々の気づきを静かに置き、対話を通じて新しい自分を見つけます。
          </Body>
        </header>

        {/* CTA セクション: 思想を反映した静かな導線設計 */}
        <div className={cn(
          "flex flex-col w-full",
          "gap-6 items-center",
          // Mobile ではページ下部で一息つけるよう十分な余白を確保
          "pb-12 lg:pb-0"
        )}>
          {/* Primary CTA: 扉をひらく */}
          {/* Desktop/Mobile 共通の Primary スタイル */}
          <Button variant="primary" className="w-full max-w-[320px] lg:min-w-[280px] h-14 rounded-2xl text-base font-medium shadow-sm transition-all hover:opacity-90 active:scale-[0.98]">
            扉をひらく
          </Button>

          {/* Secondary & Utility CTAs: gap-3 以上を確保し重なりを防止 */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <Button variant="outline" className="flex-1 lg:min-w-[160px] h-12 rounded-xl text-sm border-slate-200 text-slate-500 hover:text-foreground hover:bg-slate-50">
              ＋余白に置く
            </Button>
            {showInstall && (
              <Button variant="secondary" className="flex-1 lg:min-w-[160px] h-12 rounded-xl text-sm bg-slate-50 text-slate-500 hover:bg-slate-100 border-none">
                インストールする
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}