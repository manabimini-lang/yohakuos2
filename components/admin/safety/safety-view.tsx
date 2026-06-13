"use client";

import React, { useState, useTransition } from "react";
import {
  Shield,
  ShieldAlert,
  AlertTriangle,
  Check,
  X,
  ArrowRight,
  Clock,
  Activity,
  Users,
  Sparkles,
  Send,
  HelpCircle,
  ShieldCheck,
  RefreshCw,
  Sliders,
} from "lucide-react";
import {
  resolveReviewAction,
  transitionSafetyStateAction,
  triggerSimulatedSignalAction,
} from "@/app/admin/safety/actions";

// Define TypeScript interfaces for props
interface SafetyReview {
  id: string;
  userId: string;
  assessmentId: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskScore: number;
  signals: any[];
  status: string;
  assignedTo: string | null;
  notes: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id?: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface SafetyTransition {
  id: string;
  entityId: string;
  fromState: string;
  toState: string;
  reason: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

interface UserSummary {
  id: string;
  name: string | null;
  email: string;
}

interface SafetyAdminViewProps {
  initialData: {
    metrics: {
      activeIncidents: number;
      pendingReviews: number;
      escalatedCases: number;
      states: {
        safe: number;
        monitoring: number;
        review_required: number;
        restricted: number;
        escalated: number;
      };
    };
    reviews: SafetyReview[];
    transitions: SafetyTransition[];
    users: UserSummary[];
  };
}

const SIGNAL_LABELS: Record<string, string> = {
  usage_frequency: "利用頻度",
  night_activity: "夜間活動",
  session_duration: "セッション時間",
  emotional_volatility: "感情変動",
  repeated_reassurance_requests: "安心要求反復",
  unsafe_prompt_patterns: "危険プロンプト",
  dependency_indicators: "AI依存兆候",
  harassment: "ハラスメント",
  dm_abuse: "DM乱用",
  manipulation_attempts: "操作の試み",
};

const RISK_LEVEL_COLORS = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-rose-50 text-rose-700 border-rose-200",
};

const STATE_COLORS = {
  safe: "text-emerald-600 bg-emerald-50",
  monitoring: "text-amber-600 bg-amber-50",
  review_required: "text-orange-600 bg-orange-50",
  restricted: "text-red-600 bg-red-50",
  escalated: "text-purple-600 bg-purple-50",
};

export function SafetyAdminView({ initialData }: SafetyAdminViewProps) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<"queue" | "transitions">("queue");
  const [selectedReview, setSelectedReview] = useState<SafetyReview | null>(null);
  
  // Resolution Modal Form State
  const [decision, setDecision] = useState<"approved" | "rejected" | "escalated">("approved");
  const [notes, setNotes] = useState("");
  
  // Manual Transition State
  const [selectedUserForTransition, setSelectedUserForTransition] = useState("");
  const [manualTargetState, setManualTargetState] = useState<"safe" | "monitoring" | "review_required" | "restricted" | "escalated">("monitoring");
  const [manualReason, setManualReason] = useState("");
  
  // Simulator State
  const [simulatedUser, setSimulatedUser] = useState("");
  const [simulatedSignalType, setSimulatedSignalType] = useState("dependency_indicators");
  const [simulatedValue, setSimulatedValue] = useState(0.7);
  const [simulatedNotes, setSimulatedNotes] = useState("");
  
  const [isPending, startTransition] = useTransition();

  const handleRefresh = async () => {
    // Actions are dynamic, so we fetch overview again via standard page reload or fresh fetch
    // But since Next.js revalidate works server-side, a clean refresh pattern triggers reload
    window.location.reload();
  };

