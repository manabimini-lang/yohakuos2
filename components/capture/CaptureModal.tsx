"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCaptureStore } from "@/store/capture-store";
import { UrlCaptureForm } from "./UrlCaptureForm";
import { PdfUploadForm } from "./PdfUploadForm";
import { X } from "lucide-react";

export function CaptureModal() {
  const { isOpen, closeCapture } = useCaptureStore();
  const [activeTab, setActiveTab] = useState<"url" | "pdf">("url");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[110] bg-black/20 dark:bg-black/40 backdrop-blur-sm"
            onClick={closeCapture}
          />
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-md bg-white dark:bg-[#111111] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-notion-border dark:border-white/10 overflow-hidden pointer-events-auto"
            >
              <div className="flex items-center justify-between p-6 pb-2">
                <h2 className="text-lg font-medium text-notion-text dark:text-white">余白に置く</h2>
                <button
                  onClick={closeCapture}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 pt-2 pb-4 flex gap-4 border-b border-notion-border dark:border-white/10">
                <button
                  onClick={() => setActiveTab("url")}
                  className={`text-sm font-medium pb-2 transition-colors relative ${
                    activeTab === "url"
                      ? "text-brand"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  URL
                  {activeTab === "url" && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t-full"
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("pdf")}
                  className={`text-sm font-medium pb-2 transition-colors relative ${
                    activeTab === "pdf"
                      ? "text-brand"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  PDF
                  {activeTab === "pdf" && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t-full"
                    />
                  )}
                </button>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {activeTab === "url" ? (
                    <motion.div
                      key="url"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <UrlCaptureForm onSuccess={closeCapture} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="pdf"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <PdfUploadForm onSuccess={closeCapture} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
