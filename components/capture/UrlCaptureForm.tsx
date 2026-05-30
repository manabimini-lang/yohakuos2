"use client";

import { useState } from "react";
import { saveUrlContent } from "@/app/actions/capture";
import { useCaptureStore } from "@/store/capture-store";
import { motion, AnimatePresence } from "framer-motion";

// ----------------------------------------------------------------
// エラーコードを日本語の静かなメッセージへ変換
// ----------------------------------------------------------------
type UrlErrorCode = "invalid_url" | "network" | "server";

const URL_ERROR_MESSAGES: Record<UrlErrorCode, { heading: string; hint: string }> = {
  invalid_url: {
    heading: "URLの形式を確認してください。",
    hint: "https:// から始まる完全なURLを入力してください。",
  },
  network: {
    heading: "そのURLに接続できませんでした。",
    hint: "URLが公開されているか確認してから、もう一度お試しください。",
  },
  server: {
    heading: "保存できませんでした。",
    hint: "しばらくしてからもう一度お試しください。",
  },
};

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export function UrlCaptureForm({ onSuccess }: { onSuccess: () => void }) {
  const [url, setUrl] = useState("");
  const [reflection, setReflection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorCode, setErrorCode] = useState<UrlErrorCode | null>(null);
  const showToast = useCaptureStore((state) => state.showToast);

  const error = errorCode ? URL_ERROR_MESSAGES[errorCode] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || isSubmitting) return;

    setIsSubmitting(true);
    setErrorCode(null);

    const result = await saveUrlContent(url, reflection || undefined);
    setIsSubmitting(false);

    if (result.success) {
      showToast("静かに置かれました。");
      onSuccess();
    } else {
      setErrorCode((result.errorCode as UrlErrorCode) ?? "server");
    }
  };

  const handleRetry = () => {
    setErrorCode(null);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* URL Input */}
      <div>
        <input
          type="text"
          placeholder="https://..."
          value={url}
          onChange={(e) => { setUrl(e.target.value); setErrorCode(null); }}
          disabled={isSubmitting}
          className="w-full bg-transparent border-b border-notion-border dark:border-white/20 pb-2 text-notion-text dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-brand transition-colors text-lg"
        />
      </div>

      {/* Reflection Input */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">
          なぜこれを残したいと思いましたか？
          <span className="ml-1 text-gray-300">（任意）</span>
        </label>
        <textarea
          placeholder="この記事が気になった理由、あとで読みたいこと、感じたことなど..."
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          disabled={isSubmitting}
          rows={3}
          className="w-full bg-transparent border border-notion-border dark:border-white/10 rounded-xl px-3 py-2 text-sm text-notion-text dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-brand/50 transition-colors resize-none leading-relaxed"
        />
      </div>

      {/* Inline error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="url-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="rounded-xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/5 px-4 py-3 space-y-1"
          >
            <p className="text-sm text-stone-600 dark:text-stone-300 font-light">
              {error.heading}
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500 font-light leading-relaxed">
              {error.hint}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-1 text-xs text-stone-400 dark:text-stone-500 underline underline-offset-2 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            >
              もう一度試す
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 h-6">
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-slate-400 font-light"
            >
              静かに整理しています...
            </motion.div>
          )}
        </div>
        <button
          type="submit"
          disabled={!url || isSubmitting}
          className="px-6 py-2 rounded-full bg-notion-text dark:bg-white text-white dark:text-black text-sm font-medium disabled:opacity-50 transition-opacity hover:opacity-90"
        >
          余白に置く
        </button>
      </div>
    </form>
  );
}