  const handleResolveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    startTransition(async () => {
      try {
        await resolveReviewAction(selectedReview.id, decision, notes);
        setSelectedReview(null);
        setNotes("");
        // Reload page to reflect changes
        window.location.reload();
      } catch (err) {
        alert("エラーが発生しました: " + (err instanceof Error ? err.message : String(err)));
      }
    });
  };

  const handleManualTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForTransition || !manualReason) {
      alert("ユーザーと理由を入力してください。");
      return;
    }

    startTransition(async () => {
      try {
        await transitionSafetyStateAction(selectedUserForTransition, manualTargetState, manualReason);
        setManualReason("");
        alert("安全状態を変更しました。");
        window.location.reload();
      } catch (err) {
        alert("エラーが発生しました: " + (err instanceof Error ? err.message : String(err)));
      }
    });
  };

  const handleTriggerSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedUser) {
      alert("対象ユーザーを選択してください。");
      return;
    }

    startTransition(async () => {
      try {
        await triggerSimulatedSignalAction(simulatedUser, simulatedSignalType as any, simulatedValue, simulatedNotes);
        setSimulatedNotes("");
        alert("シグナルをシミュレートし、安全分析ジョブをキューに入れました。処理が完了するまでお待ちください。");
        window.location.reload();
      } catch (err) {
        alert("エラーが発生しました: " + (err instanceof Error ? err.message : String(err)));
      }
    });
  };

  return (
    <div className="space-y-6 text-foreground">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">セーフティ・コンソール</h1>
          <p className="text-xs text-muted-foreground">
            YOHAKU Safety Engine Foundation — 安全状態・リスク監視
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-foreground transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          最新状態に更新
        </button>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">監視アクティブインシデント</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">{data.metrics.activeIncidents}</span>
            <span className="text-xs text-muted-foreground">名のアクティブ制限</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">保留中のモデレーター審査</span>
            <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-orange-600">{data.metrics.pendingReviews}</span>
            <span className="text-xs text-muted-foreground">件の未完了レビュー</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">エスカレーション済件数</span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-purple-600">{data.metrics.escalatedCases}</span>
            <span className="text-xs text-muted-foreground">件の管理者要対応ケース</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">正常アカウント（Safe）</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600">{data.metrics.states.safe}</span>
            <span className="text-xs text-muted-foreground">名の安全状態</span>
          </div>
        </div>
      </div>

      {/* Safety States Breakdown */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">安全状態の構成内訳</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {Object.entries(data.metrics.states).map(([stateKey, value]) => (
            <div key={stateKey} className="rounded-lg bg-white p-3 border border-slate-100 shadow-sm flex flex-col items-center">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATE_COLORS[stateKey as keyof typeof STATE_COLORS]}`}>
                {stateKey}
              </span>
              <span className="mt-2 text-lg font-bold">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Left Side: Reviews and Transitions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex border-b border-slate-200 bg-white rounded-t-xl">
            <button
              onClick={() => setActiveTab("queue")}
              className={`px-4 py-3 text-xs font-medium border-b-2 transition ${
                activeTab === "queue"
                  ? "border-slate-800 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              審査キュー ({data.reviews.filter((r) => r.status === "pending" || r.status === "in_review").length})
            </button>
            <button
              onClick={() => setActiveTab("transitions")}
              className={`px-4 py-3 text-xs font-medium border-b-2 transition ${
                activeTab === "transitions"
                  ? "border-slate-800 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              安全状態の遷移履歴
            </button>
          </div>

          {activeTab === "queue" ? (
            <div className="rounded-b-xl border border-t-0 border-slate-100 bg-white p-4 shadow-sm space-y-3">
              {data.reviews.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  審査待ちのリスク検出はありません。すべてのユーザーが正常です。
                </div>
              ) : (
                data.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex flex-col gap-3 rounded-lg border border-slate-100 p-4 shadow-sm hover:border-slate-200 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600">
                          {review.user?.name ? review.user.name[0] : "U"}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{review.user?.name || "匿名メンバー"}</p>
                          <p className="text-[10px] text-muted-foreground">{review.user?.email}</p>
                        </div>
                      </div>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase border ${RISK_LEVEL_COLORS[review.riskLevel]}`}>
                        {review.riskLevel} ({(review.riskScore * 100).toFixed(0)}%)
                      </span>
                    </div>

                    {/* Reasons */}
                    <div className="text-[11px] text-slate-600">
                      <p className="font-semibold mb-1 text-slate-700">検出された異常兆候:</p>
                      {review.signals.length === 0 ? (
                        <p className="text-muted-foreground">シグナル情報なし</p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {review.signals.map((sig: any, index: number) => (
                            <span key={index} className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                              {SIGNAL_LABELS[sig.type] || sig.type}: {typeof sig.value === "number" ? sig.value.toFixed(2) : String(sig.value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
                      <span className="text-[10px] text-muted-foreground">
                        検出日時: {new Date(review.createdAt).toLocaleString("ja-JP")}
                      </span>
                      {review.status !== "resolved" ? (
                        <button
                          onClick={() => {
                            setSelectedReview(review);
                            setDecision(review.riskLevel === "critical" ? "rejected" : "approved");
                          }}
                          className="rounded bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow hover:bg-slate-800 transition"
                        >
                          審査する
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                          <Check className="h-3 w-3 text-emerald-500" />
                          対処済 ({review.resolution})
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="rounded-b-xl border border-t-0 border-slate-100 bg-white p-4 shadow-sm">
              <div className="relative border-l border-slate-100 pl-4 space-y-6">
                {data.transitions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    状態遷移履歴はありません。
                  </div>
                ) : (
                  data.transitions.map((trans) => (
                    <div key={trans.id} className="relative">
                      {/* Circle Dot */}
                      <span className="absolute -left-[21px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-400 shadow-sm" />
                      
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(trans.createdAt).toLocaleString("ja-JP")}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${STATE_COLORS[trans.fromState as keyof typeof STATE_COLORS]}`}>
                            {trans.fromState}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${STATE_COLORS[trans.toState as keyof typeof STATE_COLORS]}`}>
                            {trans.toState}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-foreground">
                        {trans.user?.name || "匿名メンバー"} ({trans.user?.email})
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{trans.reason}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Operations Panel */}
        <div className="space-y-6">
          
          {/* Signal Injection Simulator */}
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-1.5 mb-3">
              <Sliders className="h-4 w-4 text-slate-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">シグナルシミュレータ</h3>
            </div>
            <p className="text-[11px] text-muted-foreground mb-4">
              ユーザーへのリスクシグナルの擬似注入を行い、バックグラウンドの安全評価パイプラインを実行します。
            </p>

            <form onSubmit={handleTriggerSignal} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">対象ユーザー</label>
                <select
                  value={simulatedUser}
                  onChange={(e) => setSimulatedUser(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-800"
                >
                  <option value="">選択してください...</option>
                  {data.users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || "不明なユーザー"} ({u.email.slice(0, 15)}...)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">シグナルタイプ</label>
                <select
                  value={simulatedSignalType}
                  onChange={(e) => setSimulatedSignalType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-800"
                >
                  {Object.entries(SIGNAL_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label} ({key})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase">シグナル強度値</label>
                  <span className="text-[11px] font-bold text-slate-700">{simulatedValue.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={simulatedValue}
                  onChange={(e) => setSimulatedValue(parseFloat(e.target.value))}
                  className="w-full accent-slate-800"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>0.00 (安全)</span>
                  <span>1.00 (極大リスク)</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">詳細説明</label>
                <textarea
                  value={simulatedNotes}
                  onChange={(e) => setSimulatedNotes(e.target.value)}
                  placeholder="シミュレーションのメモや追加の文脈テキスト"
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-foreground shadow hover:bg-slate-800 disabled:opacity-50 transition"
              >
                <Send className="h-3 w-3" />
                シグナル注入 & 解析ジョブ起動
              </button>
            </form>
          </div>

          {/* Manual Safety State Overrides */}
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-1.5 mb-3">
              <Shield className="h-4 w-4 text-slate-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">手動セーフティ状態変更</h3>
            </div>
            <p className="text-[11px] text-muted-foreground mb-4">
              AI自動判定をオーバーライドし、ユーザーの安全状態を直接指定して変更を強制します。
            </p>

            <form onSubmit={handleManualTransition} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">対象ユーザー</label>
                <select
                  value={selectedUserForTransition}
                  onChange={(e) => setSelectedUserForTransition(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-800"
                >
                  <option value="">選択してください...</option>
                  {data.users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || "不明なユーザー"} ({u.email.slice(0, 15)}...)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">変更後の状態</label>
                <select
                  value={manualTargetState}
                  onChange={(e) => setManualTargetState(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-800"
                >
                  <option value="safe">safe (安全/通常)</option>
                  <option value="monitoring">monitoring (モニタリング)</option>
                  <option value="review_required">review_required (要審査)</option>
                  <option value="restricted">restricted (制限措置)</option>
                  <option value="escalated">escalated (最高度エスカレーション)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">変更の理由</label>
                <input
                  type="text"
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="監査ログに記録される変更理由"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition"
              >
                手動で状態を強制更新する
              </button>
            </form>
          </div>

          {/* Safety Policies Help Card */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
            <div className="flex items-center gap-1.5 mb-2">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">定義されている安全ポリシー</h3>
            </div>
            <div className="space-y-3 mt-3 text-[11px] text-slate-600">
              <div className="border-l-2 border-slate-300 pl-2">
                <p className="font-semibold text-slate-700">依存防止ポリシー (policy-1001)</p>
                <p className="text-muted-foreground">AIがユーザーの精神的依存を促す返答傾向を検知。中リスク以上で審査キュー追加。</p>
              </div>
              <div className="border-l-2 border-slate-300 pl-2">
                <p className="font-semibold text-slate-700">不適切AI生成ポリシー (policy-1002)</p>
                <p className="text-muted-foreground">AIによる危険または不適切な返答パターンの兆候。高リスクで制限措置の提案。</p>
              </div>
              <div className="border-l-2 border-slate-300 pl-2">
                <p className="font-semibold text-slate-700">ハラスメント対応ポリシー (policy-1003)</p>
                <p className="text-muted-foreground">他ユーザーやDMでの嫌がらせ・攻撃シグナル。モデレーターへのエスカレーション。</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Review Modal Dialog */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">モデレーター審査裁定</h3>
                <p className="text-[10px] text-muted-foreground">Review ID: {selectedReview.id.slice(0, 12)}...</p>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-slate-50 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-slate-50 p-3 text-xs">
                <p className="font-semibold text-foreground">
                  対象ユーザー: {selectedReview.user?.name || "匿名メンバー"}
                </p>
                <p className="text-muted-foreground text-[10px]">Email: {selectedReview.user?.email}</p>
                <p className="mt-1.5 text-muted-foreground">
                  AI評価リスクスコア: <span className="font-bold text-foreground">{(selectedReview.riskScore * 100).toFixed(0)}%</span>
                </p>
                <p className="text-muted-foreground">
                  推奨される安全状態: <span className="font-bold text-foreground">{selectedReview.riskLevel}</span>
                </p>
              </div>

              <form onSubmit={handleResolveReview} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">裁定決定</label>
                  <select
                    value={decision}
                    onChange={(e) => setDecision(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-800"
                  >
                    <option value="approved">安全として承認 (解除/通常復帰)</option>
                    <option value="rejected">制限を適用 (restricted)</option>
                    <option value="escalated">エスカレーション (escalated)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">裁定理由・対応メモ</label>
                  <textarea
                    required
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="裁定を行った理由、ユーザー対応の方針などを入力"
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedReview(null)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-foreground shadow hover:bg-slate-800 disabled:opacity-50"
                  >
                    決定を保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
