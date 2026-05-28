"use client";

import { useState } from "react";
import { saveUrlContent } from "@/app/actions/capture";
import { useCaptureStore } from "@/store/capture-store";
import { motion } from "framer-motion";

export function UrlCaptureForm({ onSuccess }: { onSuccess: () => void }) {
  const [url, setUrl] = useState("");
  const [reflection, setReflection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showToast = useCaptureStore((state) => state.showToast);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || isSubmitting) return;

    setIsSubmitting(true);
    const result = await saveUrlContent(url, reflection || undefined);
    setIsSubmitting(false);

    if (result.success) {
      showToast("余白に記録されました");
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* URL Input */}
      <div>
        <input
          type="url"
          required
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
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

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 h-6">
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-slate-400"
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
