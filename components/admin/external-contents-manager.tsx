"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ExternalLink,
  Feather,
  FileText,
  FileImage,
  Globe,
  Instagram,
  Loader2,
  Link2,
  Plus,
  Settings,
  Trash2,
  Twitter,
  Youtube,
  BookOpen,
} from "lucide-react";

type ExternalContent = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  type: string;
  road: string;
  tags: unknown;
  description: string | null;
  createdAt: string;
};

type RoadOption = {
  id?: string;
  slug?: string;
  title: string;
};

type ContentType =
  | "youtube"
  | "instagram"
  | "x"
  | "note"
  | "article"
  | "pdf"
  | "image"
  | "website";

type ContentViewModel = {
  source: ExternalContent;
  id: string;
  title: string;
  description: string;
  url: string;
  domain: string;
  type: ContentType;
  thumbnailUrl: string | null;
  isPdf: boolean;
  roadLabel: string;
  tags: string[];
};

const DEFAULT_ROADS: RoadOption[] = [
  { slug: "beginner", title: "初任者ロード" },
  { slug: "side-hustle", title: "副業ロード" },
  { slug: "resignation", title: "退職ロード" },
];

const TYPE_OPTIONS: Array<{
  id: ContentType;
  label: string;
  icon: typeof BookOpen;
  className: string;
}> = [
  { id: "note", label: "note", icon: BookOpen, className: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  { id: "youtube", label: "YouTube", icon: Youtube, className: "text-rose-600 bg-rose-50 border-rose-100" },
  { id: "instagram", label: "Instagram", icon: Instagram, className: "text-purple-600 bg-purple-50 border-purple-100" },
  { id: "x", label: "X (Twitter)", icon: Twitter, className: "text-slate-900 bg-slate-50 border-slate-200" },
  { id: "article", label: "外部記事", icon: FileText, className: "text-blue-600 bg-blue-50 border-blue-100" },
  { id: "pdf", label: "PDF", icon: FileText, className: "text-red-600 bg-red-50 border-red-100" },
  { id: "image", label: "画像", icon: FileImage, className: "text-orange-600 bg-orange-50 border-orange-100" },
  { id: "website", label: "Webサイト", icon: Globe, className: "text-slate-600 bg-slate-50 border-slate-100" },
];

function extractYouTubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
  return match?.[1];
}

function parseTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === "string");
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === "string") : [];
    } catch {
      return [];
    }
  }

  return [];
}

function detectType(url: string, fallback: ContentType): ContentType {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) return "youtube";
  if (lowerUrl.includes("instagram.com")) return "instagram";
  if (lowerUrl.includes("x.com") || lowerUrl.includes("twitter.com")) return "x";
  if (lowerUrl.includes("note.com")) return "note";
  if (lowerUrl.endsWith(".pdf")) return "pdf";
  if (lowerUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i)) return "image";

  return "website";
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function toViewModel(item: ExternalContent): ContentViewModel {
  const type = detectType(item.url, item.type as ContentType);
  const tags = parseTags(item.tags);
  const youtubeId = type === "youtube" ? extractYouTubeId(item.url) : undefined;
  const thumbnailUrl = item.thumbnailUrl ?? (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null);

  return {
    source: item,
    id: item.id,
    title: item.title,
    description: item.description ?? "",
    url: item.url,
    domain: getDomain(item.url),
    type,
    thumbnailUrl,
    isPdf: type === "pdf",
    roadLabel: item.road,
    tags,
  };
}

