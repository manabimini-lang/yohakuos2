"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { suggestContentAction } from "@/lib/actions/content/suggest-content";
import { ChevronLeft, Share2, CheckCircle2, AlertCircle } from "lucide-react";

const TYPES = [
  { id: "note", label: "note", icon: "📝" },
  { id: "youtube", label: "YouTube", icon: "🎥" },
  { id: "blog", label: "ブログ", icon: "🌐" },
  { id: "book", label: "書籍", icon: "📚" },
  { id: "tool", label: "ツール", icon: "🛠" },
];

import { useEffect } from "react";

const DEFAULT_ROADS = [
  { slug: "beginner", title: "初任者ロード", icon: "🌱" },
  { slug: "side-hustle", title: "副業ロード", icon: "💻" },
  { slug: "resignation", title: "退職ロード", icon: "🚪" },
];

export function ContentShareClient() {
  const router = useRouter();
  const [roads, setRoads] = useState<any[]>(DEFAULT_ROADS);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState("note");
  const [selectedRoad, setSelectedRoad] = useState("beginner");
  const [tagsString, setTagsString] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadRoads() {
      try {
        const res = await fetch("/api/roads");
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setRoads(data);
          }
        }
      } catch (err) {
        console.error("Failed to load roads:", err);
      }
    }
    loadRoads();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !title.trim()) {
      setError("URLとタイトルは必須です。");
      return;
    }

    setSaving(true);
    setError("");

    // Parse comma separated tags
    const tags = tagsString
      .split(/[,、]/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const matchedRoad = roads.find((r) => r.slug === selectedRoad);
    const roadTitle = matchedRoad ? matchedRoad.title : "初任者ロード";

    const result = await suggestContentAction({
      url: url.trim(),
      title: title.trim(),
      description: description.trim() || undefined,
      road: roadTitle,
      tags,
      type: selectedType as any,
    });

    if (result.ok) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } else {
      setError(result.error ?? "共有に失敗しました。");
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-500">
          <CheckCircle2 className="w-6 h-6 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-serif text-foreground">共有されました</h1>
          <p className="text-xs text-slate-450 leading-relaxed">
            知見の推薦ありがとうございました。<br />
            ダッシュボードに戻っています...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12 md:py-24 space-y-10 selection:bg-slate-100">
      {/* Back Link */}
      <div>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-xs text-muted-foreground hover:text-slate-650 transition-colors font-mono"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
          Dashboard
        </Link>
      </div>

      {/* Header Title */}
      <div className="space-y-2">
        <h1 className="text-2xl font-serif text-slate-850 tracking-wide flex items-center gap-2">
          <Share2 className="w-5.5 h-5.5 text-slate-450 stroke-[1.5]" />
          <span>知見を共有する</span>
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          誰かの歩みの少しの参考になるような、外部の有益なコンテンツをYOHAKUの空間に置きます。
        </p>
      </div>

      {/* Share Form */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-slate-150 rounded-2xl p-6 md:p-8 shadow-sm">
        {error && (
          <div className="flex items-start space-x-2 text-xs text-red-500 bg-red-50/55 border border-red-100 p-3.5 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* URL Input */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">
            URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://note.com/example/n/..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-slate-350 focus:border-slate-400 focus:outline-none focus:ring-0"
            required
            disabled={saving}
          />
        </div>

        {/* Title Input */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">
            タイトル
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="コンテンツのタイトルを入力"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-slate-350 focus:border-slate-400 focus:outline-none focus:ring-0"
            required
            disabled={saving}
          />
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">
            説明 (任意)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="どんなところが参考になるか、一言添えてみましょう"
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-foreground placeholder:text-slate-350 focus:border-slate-400 focus:outline-none focus:ring-0 resize-none leading-relaxed"
            disabled={saving}
          />
        </div>

        {/* Type selector */}
        <div className="space-y-2.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">
            コンテンツの種類
          </label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedType(t.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs transition-all duration-300 ${
                  selectedType === t.id
                    ? "border-slate-850 bg-slate-900 text-foreground font-medium shadow-sm"
                    : "border-slate-150 bg-white text-slate-600 hover:border-slate-200"
                }`}
                disabled={saving}
              >
                <span>{t.icon} {t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Road selector */}
        <div className="space-y-2.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">
            関連するロード
          </label>
          <div className="flex flex-wrap gap-2">
            {roads.map((r) => (
              <button
                key={r.slug}
                type="button"
                onClick={() => setSelectedRoad(r.slug)}
                className={`px-3 py-1.5 rounded-xl border text-xs transition-all duration-300 ${
                  selectedRoad === r.slug
                    ? "border-slate-850 bg-slate-900 text-foreground font-medium shadow-sm"
                    : "border-slate-150 bg-white text-slate-600 hover:border-slate-200"
                }`}
                disabled={saving}
              >
                <span>{r.icon} {r.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tags input */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">
            タグ (カンマ区切り)
          </label>
          <input
            type="text"
            value={tagsString}
            onChange={(e) => setTagsString(e.target.value)}
            placeholder="行動心理, キャリア, 時間術"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-slate-350 focus:border-slate-400 focus:outline-none focus:ring-0"
            disabled={saving}
          />
        </div>

        {/* Submit button */}
        <div className="pt-4 border-t border-slate-50 flex justify-end">
          <button
            type="submit"
            disabled={saving || !url.trim() || !title.trim()}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 text-foreground font-medium px-6 py-2.5 text-sm shadow-sm transition-colors disabled:opacity-50"
          >
            {saving ? "共有中..." : "共有する"}
          </button>
        </div>
      </form>
    </div>
  );
}
