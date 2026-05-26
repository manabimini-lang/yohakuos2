"use client";

import { useState, useRef } from "react";
import { savePdfFile } from "@/app/actions/capture";
import { useCaptureStore } from "@/store/capture-store";
import { Loader2, FileUp, File as FileIcon } from "lucide-react";
import { motion } from "framer-motion";

export function PdfUploadForm({ onSuccess }: { onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [reflection, setReflection] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showToast = useCaptureStore((state) => state.showToast);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File | null) => {
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf") {
      alert("PDFのみアップロード可能です。");
      return;
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      alert("20MB以下のPDFを選択してください。");
      return;
    }
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
    const formData = new FormData();
    formData.append("file", file);
    if (reflection.trim()) {
      formData.append("reflection", reflection.trim());
    }

    const result = await savePdfFile(formData);
    setIsSubmitting(false);

    if (result.success) {
      showToast("余白に記録されました");
      onSuccess();
    } else {
      alert("保存に失敗しました。");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
              : "border-notion-border dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
          }`}
        >
          <FileUp className={`w-6 h-6 mb-2 ${isDragging ? "text-brand" : "text-gray-400"}`} />
          <p className="text-sm text-gray-500">クリックまたはドラッグ＆ドロップ</p>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
        </div>
      ) : (
        <div className="p-3 rounded-xl border border-notion-border dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileIcon className="w-5 h-5 text-gray-400 shrink-0" />
            <div className="truncate">
              <p className="text-sm font-medium text-notion-text dark:text-white truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          {!isSubmitting && (
            <button type="button" onClick={() => setFile(null)} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 shrink-0">
              クリア
            </button>
          )}
        </div>
      )}

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
          className="w-full bg-transparent border border-notion-border dark:border-white/10 rounded-xl px-3 py-2 text-sm text-notion-text dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-brand/50 transition-colors resize-none leading-relaxed"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 h-6">
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>記録を保存しています...</span>
            </motion.div>
          )}
        </div>
        <button
          type="submit"
          disabled={!file || isSubmitting}
          className="px-6 py-2 rounded-full bg-notion-text dark:bg-white text-white dark:text-black text-sm font-medium disabled:opacity-50 transition-opacity hover:opacity-90"
        >
          余白に置く
        </button>
      </div>
    </form>
  );
}
