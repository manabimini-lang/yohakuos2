"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  ShieldAlert, 
  UserX, 
  UserCheck, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Info,
  Shield,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { getAdminMembersList, toggleUserSuspension, changeUserRole } from "@/app/admin/actions";

type Member = {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  role: string;
  plan: string;
  lockedUntil: Date | null;
  discordId: string | null;
  discordName: string | null;
  lastActiveAt: Date;
  accompaniment: {
    lastSuggestionViewedAt: Date | null;
    lastSuggestionTitle: string | null;
    lastLogRecordedAt: Date | null;
  };
  risks: {
    noLog14d: boolean;
    noView14d: boolean;
    trialEndingSoon: boolean;
  };
  stats: {
    savedCount: number;
    logsCount: number;
    suggestionRate: number;
    isDiscordConnected: boolean;
  };
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await getAdminMembersList();
      setMembers(data as any);
    } catch (e) {
      console.error(e);
      showToast("メンバー情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleSuspend = async (userId: string, isCurrentlySuspended: boolean) => {
    if (actioningId) return;
    const confirmMsg = isCurrentlySuspended 
      ? "このユーザーの利用停止を解除しますか？" 
      : "このユーザーを利用停止にしますか？ログインがブロックされます。";
    if (!confirm(confirmMsg)) return;

    setActioningId(userId);
    try {
      await toggleUserSuspension(userId);
      showToast(isCurrentlySuspended ? "利用停止を解除しました" : "利用停止に設定しました");
      await loadMembers();
    } catch (e) {
      console.error(e);
      showToast("処理に失敗しました");
    } finally {
      setActioningId(null);
    }
  };

  const handleToggleRole = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (actioningId) return;
    const confirmMsg = isCurrentlyAdmin 
      ? "このユーザーの管理者権限を解除し、一般ユーザーに戻しますか？" 
      : "このユーザーに管理者権限を付与しますか？管理画面へアクセス可能になります。";
    if (!confirm(confirmMsg)) return;

    setActioningId(userId);
    try {
      await changeUserRole(userId, !isCurrentlyAdmin);
      showToast(!isCurrentlyAdmin ? "管理者権限を付与しました" : "管理者権限を解除しました");
      await loadMembers();
    } catch (e) {
      console.error(e);
      showToast("権限変更に失敗しました");
    } finally {
      setActioningId(null);
    }
  };

  const filteredMembers = members.filter(m => 
    (m.name?.toLowerCase().includes(search.toLowerCase()) || false) || 
    m.email.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="text-lg font-semibold text-foreground">メンバー管理</h1>
          <p className="mt-1 text-sm text-slate-600">
            登録ユーザーのアカウント状態、権限設定、見守り統計を確認・管理します。
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="名前またはメールで検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 bg-slate-50/50"
          />
        </div>
      </header>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground space-y-1.5">
            <Info className="w-8 h-8 mx-auto text-foreground stroke-[1.5]" />
            <p className="text-sm font-medium text-muted-foreground">まだ共有はありません。</p>
            <p className="text-xs text-muted-foreground">これから余白が育っていきます。</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">メンバー</th>
                  <th className="px-6 py-4">登録日</th>
                  <th className="px-6 py-4">プラン</th>
                  <th className="px-6 py-4">状態 / リスクサイン</th>
                  <th className="px-6 py-4">最終利用</th>
                  <th className="px-6 py-4 text-right">詳細 / 操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMembers.map((member) => {
                  const isSuspended = member.lockedUntil && new Date(member.lockedUntil) > new Date();
                  const isAdmin = member.role === "ADMIN" || member.role === "SUPER_ADMIN";
                  const isExpanded = expandedUserId === member.id;

                  // Detect any active risk signs
                  const hasRisks = member.risks.noLog14d || member.risks.noView14d || member.risks.trialEndingSoon;

                  return (
                    <span key={member.id} className="table-row-group">
                      <tr className={`hover:bg-slate-50/50 transition-colors ${isSuspended ? "bg-red-50/10" : ""}`}>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">{member.name || "未設定"}</span>
                            <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                              {member.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {new Date(member.createdAt).toLocaleDateString("ja-JP")}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            member.plan === "premium"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-50 text-muted-foreground border border-slate-200"
                          }`}>
                            {member.plan === "premium" ? "Premium" : "Free"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {isSuspended ? (
                              <span className="inline-flex items-center text-xs font-medium text-rose-600 gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                停止中
                              </span>
                            ) : isAdmin ? (
                              <span className="inline-flex items-center text-xs font-medium text-indigo-600 gap-1">
                                <Shield className="w-3.5 h-3.5" />
                                管理者
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-xs font-medium text-muted-foreground gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                正常
                              </span>
                            )}

                            {/* Risk tags */}
                            {!isSuspended && hasRisks && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {member.risks.noLog14d && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    14日以上ログなし
                                  </span>
                                )}
                                {member.risks.noView14d && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    14日提案未読
                                  </span>
                                )}
                                {member.risks.trialEndingSoon && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    Trial終了間近
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {member.lastActiveAt 
                            ? new Date(member.lastActiveAt).toLocaleString("ja-JP", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : "利用記録なし"
                          }
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setExpandedUserId(isExpanded ? null : member.id)}
                            className="inline-flex items-center space-x-1.5 text-xs text-muted-foreground hover:text-foreground border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white shadow-sm hover:shadow transition-all"
                          >
                            <span>{isExpanded ? "閉じる" : "詳細・操作"}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Details Section */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="px-6 py-5 bg-slate-50/50 border-t border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Left: Detail Stats */}
                              <div className="space-y-4">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">利用状況</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm space-y-1">
                                    <span className="text-[10px] text-muted-foreground font-medium block">保存数</span>
                                    <span className="text-sm font-semibold text-slate-700">
                                      {member.stats.savedCount} 件
                                    </span>
                                  </div>
                                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm space-y-1">
                                    <span className="text-[10px] text-muted-foreground font-medium block">振り返り数</span>
                                    <span className="text-sm font-semibold text-slate-700">
                                      {member.stats.logsCount} 回
                                    </span>
                                  </div>
                                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm space-y-1">
                                    <span className="text-[10px] text-muted-foreground font-medium block">提案閲覧率</span>
                                    <span className="text-sm font-semibold text-slate-700">
                                      {member.stats.suggestionRate}%
                                    </span>
                                  </div>
                                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm space-y-1">
                                    <span className="text-[10px] text-muted-foreground font-medium block">Discord連携</span>
                                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mt-1">
                                      <span className={`w-1.5 h-1.5 rounded-full ${member.stats.isDiscordConnected ? "bg-indigo-500" : "bg-slate-300"}`} />
                                      {member.stats.isDiscordConnected ? "連携中" : "未連携"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Middle: Accompaniment status */}
                              <div className="space-y-4 md:border-l md:border-slate-200/60 md:pl-6">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">伴走状況</h4>
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-[10px] text-muted-foreground font-medium block">最後に提案を閲覧した日時</span>
                                    <span className="text-xs font-semibold text-slate-700">
                                      {member.accompaniment.lastSuggestionViewedAt 
                                        ? new Date(member.accompaniment.lastSuggestionViewedAt).toLocaleString("ja-JP")
                                        : "未確認"
                                      }
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-muted-foreground font-medium block">最後に受け取った提案タイトル</span>
                                    <span className="text-xs font-semibold text-slate-700 leading-snug block mt-0.5">
                                      {member.accompaniment.lastSuggestionTitle || "なし"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-muted-foreground font-medium block">最後のログ記録日時</span>
                                    <span className="text-xs font-semibold text-slate-700">
                                      {member.accompaniment.lastLogRecordedAt
                                        ? new Date(member.accompaniment.lastLogRecordedAt).toLocaleString("ja-JP")
                                        : "記録なし"
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Right: Risk alerts & Operations */}
                              <div className="space-y-4 md:border-l md:border-slate-200/60 md:pl-6 flex flex-col justify-between">
                                <div className="space-y-3">
                                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">見守りリスクサイン</h4>
                                  
                                  {!hasRisks && !isSuspended && (
                                    <p className="text-xs text-muted-foreground italic">今日も伴走は良好です。静かに見守っています。</p>
                                  )}

                                  {isSuspended && (
                                    <p className="text-xs text-rose-500 font-medium">現在このアカウントは停止されています。</p>
                                  )}

                                  {!isSuspended && hasRisks && (
                                    <div className="space-y-1.5">
                                      {member.risks.noLog14d && (
                                        <p className="text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200/50 flex items-center gap-1.5">
                                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                          最近YOHAKUを利用していません。
                                        </p>
                                      )}
                                      {member.risks.noView14d && (
                                        <p className="text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200/50 flex items-center gap-1.5">
                                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                          最近提案を確認していません。
                                        </p>
                                      )}
                                      {member.risks.trialEndingSoon && (
                                        <p className="text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200/50 flex items-center gap-1.5">
                                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                          Trial終了が近づいています。
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                                  {/* Suspension Action */}
                                  <button
                                    onClick={() => handleToggleSuspend(member.id, !!isSuspended)}
                                    disabled={actioningId !== null}
                                    className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all ${
                                      isSuspended 
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                                        : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                    }`}
                                  >
                                    {isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                                    {isSuspended ? "停止解除" : "利用停止"}
                                  </button>

                                  {/* Toggle Admin Role */}
                                  {member.role !== "SUPER_ADMIN" && (
                                    <button
                                      onClick={() => handleToggleRole(member.id, isAdmin)}
                                      disabled={actioningId !== null}
                                      className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all ${
                                        isAdmin 
                                          ? "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200" 
                                          : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                                      }`}
                                    >
                                      <Shield className="w-3.5 h-3.5" />
                                      {isAdmin ? "権限削除" : "管理者権限"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </span>
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
