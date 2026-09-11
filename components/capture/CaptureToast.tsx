"use client";

import { useCaptureStore } from "@/store/capture-store";

export function CaptureToast() {
  const toastMessage = useCaptureStore((state) => state.toastMessage);

  if (!toastMessage) return null;

  return (
    <div className="pointer-events-none fixed bottom-28 left-1/2 z-[150] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300 rounded-full border border-border bg-[#111111]/95 px-4 py-2 text-sm text-foreground shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
      {toastMessage}
    </div>
  );
}
