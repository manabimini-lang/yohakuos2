"use client";

import { useEffect, useState } from "react";
import { usePWAInstall } from "./usePWAInstall";
import { IOSInstallGuide } from "./ios-install-guide";
import { Button } from "@/components/ui/button";

const PWA_INSTALL_DISMISSED_KEY = "yohaku-pwa-install-dismissed";

export function PWAInstallCTA() {
  const { showInstallPrompt, isIOS, handleInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setIsDismissed(window.localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === "true");
  }, []);

  const handleDismiss = () => {
    window.localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, "true");
    setIsDismissed(true);
    setShowIOSGuide(false);
  };

  if (!showInstallPrompt || isDismissed) return null;

  if (showIOSGuide) {
    return (
      <div className="fixed inset-x-4 bottom-20 z-50">
        <IOSInstallGuide onClose={handleDismiss} />
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-slate-700 shadow-lg backdrop-blur sm:right-6">
      <span className="hidden text-xs font-medium sm:inline">アプリを追加</span>
      <Button
        variant="secondary"
        size="sm"
        className="h-7 rounded-full px-3 text-xs"
        onClick={isIOS ? () => setShowIOSGuide(true) : handleInstall}
      >
        インストール
      </Button>
      <button
        type="button"
        aria-label="インストール案内を閉じる"
        onClick={handleDismiss}
        className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        ×
      </button>
    </div>
  );
}
