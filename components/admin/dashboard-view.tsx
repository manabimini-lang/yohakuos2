"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Sparkles, 
  BookOpen, 
  Plus, 
  ArrowRight,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Cpu,
  Activity,
  AlertTriangle,
  Clock,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { 
  getAdminStats, 
  getSuggestedContents, 
  deleteSuggestedContent, 
  promoteSuggestedContent,
  getDashboardStatsAndRecentEvents
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
  const [dashboardData, setDashboardData] = useState<any>(null);
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
      const [statsData, suggestionsData, sprint2Data] = await Promise.all([
        getAdminStats(),
        getSuggestedContents(),
        getDashboardStatsAndRecentEvents()
      ]);
      setStats(statsData);
      setSuggestions(suggestionsData as any);
      setDashboardData(sprint2Data);
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
      const sprint2Data = await getDashboardStatsAndRecentEvents();
      setDashboardData(sprint2Data);
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
      const sprint2Data = await getDashboardStatsAndRecentEvents();
      setDashboardData(sprint2Data);
    } catch (e) {
      console.error(e);
      showToast("削除処理に失敗しました");
    } finally {
      setActioningId(null);
    }
  };

  if (loading || !stats || !dashboardData) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-muted-foreground space-y-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
        <span className="text-xs">読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
          {toast}
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-xl font-medium text-foreground tracking-tight">ダッシュボード</h1>
        <p className="text-sm text-muted-foreground">YOHAKU OSの現在の全体状況を静かに確認します。</p>
      </div>

      {/* Contract Alert */}
      {dashboardData.stats.suspiciousSubscriptionsCount > 0 && (
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-amber-800">お支払いや期限の確認が必要な契約があります</h4>
              <p className="text-[11px] text-amber-700 mt-0.5">決済失敗、解約、またはトライアル終了間近の契約が {dashboardData.stats.suspiciousSubscriptionsCount} 件あります。</p>
            </div>
          </div>
          <Link href="/admin/billing" className="text-xs font-medium text-amber-800 hover:underline inline-flex items-center gap-1 shrink-0 bg-white border border-amber-200 px-3 py-1.5 rounded-xl shadow-sm">
            <span>確認する</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ① 今日の状態 (Notion-style simple metrics) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">登録ユーザー数</span>
            <Users className="w-4 h-4 stroke-[1.5]" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-semibold tracking-tight text-foreground">{dashboardData.stats.totalUsers}</span>
            <span className="text-xs text-muted-foreground">名</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">有料会員数</span>
            <Sparkles className="w-4 h-4 text-amber-500 stroke-[1.5]" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-semibold tracking-tight text-foreground">{dashboardData.stats.premiumUsers}</span>
            <span className="text-xs text-muted-foreground">名</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">今日のアクティブ</span>
            <Activity className="w-4 h-4 text-indigo-500 stroke-[1.5]" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-semibold tracking-tight text-foreground">{dashboardData.stats.activeUsersToday}</span>
            <span className="text-xs text-muted-foreground">名</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">AI解析失敗件数</span>
            <AlertTriangle className="w-4 h-4 text-rose-500 stroke-[1.5]" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-semibold tracking-tight text-foreground">{dashboardData.stats.aiFailedCount}</span>
            <span className="text-xs text-muted-foreground">件</span>
          </div>
        </div>
      </section>

      {/* ② 今日のYOHAKU (Saves, logs, etc.) */}
      <section className="bg-muted border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">今日のYOHAKU (余白の創出状況)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-background border border-border rounded-xl p-4 shadow-sm space-y-1">
            <span className="text-[10px] text-muted-foreground font-medium">本日の保存数</span>
            <span className="text-lg font-semibold text-foreground">{dashboardData.todayYohaku.savesToday} 件</span>
          </div>
          <div className="bg-background border border-border rounded-xl p-4 shadow-sm space-y-1">
            <span className="text-[10px] text-muted-foreground font-medium">本日の振り返り</span>
            <span className="text-lg font-semibold text-foreground">{dashboardData.todayYohaku.logsToday} 件</span>
          </div>
          <div className="bg-background border border-border rounded-xl p-4 shadow-sm space-y-1">
            <span className="text-[10px] text-muted-foreground font-medium">本日の提案閲覧</span>
            <span className="text-lg font-semibold text-foreground">{dashboardData.todayYohaku.suggestionsViewedToday} 件</span>
          </div>
          <div className="bg-background border border-border rounded-xl p-4 shadow-sm space-y-1">
            <span className="text-[10px] text-muted-foreground font-medium">Discord共有</span>
            <span className="text-lg font-semibold text-foreground">{dashboardData.todayYohaku.discordSharesToday} 件</span>
          </div>
        </div>
      </section>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Suggested contents & Recent Events */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* ③ 未承認のコンテンツ提案 */}
          <section className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-foreground">未承認のコンテンツ提案</h2>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                {suggestions.length} 件
              </span>
            </div>

            {suggestions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground space-y-1.5">
                <Check className="w-6 h-6 mx-auto text-foreground stroke-[1.5]" />
                <p className="text-xs font-medium text-muted-foreground">確認すべき提案はありません</p>
                <p className="text-[10px] text-muted-foreground">ユーザーが共有したおすすめコンテンツはここに表示されます。</p>
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
                          <h3 className="text-sm font-medium text-foreground tracking-tight leading-snug">
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline inline-flex items-center space-x-1"
                            >
                              <span>{item.title}</span>
                              <ExternalLink className="w-3 h-3 text-muted-foreground" />
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
                        <p className="text-xs text-muted-foreground leading-relaxed font-normal">
                          {item.description}
                        </p>
                      )}

                      {parsedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {parsedTags.map((tag, idx) => (
                            <span key={idx} className="text-[10px] text-muted-foreground bg-slate-50 px-2 py-0.2 rounded border border-slate-100">
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

          {/* ④ 最近の出来事 (Notion-style timeline feed) */}
          <section className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-foreground">最近の出来事</h2>
              </div>
            </div>

            {dashboardData.recentEvents.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground space-y-1">
                <p className="text-xs font-medium text-muted-foreground">今日も静かな一日でした。</p>
                <p className="text-[10px] text-muted-foreground">これから余白が育っていきます。</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {dashboardData.recentEvents.map((event: any, eventIdx: number) => (
                      <li key={event.id}>
                        <div className="relative pb-8">
                          {eventIdx !== dashboardData.recentEvents.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-slate-50 text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-xs text-slate-700">{event.message}</p>
                              </div>
                              <div className="text-right text-[10px] whitespace-nowrap text-muted-foreground">
                                <time dateTime={new Date(event.timestamp).toISOString()}>
                                  {new Date(event.timestamp).toLocaleDateString("ja-JP", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right column: Road list, Discord Status, AI Stats */}
        <div className="space-y-8">
          
          {/* ロード管理 */}
          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">ロード管理</h2>
            <div className="space-y-3">
              {stats.roads.map((road: any) => (
                <div key={road.id} className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base">{road.icon}</span>
                    <span className="text-xs font-medium text-slate-700">{road.title}</span>
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground bg-white border border-slate-100 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Discord状態 */}
          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Discord 状態</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">通知用 Webhook</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                  stats.discord.webhook 
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                    : "bg-slate-50 text-muted-foreground border border-slate-200"
                }`}>
                  {stats.discord.webhook ? "接続済み" : "未設定"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">フィード取得用 Bot</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                  stats.discord.bot 
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                    : "bg-slate-50 text-muted-foreground border border-slate-200"
                }`}>
                  {stats.discord.bot ? "接続済み" : "未設定"}
                </span>
              </div>
            </div>
          </section>

          {/* AI接続状況 */}
          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">AI 接続状況</h2>
              <Cpu className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Gemini利用率</span>
                <span className="font-semibold text-slate-700">{stats.stats.geminiRatio}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-slate-800 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats.stats.geminiRatio}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground leading-normal pt-1">
                APIキーを設定し、AI整理（状態整理・気づき抽出）を実行可能なメンバーの割合です。
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
