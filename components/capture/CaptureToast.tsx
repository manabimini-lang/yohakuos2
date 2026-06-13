"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCaptureStore } from "@/store/capture-store";

export function CaptureToast() {
  const toastMessage = useCaptureStore((state) => state.toastMessage);

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="fixed bottom-28 left-1/2 z-[150] -translate-x-1/2 rounded-full border border-border bg-[#111111]/95 px-4 py-2 text-sm text-foreground shadow-[0_12px_30px_rgba(0,0,0,0.18)] pointer-events-none"
        >
          {toastMessage}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
