"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { analyzePhotoContent, savePhotoFile } from "@/app/actions/capture";
import { useCaptureStore } from "@/store/capture-store";

export function PhotoCaptureForm({ onSuccess }: { onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{ summary: string; tags: string[] } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showToast = useCaptureStore((state) => state.showToast);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFile = (selected: File | null) => {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("画像ファイルを選んでください。");
      return;
    }
    if (selected.size > 15 * 1024 * 1024) {
      setError("写真は15MB以下にしてください。");
      return;
    }
    setError(null);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    if (reflection.trim()) formData.append("reflection", reflection.trim());
    const result = await savePhotoFile(formData);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error ?? "写真を保存できませんでした。");
      return;
    }
    const saved = result.data as { id?: string } | undefined;
    setSavedId(saved?.id ?? null);
    showToast("写真をYUIに記録しました。端末の写真にも保存されています。");
  };

  const handleAnalyze = async () => {
    if (!savedId || isAnalyzing) return;
    setIsAnalyzing(true);
    setError(null);
    const result = await analyzePhotoContent(savedId);
    setIsAnalyzing(false);
    if (!result.success) {
      setError(result.error ?? "写真の解析に失敗しました。");
      return;
    }
    setAnalysis({ summary: result.summary ?? "", tags: result.tags ?? [] });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!file ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 text-slate-600 transition hover:border-sky-300 hover:bg-sky-50"
        >
          <Camera className="h-8 w-8 text-sky-600" />
          <span className="text-sm font-medium">カメラを起動して写真を記録</span>
          <span className="text-xs text-slate-400">撮影後は端末の写真にも保存されます</span>
        </button>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {previewUrl ? <img src={previewUrl} alt="記録する写真のプレビュー" className="max-h-64 w-full object-contain" /> : null}
          <button type="button" onClick={() => { setFile(null); setPreviewUrl(null); }} className="w-full px-3 py-2 text-xs text-slate-500 hover:bg-white">別の写真を選ぶ</button>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => handleFile(event.target.files?.[0] ?? null)} />
      <label className="text-sm text-slate-600">
        この写真について <span className="text-slate-300">（任意）</span>
        <textarea value={reflection} onChange={(event) => setReflection(event.target.value)} rows={2} placeholder="あとで思い出したいこと、目的とのつながり" className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300" />
      </label>
      {error ? <p role="alert" className="text-sm text-rose-600">{error}</p> : null}
      {!savedId ? (
        <button type="submit" disabled={!file || isSubmitting} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40">
          {isSubmitting ? "記録中..." : "YUIに記録する"}
        </button>
      ) : (
        <div className="space-y-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
          <p className="text-sm font-medium text-slate-700">写真を記録しました</p>
          <p className="text-xs leading-5 text-slate-500">内容を解析すると、写真の要約や写っているものをYUIの記録に追加します。写真がAIに送信されます。</p>
          {analysis ? <div className="space-y-2"><p className="text-sm text-slate-700">{analysis.summary}</p><div className="flex flex-wrap gap-1">{analysis.tags.map((tag) => <span key={tag} className="rounded-full bg-white px-2 py-1 text-[11px] text-slate-600">{tag}</span>)}</div></div> : null}
          {!analysis ? <button type="button" onClick={() => void handleAnalyze()} disabled={isAnalyzing} className="w-full rounded-full bg-sky-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{isAnalyzing ? "解析中..." : "内容を解析する"}</button> : null}
          <button type="button" onClick={onSuccess} className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">閉じる</button>
        </div>
      )}
      <p className="flex items-center gap-1 text-xs text-slate-400"><ImagePlus className="h-3.5 w-3.5" /> Googleフォトへのバックアップは端末の設定に従います</p>
    </form>
  );
}
