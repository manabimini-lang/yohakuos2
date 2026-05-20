"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Sparkles, 
  MessageSquare, 
  BookOpen, 
  Plus, 
  ArrowRight,
  Check,
  X,
  Link2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu,
  Hash
} from "lucide-react";
import Link from "next/link";
import { 
  getAdminStats, 
  getSuggestedContents, 
  deleteSuggestedContent, 
  promoteSuggestedContent 
} from "@/app/admin/actions";

type SuggestedContent = {
  id: string;
  title: string;
  url: string;
  type: string;
  road: string;
  tags: any;
  description: string | null;
  createdAt: Date;
};

export function AdminDashboardView() {
  const [stats, setStats] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<SuggestedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, suggestionsData] = await Promise.all([
        getAdminStats(),
        getSuggestedContents()
      ]);
      setStats(statsData);
      setSuggestions(suggestionsData as any);
    } catch (e) {
      console.error(e);
      showToast("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handlePromote = async (id: string) => {
    if (actioningId) return;
    setActioningId(id);
    try {
      await promoteSuggestedContent(id);
      showToast("コンテンツを採用しました");
      // Reload
      const suggestionsData = await getSuggestedContents();
      setSuggestions(suggestionsData as any);
      const statsData = await getAdminStats();
      setStats(statsData);
    } catch (e) {
      console.error(e);
      showToast("採用処理に失敗しました");
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (actioningId) return;
    if (!confirm("この共有提案を見送りますか？（削除されます）")) return;
    setActioningId(id);
    try {
      await deleteSuggestedContent(id);
      showToast("提案を見送りました");
      // Reload
      const suggestionsData = await getSuggestedContents();
      setSuggestions(suggestionsData as any);
      const statsData = await getAdminStats();
      setStats(statsData);
    } catch (e) {
      console.error(e);
      showToast("削除処理に失敗しました");
    } finally {
      setActioningId(null);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-slate-400 space-y-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
        <span className="text-xs">読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
          {toast}
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-xl font-medium text-slate-900 tracking-tight">ダッシュボード</h1>
        <p className="text-sm text-slate-400">YOHAKU OSの現在の全体状況を静かに確認します。</p>
      </div>

      {/* ① 今日の状態 (Notion-style simple metrics) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">登録ユーザー数</span>
            <Users className="w-4 h-4 stroke-[1.5]" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-semibold tracking-tight text-slate-800">{stats.stats.totalUsers}</span>
            <span className="text-xs text-slate-400">名</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Premium会員数</span>
            <Sparkles className="w-4 h-4 text-amber-500 stroke-[1.5]" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-semibold tracking-tight text-slate-800">{stats.stats.premiumUsers}</span>
            <span className="text-xs text-slate-400">名</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Discord共有数</span>
            <MessageSquare className="w-4 h-4 text-indigo-500 stroke-[1.5]" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-semibold tracking-tight text-slate-800">{stats.stats.discordShares}</span>
            <span className="text-xs text-slate-400">件</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">推奨コンテンツ提案</span>
            <BookOpen className="w-4 h-4 text-emerald-500 stroke-[1.5]" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-semibold tracking-tight text-slate-800">{stats.stats.suggestedCount}</span>
            <span className="text-xs text-slate-400">件</span>
          </div>
        </div>
      </section>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Suggested contents & Shortcuts */}
        <div className="lg:col-span-2 space-y-8">
          {/* ② ユーザーからの知見共有（suggested_contents）管理 */}
          <section className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-medium text-slate-800">未承認のコンテンツ提案</h2>
              </div>
              <span className="text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                {suggestions.length} 件
              </span>
            </div>

            {suggestions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1.5">
                <Check className="w-6 h-6 mx-auto text-slate-200 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-500">確認すべき提案はありません</p>
                <p className="text-[10px] text-slate-400">ユーザーが共有したおすすめコンテンツはここに表示されます。</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {suggestions.map((item) => {
                  let parsedTags: string[] = [];
                  if (item.tags) {
                    try {
                      parsedTags = typeof item.tags === "string" ? JSON.parse(item.tags) : item.tags;
                    } catch {
                      parsedTags = [];
                    }
                  }

                  return (
                    <div key={item.id} className="p-5 space-y-3 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <span className="inline-flex text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200/50">
                            {item.road}
                          </span>
                          <h3 className="text-sm font-medium text-slate-800 tracking-tight leading-snug">
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline inline-flex items-center space-x-1"
                            >
                              <span>{item.title}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          </h3>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => handlePromote(item.id)}
                            disabled={actioningId !== null}
                            className="inline-flex items-center justify-center p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors disabled:opacity-40"
                            title="採用する（全体に公開）"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={actioningId !== null}
                            className="inline-flex items-center justify-center p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-colors disabled:opacity-40"
                            title="見送る（削除）"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {item.description && (
                        <p className="text-xs text-slate-500 leading-relaxed font-normal">
                          {item.description}
                        </p>
                      )}

                      {parsedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {parsedTags.map((tag, idx) => (
                            <span key={idx} className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.2 rounded border border-slate-100">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ② コンテンツ管理への導線 */}
          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">コンテンツ管理</h2>
            <p className="text-xs text-slate-500">
              各ロード（初任者・副業・退職）に紐づく公式の学習コンテンツ・外部コンテンツ（YouTube, note等）を編集します。
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Link 
                href="/admin/contents" 
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-left group"
              >
                <div>
                  <h3 className="text-sm font-medium text-slate-800">コンテンツ編集</h3>
                  <span className="text-[10px] text-slate-400">{stats.stats.externalCount} 件のリンク</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link 
                href="/admin/tags" 
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-left group"
              >
                <div>
                  <h3 className="text-sm font-medium text-slate-800">タグ管理</h3>
                  <span className="text-[10px] text-slate-400">教材の分類タグ設定</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </section>
        </div>

        {/* Right column: Road list, Discord Status, AI Stats */}
        <div className="space-y-8">
          
          {/* ③ ロード管理 */}
          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">ロード管理</h2>
            <div className="space-y-3">
              {stats.roads.map((road: any) => (
                <div key={road.id} className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base">{road.icon}</span>
                    <span className="text-xs font-medium text-slate-700">{road.title}</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ④ Discord状態 */}
          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Discord 状態</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">通知用 Webhook</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                  stats.discord.webhook 
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                    : "bg-slate-50 text-slate-400 border border-slate-200"
                }`}>
                  {stats.discord.webhook ? "接続済み" : "未設定"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">フィード取得用 Bot</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                  stats.discord.bot 
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                    : "bg-slate-50 text-slate-400 border border-slate-200"
                }`}>
                  {stats.discord.bot ? "接続済み" : "未設定"}
                </span>
              </div>
            </div>
          </section>

          {/* ⑤ AI接続状況 */}
          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">AI 接続状況</h2>
              <Cpu className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Gemini利用率</span>
                <span className="font-semibold text-slate-700">{stats.stats.geminiRatio}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-slate-800 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats.stats.geminiRatio}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-normal pt-1">
                APIキーを設定し、AI整理（状態整理・気づき抽出）を実行可能なメンバーの割合です。
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
