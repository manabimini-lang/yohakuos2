"use client";

import { useState } from "react";
import { usePWAInstall } from "./usePWAInstall";
import { IOSInstallGuide } from "./ios-install-guide";
import { Button } from "@/components/ui/button";

export function PWAInstallCTA() {
  const { showInstallPrompt, isIOS, handleInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (!showInstallPrompt) return null;

  if (showIOSGuide) {
    return (
      <div className="fixed inset-x-4 bottom-20 z-50">
        <IOSInstallGuide onClose={() => setShowIOSGuide(false)} />
      </div>
    );
  }

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 p-4 bg-slate-900 text-white rounded-xl shadow-lg flex items-center justify-between">
      <span className="text-sm font-medium">アプリをインストールして快適に</span>
      <Button 
        variant="secondary" 
        size="sm"
        onClick={isIOS ? () => setShowIOSGuide(true) : handleInstall}>
        インストール
      </Button>
    </div>
  );
}