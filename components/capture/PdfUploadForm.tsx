"use client";

import { useState, useRef } from "react";
import { savePdfFile } from "@/app/actions/capture";
import { useCaptureStore } from "@/store/capture-store";
import { FileUp, File as FileIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ----------------------------------------------------------------
// エラーコードを日本語メッセージへ変換
// ----------------------------------------------------------------
type PdfErrorCode = "invalid_file" | "too_large" | "upload" | "parse" | "server";

const PDF_ERROR_MESSAGES: Record<PdfErrorCode, { heading: string; hint: string }> = {
  invalid_file: {
    heading: "PDFファイルのみ保存できます。",
    hint: "拡張子が .pdf のファイルを選んでください。",
  },
  too_large: {
    heading: "ファイルが大きすぎます。",
    hint: "20MB以下のPDFを選んでください。",
  },
  upload: {
    heading: "アップロードできませんでした。",
    hint: "ネットワーク状況を確認してから、もう一度お試しください。",
  },
  parse: {
    heading: "PDFの読み取りに問題がありました。",
    hint: "別のPDFで試してみてください。",
  },
  server: {
    heading: "保存できませんでした。",
    hint: "しばらくしてからもう一度お試しください。",
  },
};

// ----------------------------------------------------------------
// Inline file validation (client-side, before server round-trip)
// ----------------------------------------------------------------
function validateFile(file: File): PdfErrorCode | null {
  if (file.type !== "application/pdf") return "invalid_file";
  if (file.size > 20 * 1024 * 1024) return "too_large";
  return null;
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export function PdfUploadForm({ onSuccess }: { onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [reflection, setReflection] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorCode, setErrorCode] = useState<PdfErrorCode | null>(null);
  const showToast = useCaptureStore((state) => state.showToast);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const error = errorCode ? PDF_ERROR_MESSAGES[errorCode] : null;

  const handleFile = (selectedFile: File | null) => {
    if (!selectedFile) return;
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setErrorCode(validationError);
      return;
    }
    setErrorCode(null);
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || isSubmitting) return;

    setIsSubmitting(true);
    setErrorCode(null);

    const formData = new FormData();
    formData.append("file", file);
    if (reflection.trim()) {
      formData.append("reflection", reflection.trim());
    }

    const result = await savePdfFile(formData);
    setIsSubmitting(false);

    if (result.success) {
      showToast("静かに置かれました。");
      onSuccess();
    } else {
      setErrorCode((result.errorCode as PdfErrorCode) ?? "server");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* File Drop Zone */}
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging
              ? "border-brand bg-brand/5 dark:bg-brand/10"
              : "border-notion-border dark:border-border hover:border-gray-300 dark:hover:border-white/20"
          }`}
        >
          <FileUp className={`w-6 h-6 mb-2 ${isDragging ? "text-brand" : "text-gray-400"}`} />
          <p className="text-sm text-gray-500 font-light">クリックまたはドラッグ＆ドロップ</p>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
        </div>
      ) : (
        <div className="p-3 rounded-xl border border-notion-border dark:border-border bg-gray-50 dark:bg-card flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileIcon className="w-5 h-5 text-gray-400 shrink-0" />
            <div className="truncate">
              <p className="text-sm font-medium text-notion-text dark:text-foreground truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          {!isSubmitting && (
            <button
              type="button"
              onClick={() => { setFile(null); setErrorCode(null); }}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 shrink-0 transition-colors"
            >
              クリア
            </button>
          )}
        </div>
      )}

      {/* Inline error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="pdf-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="rounded-xl border border-stone-200 dark:border-border bg-stone-50 dark:bg-card px-4 py-3 space-y-1"
          >
            <p className="text-sm text-stone-600 dark:text-stone-300 font-light">
              {error.heading}
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500 font-light leading-relaxed">
              {error.hint}
            </p>
            <button
              type="button"
              onClick={() => setErrorCode(null)}
              className="mt-1 text-xs text-stone-400 dark:text-stone-500 underline underline-offset-2 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            >
              もう一度試す
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reflection */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">
          なぜこれを残したいと思いましたか？
          <span className="ml-1 text-gray-300">（任意）</span>
        </label>
        <textarea
          placeholder="このPDFを保存した理由、あとで参照したいこと..."
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          disabled={isSubmitting}
          rows={2}
          className="w-full bg-transparent border border-notion-border dark:border-border rounded-xl px-3 py-2 text-sm text-notion-text dark:text-foreground placeholder:text-gray-400 focus:outline-none focus:border-brand/50 transition-colors resize-none leading-relaxed"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 h-6">
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground font-light"
            >
              記録を保存しています...
            </motion.div>
          )}
        </div>
        <button
          type="submit"
          disabled={!file || isSubmitting}
          className="px-6 py-2 rounded-full bg-notion-text dark:bg-white text-foreground dark:text-black text-sm font-medium disabled:opacity-50 transition-opacity hover:opacity-90"
        >
          余白に置く
        </button>
      </div>
    </form>
  );
}
