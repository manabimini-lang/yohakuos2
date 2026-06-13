"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  MessageSquare, 
  Calendar, 
  Info,
  Activity,
  Heart
} from "lucide-react";
import { getAnalyticsData } from "@/app/admin/actions";

type AnalyticsState = {
  retention7d: number;
  retention30d: number;
  suggestionViewRate: number;
  reflectionRate: number;
  savesTrend: { date: string; count: number }[];
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await getAnalyticsData();
      setData(res);
    } catch (e) {
      console.error(e);
      showToast("分析データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-muted-foreground space-y-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
        <span className="text-xs">分析中...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-muted-foreground space-y-2 max-w-5xl mx-auto">
        <Info className="w-8 h-8 mx-auto text-foreground stroke-[1.5]" />
        <p className="text-sm font-medium text-muted-foreground">分析データを読み込めませんでした</p>
      </div>
    );
  }

  // Calculate max save count to scale visual bars
  const maxSaveCount = Math.max(...data.savesTrend.map(item => item.count), 1);

  return (
    <section className="space-y-8 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-foreground shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-lg font-semibold text-foreground">余白のアナリティクス</h1>
        <p className="mt-1 text-sm text-slate-600">
          アクセス数などの監視ではなく、メンバーの中に「静かな余白が育っているか」を見守ります。
        </p>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Retention Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5">
            <Users className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">継続率</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>7日継続率</span>
                <span>{data.retention7d}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${data.retention7d}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>30日継続率</span>
                <span>{data.retention30d}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${data.retention30d}%` }}
                />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground leading-normal pt-1">
            期間中に登録したユーザーが、現在もYOHAKUで振り返りを継続できている割合を示します。
          </p>
        </div>

        {/* Suggestion Rate Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">提案閲覧率</h3>
          </div>
          <div className="space-y-2 flex flex-col justify-center py-2">
            <div className="text-4xl font-semibold text-foreground tracking-tight">{data.suggestionViewRate}%</div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${data.suggestionViewRate}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground leading-normal">
            AIまたはシステムが創出した学習やリフレクションのロード提案を、ユーザーが確認・完了した割合です。
          </p>
        </div>

        {/* Reflection Rate Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5">
            <Heart className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">振り返り実施率 (過去7日)</h3>
          </div>
          <div className="space-y-2 flex flex-col justify-center py-2">
            <div className="text-4xl font-semibold text-foreground tracking-tight">{data.reflectionRate}%</div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${data.reflectionRate}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground leading-normal">
            登録メンバーのうち、過去7日間に少なくとも1回以上日常のログや振り返りを記録したメンバーの割合です。
          </p>
        </div>

      </div>

      {/* Save Trend Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">保存数推移（過去7日間）</h3>
        </div>

        {data.savesTrend.every(item => item.count === 0) ? (
          <div className="p-8 text-center text-muted-foreground space-y-1">
            <p className="text-xs font-medium text-muted-foreground">まだ保存された知見はありません。</p>
            <p className="text-[10px] text-muted-foreground">これから少しずつ余白が育っていきます。</p>
          </div>
        ) : (
          <div className="h-64 flex items-end justify-between gap-4 pt-6 px-4">
            {data.savesTrend.map((item, index) => {
              const heightPercent = Math.max((item.count / maxSaveCount) * 100, 4);

              return (
                <div key={index} className="flex-1 flex flex-col items-center space-y-3 group h-full justify-end">
                  <div className="relative w-full flex justify-center">
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-foreground text-[10px] px-2 py-0.5 rounded shadow transition-opacity">
                      {item.count} 件
                    </span>
                  </div>
                  <div 
                    className="w-full bg-slate-100 hover:bg-slate-200/80 rounded-t-lg transition-all duration-300"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground truncate">{item.date}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
