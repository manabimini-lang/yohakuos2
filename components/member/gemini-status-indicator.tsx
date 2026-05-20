"use client";

import { useEffect, useState } from "react";
import { getSecureApiKeyStatus } from "@/lib/utils/secure-storage";

export function GeminiStatusIndicator() {
  const [connected, setConnected] = useState(false);
  const [method, setMethod] = useState<"oauth" | "apikey" | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkConnection = async () => {
      try {
        const res = await fetch("/api/gemini/status");
        if (res.ok) {
          const data = await res.json();
          if (data.connected) {
            setConnected(true);
            setMethod(data.method);
            return;
          }
        }
        
        // Fallback to local check if API check fails or isn't connected
        const hasKey = await getSecureApiKeyStatus("gemini");
        setConnected(hasKey);
        if (hasKey) setMethod("apikey");
      } catch (e) {
        // Fallback
        const hasKey = await getSecureApiKeyStatus("gemini");
        setConnected(hasKey);
        if (hasKey) setMethod("apikey");
      }
    };

    // Check initial connection
    checkConnection();

    // Listen to real-time events from connection card
    window.addEventListener("yohaku_ai_connection_changed", checkConnection);

    return () => {
      window.removeEventListener("yohaku_ai_connection_changed", checkConnection);
    };
  }, []);

  // Avoid hydration mismatch by rendering nothing on server side
  if (!mounted || !connected) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/40 dark:border-emerald-900/30 animate-in fade-in duration-300 mr-2 shrink-0">
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
      </span>
      <span className="text-[10px] font-semibold tracking-wide text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
        {method === "oauth" ? "● Google Connected" : "● Gemini Connected"}
      </span>
    </div>
  );
}
