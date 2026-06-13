"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Flag, 
  EyeOff, 
  Eye, 
  Trash2, 
  Mail, 
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle
} from "lucide-react";
import { getModerationList, moderateContent, reportContent } from "@/app/admin/actions";

type ShareItem = {
  id: string;
  createdAt: Date;
  actorName: string;
  actorEmail: string;
  content: {
    title?: string;
    summary?: string;
    tags?: string[];
    road?: string;
  };
  reports: number;
  status: string; // 公開中 | 非表示 | 削除済み
};

export default function ModerationPage() {
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadShares();
  }, []);

  const loadShares = async () => {
    try {
      setLoading(true);
      const data = await getModerationList();
      setShares(data as any);
    } catch (e) {
      console.error(e);
      showToast("モデレーションデータの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleModerate = async (id: string, action: "hide" | "publish" | "delete") => {
    if (actioningId) return;
    if (action === "delete" && !confirm("この共有投稿を完全に削除しますか？")) return;

    setActioningId(id);
    try {
      await moderateContent(id, action);
      showToast(
        action === "hide" 
          ? "投稿を非表示にしました" 
          : action === "publish" 
          ? "投稿を再公開しました" 
          : "投稿を削除しました"
      );
      await loadShares();
    } catch (e) {
      console.error(e);
      showToast("処理に失敗しました");
    } finally {
      setActioningId(null);
    }
  };

  const handleTestReport = async (id: string) => {
    if (actioningId) return;
    setActioningId(id);
    try {
      await reportContent(id);
      showToast("投稿を通報しました（テスト用）");
      await loadShares();
    } catch (e) {
      console.error(e);
      showToast("通報処理に失敗しました");
    } finally {
      setActioningId(null);
    }
  };

  const filteredShares = shares.filter(s => 
    (s.actorName?.toLowerCase().includes(search.toLowerCase()) || false) || 
    s.actorEmail.toLowerCase().includes(search.toLowerCase()) ||
    (s.content.title?.toLowerCase().includes(search.toLowerCase()) || false) ||
    (s.content.summary?.toLowerCase().includes(search.toLowerCase()) || false)
  );

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-muted-foreground space-y-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
        <span className="text-xs">読み込み中...</span>
      </div>
    );
  }

  return (
    <section className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-foreground shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">モデレーション</h1>
          <p className="mt-1 text-sm text-slate-600">
            Discordへ共有されたメンバーの知見を確認し、必要に応じて非表示や削除を行います。
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="投稿者、タイトル、内容で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 bg-slate-50/50"
          />
        </div>
      </header>

      {/* Main Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {filteredShares.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground space-y-1.5">
            <Info className="w-8 h-8 mx-auto text-foreground stroke-[1.5]" />
            <p className="text-sm font-medium text-muted-foreground">まだ共有はありません。</p>
            <p className="text-xs text-muted-foreground">今日も静かな一日でした。</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">投稿者 / 日時</th>
                  <th className="px-6 py-4">共有内容</th>
                  <th className="px-6 py-4">通報</th>
                  <th className="px-6 py-4">状態</th>
                  <th className="px-6 py-4 text-right">操作アクション</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredShares.map((item) => {
                  const isDeleted = item.status === "削除済み";
                  const isHidden = item.status === "非表示";
                  const isLive = item.status === "公開中";

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors ${isHidden ? "bg-slate-50/30" : isDeleted ? "bg-rose-50/5" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{item.actorName}</span>
                          <span className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            {item.actorEmail}
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-2">
                            {new Date(item.createdAt).toLocaleString("ja-JP")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <div className="space-y-1.5">
                          <span className="inline-flex text-[9px] font-semibold bg-slate-100 text-muted-foreground border border-slate-200 px-1.5 py-0.2 rounded">
                            {item.content.road === "beginner" ? "初任者ロード" : item.content.road === "side-hustle" ? "副業ロード" : "退職ロード"}
                          </span>
                          <h4 className="text-xs font-semibold text-foreground leading-snug">{item.content.title || "無題"}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.content.summary || "振り返り内容なし"}</p>
                          {item.content.tags && item.content.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.content.tags.map((tag, idx) => (
                                <span key={idx} className="text-[9px] text-muted-foreground">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1.5">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${
                            item.reports > 0 
                              ? "bg-amber-50 text-amber-700 border border-amber-200" 
                              : "bg-slate-50 text-muted-foreground"
                          }`}>
                            {item.reports} 回
                          </span>
                          {isLive && (
                            <button
                              onClick={() => handleTestReport(item.id)}
                              disabled={actioningId !== null}
                              className="text-[10px] text-muted-foreground hover:text-slate-600 hover:underline"
                            >
                              通報
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">
                        {isLive ? (
                          <span className="inline-flex items-center text-emerald-600 gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            公開中
                          </span>
                        ) : isHidden ? (
                          <span className="inline-flex items-center text-amber-600 gap-1">
                            <EyeOff className="w-3.5 h-3.5" />
                            非表示
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-rose-600 gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            削除済み
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {isLive && (
                            <button
                              onClick={() => handleModerate(item.id, "hide")}
                              disabled={actioningId !== null}
                              className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-800 border border-amber-200 rounded-lg px-2.5 py-1.5 bg-amber-50/40"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                              非表示
                            </button>
                          )}
                          {isHidden && (
                            <button
                              onClick={() => handleModerate(item.id, "publish")}
                              disabled={actioningId !== null}
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 border border-emerald-200 rounded-lg px-2.5 py-1.5 bg-emerald-50/40"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              公開再開
                            </button>
                          )}
                          {!isDeleted && (
                            <button
                              onClick={() => handleModerate(item.id, "delete")}
                              disabled={actioningId !== null}
                              className="inline-flex items-center gap-1 text-[11px] text-rose-700 hover:text-rose-800 border border-rose-200 rounded-lg px-2.5 py-1.5 bg-rose-50/40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              削除
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
