"use client";

import { useState, useEffect } from "react";
import { addPersonalLog, getPersonalLogs, getCurrentRoad, PersonalLog } from "@/lib/utils/log-db";
import { GeminiStatusIndicator } from "@/components/member/gemini-status-indicator";
import Link from "next/link";
import { MemoryCardRenderer } from "@/components/memory/memory-card-renderer";
import { YohakuResult } from "@/lib/ai/yohaku-generator";
import { 
  BookOpen, 
  Youtube, 
  FileText, 
  MessageSquare, 
  Smartphone, 
  ExternalLink, 
  Share2,
  Loader2
} from "lucide-react";
import { ThemeType, ContextType } from "@prisma/client";
import { THEME_LABELS, CONTEXT_LABELS, getThemeLabel, getContextLabel } from "@/lib/constants/theme-labels";
import { shareToDiscordAction } from "@/lib/actions/share/share-actions"; // パスが一致していることを確認
import { generateShareMarkdown } from "@/lib/ai/share-generator";

const DEFAULT_ROADS = [
  { id: "beginner", slug: "beginner", title: "初任者ロード", icon: "🌱" },
  { id: "side-hustle", slug: "side-hustle", title: "副業ロード", icon: "💻" },
  { id: "resignation", slug: "resignation", title: "退職ロード", icon: "🚪" },
];

type SharedKnowledge = {
  id: string;
  title: string;
  summary: string;
  tags: any;
  road: string;
  createdAt: string;
};

type ExternalContent = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  snapshotUrl?: string | null;
  type: string;
  road: string;
  tags: string[];
  description: string | null;
  theme?: ThemeType | null;
  summary?: string | null;
  meaningStatus?: string | null;
  createdAt: string;
};

interface DashboardClientProps {
  initialYohakuData: YohakuResult;
}

