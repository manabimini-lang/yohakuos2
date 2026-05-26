"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useCaptureStore } from "@/store/capture-store";

export function CaptureButton() {
  const openCapture = useCaptureStore((state) => state.openCapture);

  return (
    <motion.button
      onClick={openCapture}
      className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] flex items-center gap-2 px-5 py-3 rounded-full bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-notion-border dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] text-sm font-medium text-notion-text dark:text-white transition-colors hover:bg-white/90 dark:hover:bg-white/10"
      whileHover={{ y: -2, scale: 1.02, boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      <Plus className="w-4 h-4" />
      <span>余白に置く</span>
    </motion.button>
  );
}