export function ExternalContentsManager() {
  const [roads, setRoads] = useState<RoadOption[]>(DEFAULT_ROADS);
  const [contents, setContents] = useState<ExternalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ContentType>("note");
  const [road, setRoad] = useState(DEFAULT_ROADS[0].title);
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    void fetchContents();
    void fetchRoads();
  }, []);

  useEffect(() => {
    if (!url.trim()) return;
    setType((current) => detectType(url, current));
  }, [url]);

  const fetchRoads = async () => {
    try {
      const response = await fetch("/api/roads");
      if (!response.ok) return;

      const data = (await response.json()) as RoadOption[];
      if (Array.isArray(data) && data.length > 0) {
        setRoads(data);
        setRoad(data[0].title);
      }
    } catch (error) {
      console.error("Failed to load roads:", error);
    }
  };

  const fetchContents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/external-contents/list");
      if (!response.ok) return;

      const data = (await response.json()) as ExternalContent[];
      setContents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load external contents:", error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3000);
  };

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setThumbnailUrl("");
    setDescription("");
    setType("note");
    setRoad(roads[0]?.title ?? DEFAULT_ROADS[0].title);
    setTagsInput("");
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !url.trim()) {
      showToast("タイトルとURLは必須です");
      return;
    }

    setSubmitting(true);

    const tags = tagsInput
      .split(/[,，\s]+/)
      .map((tag) => tag.replace(/^#/, "").trim())
      .filter(Boolean);

    try {
      const response = await fetch(editingId ? `/api/external-contents/${editingId}` : "/api/external-contents/create", {
        method: editingId ? "PATCH" : "POST",
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        showToast(errorData?.error ?? "保存に失敗しました");
        return;
      }

      showToast(editingId ? "コンテンツを更新しました" : "コンテンツを追加しました");
      resetForm();
      await fetchContents();
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
      const response = await fetch(`/api/external-contents/${id}`, { method: "DELETE" });
      if (!response.ok) {
        showToast("削除に失敗しました");
        return;
      }

      showToast("コンテンツを削除しました");
      setContents((current) => current.filter((content) => content.id !== id));
    } catch (error) {
      console.error(error);
      showToast("エラーが発生しました");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (item: ExternalContent) => {
    setEditingId(item.id);
    setTitle(item.title);
    setUrl(item.url);
    setThumbnailUrl(item.thumbnailUrl ?? "");
    setDescription(item.description ?? "");
    setType(item.type as ContentType);
    setRoad(item.road);
    setTagsInput(parseTags(item.tags).join(" "));
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const contentsViewModel = useMemo(() => contents.map(toViewModel), [contents]);

  return (
    <div className="relative mx-auto max-w-6xl space-y-8">
      {toastMessage ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toastMessage}
        </div>
      ) : null}

      <div className="space-y-1">
        <h1 className="text-xl font-medium tracking-tight text-foreground">外部リソース管理</h1>
        <p className="text-sm text-muted-foreground">
          リンクを追加して、各ロードに note・YouTube・記事などを紐付けられます。
        </p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-12">
        <div className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">
              {editingId ? "リンクを編集する" : "新しいリンクを置く"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <label htmlFor="url" className="text-xs font-medium text-muted-foreground">
                URL
              </label>
              <input
                id="url"
                type="url"
                required
                placeholder="https://example.com/article"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-foreground placeholder-slate-400 transition-colors focus:border-slate-300 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="title" className="text-xs font-medium text-muted-foreground">
                タイトル
              </label>
              <input
                id="title"
                type="text"
                required
                placeholder="コンテンツのタイトルを入力"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-foreground placeholder-slate-400 transition-colors focus:border-slate-300 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="thumbnailUrl" className="text-xs font-medium text-muted-foreground">
                サムネイル画像URL（任意）
              </label>
              <input
                id="thumbnailUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={thumbnailUrl}
                onChange={(event) => setThumbnailUrl(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-foreground placeholder-slate-400 transition-colors focus:border-slate-300 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="description" className="text-xs font-medium text-muted-foreground">
                説明（任意）
              </label>
              <textarea
                id="description"
                placeholder="コンテンツの概要や一言コメント"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-foreground placeholder-slate-400 transition-colors focus:border-slate-300 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="type" className="text-xs font-medium text-muted-foreground">
                  種類
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(event) => setType(event.target.value as ContentType)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-foreground transition-colors focus:border-slate-300 focus:outline-none"
                >
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="road" className="text-xs font-medium text-muted-foreground">
                  対象ロード
                </label>
                <select
                  id="road"
                  value={road}
                  onChange={(event) => setRoad(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-foreground transition-colors focus:border-slate-300 focus:outline-none"
                >
                  {roads.map((item) => (
                    <option key={item.slug ?? item.id ?? item.title} value={item.title}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tags" className="text-xs font-medium text-muted-foreground">
                タグ（スペース区切り）
              </label>
              <input
                id="tags"
                type="text"
                placeholder="授業準備 初任者 実践例"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-foreground placeholder-slate-400 transition-colors focus:border-slate-300 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>追加中...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>{editingId ? "コンテンツを更新" : "コンテンツを追加"}</span>
                </>
              )}
            </button>

            {editingId ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                編集をキャンセル
              </button>
            ) : null}
          </form>
        </div>

        <div className="flex min-h-[450px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-medium text-foreground">登録済みのリンク一覧</h2>
            <span className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {contents.length} 件のリンク
            </span>
          </div>

          {loading ? (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mb-2 h-6 w-6 animate-spin text-muted-foreground" />
              <span className="text-xs">ロード中...</span>
            </div>
          ) : contentsViewModel.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center space-y-2 px-6 py-12 text-center text-muted-foreground">
              <Feather className="mb-2 h-8 w-8 stroke-[1.5] text-foreground" />
              <p className="text-sm font-medium">まだ何も置いていません。</p>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
                整理できなくても大丈夫。<br />
                まずは、ひとつ置いてみませんか。
              </p>
            </div>
          ) : (
            <div className="max-h-[600px] divide-y divide-slate-100 overflow-y-auto">
              {contentsViewModel.map((item) => {
                const typeOption = TYPE_OPTIONS.find((option) => option.id === item.type) ?? TYPE_OPTIONS[0];
                const TypeIcon = typeOption.icon;

                return (
                  <div
                    key={item.id}
                    className="group flex gap-4 p-4 transition-colors hover:bg-slate-50/50 active:scale-[0.995]"
                  >
                    <div className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200/60 bg-slate-100 sm:h-20 sm:w-32">
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <TypeIcon className="h-5 w-5 stroke-[1.5] text-muted-foreground" />
                      )}
                      {item.isPdf ? (
                        <div className="absolute right-1 top-1 rounded bg-red-500 px-1 text-[8px] font-bold text-white">
                          PDF
                        </div>
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-medium ${typeOption.className}`}>
                          <TypeIcon className="h-3.5 w-3.5 stroke-[2]" />
                          <span>{typeOption.label}</span>
                        </span>
                        <span className="rounded-md border border-slate-100 bg-slate-100/70 px-2 py-0.5 font-medium text-muted-foreground">
                          {item.roadLabel}
                        </span>
                        {item.domain ? (
                          <span className="font-mono text-muted-foreground">{item.domain}</span>
                        ) : null}
                      </div>

                      <h3 className="text-sm font-medium tracking-tight text-foreground line-clamp-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          <span>{item.title}</span>
                          <ExternalLink className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                        </a>
                      </h3>

                      {item.description ? (
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}

                      {item.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded border border-slate-100 bg-slate-50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-col items-center gap-1 sm:flex-row sm:opacity-0 sm:transition-all sm:group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleEdit(item.source)}
                        className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-slate-100 hover:text-slate-600"
                        title="このリンクを編集"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
                        title="このリンクを削除"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
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
