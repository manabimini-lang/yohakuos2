"use client";

import { useEffect } from "react";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Service worker registered successfully:", reg.scope);
          })
          .catch((err) => {
            console.error("Service worker registration failed:", err);
          });
      });
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser default prompt
      e.preventDefault();
      // Save the event so it can be triggered later
      (window as any).deferredPrompt = e;
      // Dispatch custom event to let client components know installation is ready
      window.dispatchEvent(new CustomEvent("yohaku-pwa-install-ready"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  return <>{children}</>;
}
