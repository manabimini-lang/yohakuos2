"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCaptureStore } from "@/store/capture-store";

export function CaptureToast() {
  const toastMessage = useCaptureStore((state) => state.toastMessage);

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] px-5 py-2.5 rounded-full bg-notion-text dark:bg-white text-white dark:text-notion-text text-sm font-medium shadow-[0_8px_30px_rgba(0,0,0,0.12)] pointer-events-none"
        >
          {toastMessage}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