export function DashboardClient({ initialYohakuData }: DashboardClientProps) {
  const [roads, setRoads] = useState<any[]>(DEFAULT_ROADS);
  const [logs, setLogs] = useState<PersonalLog[]>([]);
  const [content, setContent] = useState("");
  const [currentRoad, setCurrentRoad] = useState<string>("beginner");
  const [isSaving, setIsSaving] = useState(false);
  const [isSharingDiscord, setIsSharingDiscord] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [practices, setPractices] = useState<SharedKnowledge[]>([]);
  const [loadingPractices, setLoadingPractices] = useState(true);

  const [externalContents, setExternalContents] = useState<ExternalContent[]>([]);
  const [loadingExternal, setLoadingExternal] = useState(true);

  const [discordFeed, setDiscordFeed] = useState<{ id: string; author: string; content: string; created_at: string }[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    loadData();
    // PWA offline/online event listeners
    // (Moved to a separate useEffect or a custom hook for clarity if needed)
  }, []);

  const loadData = async () => {
    let activeRoads = DEFAULT_ROADS;
    try {
      const res = await fetch("/api/roads");
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          activeRoads = data.map((r: any) => ({
            id: r.slug,
            slug: r.slug,
            title: r.title,
            icon: r.icon,
            description: r.description
          }));
          setRoads(activeRoads);
        }
      }
    } catch (e) {
      console.error(e);
    }

    const road = await getCurrentRoad();
    setCurrentRoad(road);
    
    const data = await getPersonalLogs();
    setLogs(data.slice(0, 3)); // top 3

    if (typeof window !== "undefined" && !navigator.onLine) {
      setLoadingPractices(false);
      setLoadingExternal(false);
      setLoadingFeed(false);
      return;
    }

    const matchedRoad = activeRoads.find(r => r.slug === road);
    const roadTitle = matchedRoad ? matchedRoad.title : "";

    // Load real shared knowledge from Supabase
    setLoadingPractices(true);
    try {
      const res = await fetch("/api/knowledge/list");
      if (res.ok) {
        const allKnowledge = await res.json();
        const matched = allKnowledge.filter((k: any) => k.road === roadTitle);
        const other = allKnowledge.filter((k: any) => k.road !== roadTitle);
        setPractices([...matched, ...other].slice(0, 3));
      }
    } catch (error) {
      console.error("Failed to load practices:", error);
    } finally {
      setLoadingPractices(false);
    }

    // Load external contents from Supabase
    setLoadingExternal(true);
    try {
      const res = await fetch("/api/external-contents/list");
      if (res.ok) {
        const allExternal = await res.json();
        const matched = allExternal.filter((c: any) => c.road === roadTitle);
        const other = allExternal.filter((c: any) => c.road !== roadTitle);
        setExternalContents([...matched, ...other].slice(0, 4));
      }
    } catch (error) {
      console.error("Failed to load external contents:", error);
    } finally {
      setLoadingExternal(false);
    }

    // Load Discord feed
    setLoadingFeed(true);
    try {
      const res = await fetch("/api/discord/feed");
      if (res.ok) {
        const feedData = await res.json();
        setDiscordFeed(feedData.slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to load Discord feed:", error);
    } finally {
      setLoadingFeed(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setIsSaving(true);
    
    try {
      await addPersonalLog({
        road: currentRoad,
        content: content.trim(),
        mood: 0,
        tags: []
      });

      setContent("");
      setToastMessage("ログを保存しました");
      setTimeout(() => setToastMessage(null), 3000);
      
      await loadData();
    } catch (error) {
      console.error(error);
      setToastMessage("保存に失敗しました");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // handleShareDiscord 関数を追加
  const handleShareDiscord = async () => {
    setIsSharingDiscord(true);
    try {
      const markdown = generateShareMarkdown(
        initialYohakuData.dominantThemes,
        initialYohakuData.dominantContexts,
        initialYohakuData.reflection
      );
      await shareToDiscordAction(markdown);
      setToastMessage("Discordに共有しました");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      console.error(error);
      setToastMessage("共有に失敗しました");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsSharingDiscord(false);
    }
  };

  const currentRoadData = roads.find(r => r.id === currentRoad) || roads[0] || DEFAULT_ROADS[0];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:py-24 space-y-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-foreground shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
          {toastMessage}
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <span className="text-xl">{currentRoadData.icon}</span>
          <span>{currentRoadData.title}</span>
          {isOffline && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100 animate-pulse font-sans">
              オフラインモード
            </span>
          )}
        </div>
        <GeminiStatusIndicator />
      </div>

      {/* Yohaku v1 Section: あなたの毎日は消えない */}
      <section className="space-y-12">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-serif text-slate-900 tracking-tight">あなたの毎日は消えない</h1>
          <div className="h-px w-12 bg-slate-200 mx-auto" />
        </div>

        <div className="space-y-10">
          {/* 1. 最近のテーマ */}
          <div className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold text-center">最近のテーマ</h3>
            <div className="flex justify-center gap-2">
              {initialYohakuData.dominantThemes.map(theme => (
                <span key={theme} className="px-4 py-1 rounded-full bg-slate-50 border border-slate-100 text-xs text-slate-600">
                  {getThemeLabel(theme)}
                </span>
              ))}
            </div>
          </div>

          {/* 2. 最近の文脈 */}
          <div className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold text-center">最近の文脈</h3>
            <div className="flex justify-center gap-2">
              {initialYohakuData.dominantContexts.map(ctx => (
                <span key={ctx} className="px-4 py-1 rounded-full bg-indigo-50/50 border border-indigo-100/50 text-xs text-indigo-700/70">
                  {getContextLabel(ctx)}
                </span>
              ))}
            </div>
          </div>

          {/* 3. Reflection */}
          <div className="max-w-md mx-auto">
            <div className="bg-slate-50/30 rounded-3xl p-8 border border-slate-100/50">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold text-center mb-6">Reflection</h3>
              <p className="text-base font-serif text-slate-700 leading-loose text-center whitespace-pre-wrap italic">
                {initialYohakuData.reflection}
              </p>

              <div className="mt-8 flex justify-center">
                <button 
                  onClick={handleShareDiscord}
                  disabled={isSharingDiscord}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/5 hover:bg-slate-900/10 text-slate-600 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {isSharingDiscord ? <Loader2 className="w-3 h-3 animate-spin" /> : <Share2 className="w-3 h-3" />}
                  <span>Discordに共有</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-slate-100 w-full" />

      {/* Quick Input */}
      <section className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="ここからすぐに書き始められます..."
          rows={3}
          disabled={isSaving}
          className="w-full resize-none rounded-2xl border-none bg-slate-50/50 p-6 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-200 transition-colors"
        />
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
            className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-medium text-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? "保存中..." : "書き留める"}
          </button>
        </div>
      </section>

      {/* Recent Logs */}
      <section className="pt-8">
        <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-6">Recent Logs</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">まだログがありません。</p>
        ) : (
          <div className="space-y-6">
            {logs.map((log) => {
              const date = new Date(log.created_at);
              const dateString = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
              const previewContent = log.content.split("\n").slice(0, 2).join("\n");
              const hasMore = log.content.split("\n").length > 2;

              return (
                <div key={log.id} className="group flex flex-col gap-2 border-b border-slate-50 pb-6 transition-opacity opacity-80 hover:opacity-100">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                    <time dateTime={date.toISOString()}>{dateString}</time>
                    <span className="ml-2 text-[10px] tracking-wide text-muted-foreground uppercase">{roads.find(r => r.id === log.road)?.title}</span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {previewContent}
                    {hasMore && <span className="text-muted-foreground ml-1">...</span>}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Today's Small Practices */}
      <section className="pt-8 border-t border-slate-100">
        <div className="space-y-1 mb-6">
          <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">今日の小さな実践</h2>
          <p className="text-[10px] text-muted-foreground font-sans">あなたのロードに合わせた、少し参考になる他者の歩み</p>
        </div>
        
        {loadingPractices ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground font-mono tracking-widest animate-pulse">実践を整理しています...</p>
          </div>
        ) : practices.length === 0 ? (
          <p className="text-xs text-muted-foreground font-serif italic">今日の推薦される実践はまだありません。</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-3">
            {practices.map((practice) => {
              // Unpack tags safely
              let parsedTags: string[] = [];
              if (Array.isArray(practice.tags)) {
                parsedTags = practice.tags;
              } else if (typeof practice.tags === "string") {
                try {
                  parsedTags = JSON.parse(practice.tags);
                } catch {
                  parsedTags = [];
                }
              }

              return (
                <Link
                  key={practice.id}
                  href={`/knowledge/${practice.id}`}
                  className="group rounded-2xl border border-slate-100 bg-white p-6 flex flex-col justify-between space-y-4 transition-all duration-300 hover:border-slate-200"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-medium tracking-wider text-muted-foreground bg-slate-50/80 px-2 py-0.5 rounded-full">
                        {practice.road.replace("ロード", "")}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-foreground leading-snug group-hover:text-foreground transition-colors line-clamp-2">
                      {practice.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {practice.summary}
                    </p>
                  </div>
                  {parsedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-50/50">
                      {parsedTags.map((tag, i) => (
                        <span key={i} className="text-[9px] text-muted-foreground font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Today's Contents */}
      <section className="pt-8 border-t border-slate-100">
        <div className="space-y-1 mb-6">
          <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">今日のコンテンツ</h2>
          <p className="text-[10px] text-muted-foreground font-sans">今のあなたのロードに合わせて推薦される、おすすめの外部インプット</p>
        </div>

        {loadingExternal ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground font-mono tracking-widest animate-pulse">コンテンツを準備しています...</p>
          </div>
        ) : externalContents.length === 0 ? (
          <p className="text-xs text-muted-foreground font-serif italic">今日の推薦コンテンツはまだありません。</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {externalContents.map((item) => {
              return (
                <div
                  key={item.id}
                  onClick={() => window.open(item.url, "_blank")}
                >
                  <MemoryCardRenderer
                    type={item.type}
                    url={item.url}
                    snapshotUrl={item.snapshotUrl}
                    thumbnailUrl={item.thumbnailUrl}
                    summary={item.summary}
                    theme={item.theme}
                    tags={item.tags}
                    meaningStatus={item.meaningStatus}
                    metadata={{
                      title: item.title,
                      description: item.description || undefined,
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Discordの声 Section */}
      <section className="pt-8 border-t border-slate-100">
        <div className="space-y-1 mb-6">
          <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Discordの声</h2>
          <p className="text-[10px] text-muted-foreground font-sans">同じ空間で静かに共有されている実践の声</p>
        </div>

        {loadingFeed ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground font-mono tracking-widest animate-pulse">声を整理しています...</p>
          </div>
        ) : discordFeed.length === 0 ? (
          <p className="text-xs text-muted-foreground font-serif italic">共有されている声はまだありません。</p>
        ) : (
          <div className="space-y-4">
            {discordFeed.map((post) => {
              // Strip standard emojis and limit length
              const cleanedContent = post.content.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]/gu, '');
              const truncatedContent = cleanedContent.length > 80 ? cleanedContent.substring(0, 80) + "..." : cleanedContent;
              const date = new Date(post.created_at);
              const dateString = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;

              return (
                <div 
                  key={post.id} 
                  className="rounded-2xl border border-slate-100 bg-white p-5 space-y-2.5 shadow-sm transition-all duration-300 hover:border-slate-150"
                >
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                    <span className="font-medium text-muted-foreground">@{post.author}</span>
                    <span>{dateString}</span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {truncatedContent}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
