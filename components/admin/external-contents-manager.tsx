"use client";

import { useState, useEffect } from "react";
import { 
  Link2, 
  Trash2, 
  ExternalLink, 
  Youtube, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  Smartphone,
  Plus,
  Loader2
} from "lucide-react";

type ExternalContent = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  type: string;
  road: string;
  tags: any; // string[] (parsed from JSONB)
  description: string | null;
  createdAt: string;
};

const TYPES = [
  { id: "note", label: "note", icon: BookOpen, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  { id: "youtube", label: "YouTube", icon: Youtube, color: "text-rose-600 bg-rose-50 border-rose-100" },
  { id: "article", label: "外部記事", icon: FileText, color: "text-blue-600 bg-blue-50 border-blue-100" },
  { id: "discord", label: "Discord", icon: MessageSquare, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
  { id: "app", label: "Webアプリ/ツール", icon: Smartphone, color: "text-amber-600 bg-amber-50 border-amber-100" },
];

const DEFAULT_ROADS = [
  { slug: "beginner", title: "初任者ロード" },
  { slug: "side-hustle", title: "副業ロード" },
  { slug: "resignation", title: "退職ロード" },
];

export function ExternalContentsManager() {
  const [roads, setRoads] = useState<any[]>(DEFAULT_ROADS);
  const [contents, setContents] = useState<ExternalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("note");
  const [road, setRoad] = useState("初任者ロード");
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    fetchContents();
    fetchRoads();
  }, []);

  const fetchRoads = async () => {
    try {
      const res = await fetch("/api/roads");
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setRoads(data);
          setRoad(data[0].title);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Auto-detect type from URL
  useEffect(() => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
      setType("youtube");
    } else if (lowerUrl.includes("note.com")) {
      setType("note");
    } else if (lowerUrl.includes("discord.com") || lowerUrl.includes("discord.gg")) {
      setType("discord");
    }
  }, [url]);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/external-contents/list");
      if (res.ok) {
        const data = await res.json();
        setContents(data);
      }
    } catch (error) {
      console.error("Failed to load external contents:", error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      showToast("タイトルとURLは必須です");
      return;
    }

    setSubmitting(true);

    // Parse tags (split by spaces, commas, clean empty elements)
    const tags = tagsInput
      .split(/[,，\s]+/)
      .map(t => t.replace(/^#/, "").trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/external-contents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          url: url.trim(),
          thumbnailUrl: thumbnailUrl.trim() || null,
          type,
          road,
          tags,
          description: description.trim() || null,
        }),
      });

      if (res.ok) {
        showToast("コンテンツを追加しました");
        // Reset form
        setTitle("");
        setUrl("");
        setThumbnailUrl("");
        setDescription("");
        setTagsInput("");
        // Reload list
        fetchContents();
      } else {
        const errorData = await res.json();
        showToast(errorData.error || "保存に失敗しました");
      }
    } catch (error) {
      console.error(error);
      showToast("エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このコンテンツを削除しますか？")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/external-contents/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("コンテンツを削除しました");
        setContents(prev => prev.filter(c => c.id !== id));
      } else {
        showToast("削除に失敗しました");
      }
    } catch (error) {
      console.error(error);
      showToast("エラーが発生しました");
    } finally {
      setDeletingId(null);
    }
  };

  const getTypeIcon = (typeStr: string) => {
    const target = TYPES.find(t => t.id === typeStr);
    if (!target) return Link2;
    return target.icon;
  };

  const getTypeStyle = (typeStr: string) => {
    const target = TYPES.find(t => t.id === typeStr);
    return target ? target.color : "text-slate-600 bg-slate-50 border-slate-100";
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-xl font-medium text-slate-900 tracking-tight">外部リソース管理</h1>
        <p className="text-sm text-slate-500">
          リンクを追加するだけで、各ロードに外部のnoteやYouTubeなどの教材を紐付けることができます。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Notion-style Drop-link Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Link2 className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-medium text-slate-800">新しいリンクを置く</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {/* URL */}
            <div className="space-y-1.5">
              <label htmlFor="url" className="text-xs font-medium text-slate-500">URL</label>
              <input
                id="url"
                type="url"
                required
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-slate-300 focus:outline-none transition-colors"
              />
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="title" className="text-xs font-medium text-slate-500">タイトル</label>
              <input
                id="title"
                type="text"
                required
                placeholder="コンテンツのタイトルを入力"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-slate-300 focus:outline-none transition-colors"
              />
            </div>

            {/* Thumbnail URL */}
            <div className="space-y-1.5">
              <label htmlFor="thumbnailUrl" className="text-xs font-medium text-slate-500">サムネイル画像URL（任意）</label>
              <input
                id="thumbnailUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-slate-300 focus:outline-none transition-colors"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-xs font-medium text-slate-500">説明（任意）</label>
              <textarea
                id="description"
                placeholder="コンテンツの概要や一言コメント"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-slate-300 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Type & Road */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="type" className="text-xs font-medium text-slate-500">種類</label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-2 py-2 text-slate-800 focus:border-slate-300 focus:outline-none bg-white transition-colors"
                >
                  {TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="road" className="text-xs font-medium text-slate-500">対象ロード</label>
                <select
                  id="road"
                  value={road}
                  onChange={(e) => setRoad(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-2 py-2 text-slate-800 focus:border-slate-300 focus:outline-none bg-white transition-colors"
                >
                  {roads.map(r => (
                    <option key={r.slug || r.id} value={r.title}>{r.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label htmlFor="tags" className="text-xs font-medium text-slate-500">タグ（スペース区切り）</label>
              <input
                id="tags"
                type="text"
                placeholder="授業準備 初任者 実践例"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-slate-300 focus:outline-none transition-colors"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>追加中...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>コンテンツを追加</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right List: Notion-style Registered Contents */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[450px]">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-800">登録済みのリンク一覧</h2>
            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-100">
              {contents.length} 件のリンク
            </span>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300 mb-2" />
              <span className="text-xs">ロード中...</span>
            </div>
          ) : contents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12 px-6 text-center space-y-2">
              <Link2 className="w-8 h-8 text-slate-200 stroke-[1.5]" />
              <p className="text-sm font-medium text-slate-500">まだリンクが置かれていません</p>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                左側のフォームから教材のURLを入力し、最初のコンテンツを追加してください。
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px]">
              {contents.map((item) => {
                const IconComponent = getTypeIcon(item.type);
                let parsedTags: string[] = [];
                if (item.tags) {
                  try {
                    parsedTags = typeof item.tags === "string" ? JSON.parse(item.tags) : item.tags;
                  } catch {
                    parsedTags = [];
                  }
                }

                return (
                  <div key={item.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors group">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Meta Line: Type & Road */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md border font-medium ${getTypeStyle(item.type)}`}>
                          <IconComponent className="w-3.5 h-3.5 stroke-[2]" />
                          <span>{TYPES.find(t => t.id === item.type)?.label || item.type}</span>
                        </span>
                        <span className="text-slate-400 bg-slate-100/70 border border-slate-150 px-2 py-0.5 rounded-md font-medium">
                          {item.road}
                        </span>
                      </div>

                      {/* Title & URL */}
                      <h3 className="text-sm font-medium text-slate-800 leading-snug tracking-tight">
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline inline-flex items-center space-x-1 group/link"
                        >
                          <span>{item.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </a>
                      </h3>

                      {/* Description */}
                      {item.description && (
                        <p className="text-xs text-slate-500 leading-relaxed font-normal">
                          {item.description}
                        </p>
                      )}

                      {/* Tags */}
                      {parsedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {parsedTags.map((tag, idx) => (
                            <span key={idx} className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-100 font-mono">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Delete Action Button */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-all duration-255 shrink-0 opacity-0 group-hover:opacity-100"
                      title="このリンクを削除"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
