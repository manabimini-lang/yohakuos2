import { Metadata } from "next";
import { getDashboardMetrics } from "./actions";
import {
  Users,
  Crown,
  UserPlus,
  TrendingUp,
  FileText,
  Cpu,
  CreditCard,
  Activity,
  BookOpen,
  MessageSquare,
  Map,
  Database,
  Zap,
  Webhook,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MinusCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Founder Dashboard | YOHAKU Admin",
  description: "YOHAKUの全体状況を確認する運営者専用ダッシュボード",
};

export const dynamic = "force-dynamic";

// ─── Helper Components ───────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  unit,
  icon: Icon,
  color = "slate",
}: {
  label: string;
  value: number | string;
  unit?: string;
  icon: React.ElementType;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    slate: "text-slate-500",
    amber: "text-amber-500",
    emerald: "text-emerald-500",
    indigo: "text-indigo-500",
    violet: "text-violet-500",
    rose: "text-rose-500",
    sky: "text-sky-500",
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <Icon className={`w-4 h-4 stroke-[1.5] ${colorMap[color] ?? "text-slate-400"}`} />
      </div>
      <div className="flex items-baseline space-x-1.5">
        <span className="text-2xl font-semibold tracking-tight text-slate-800">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-xs text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}

function SubsBar({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  const dotColors: Record<string, string> = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-400",
    rose: "bg-rose-500",
    slate: "bg-slate-400",
  };
  return (
    <div className="flex items-center justify-between text-xs py-2">
      <div className="flex items-center space-x-2">
        <span className={`w-2 h-2 rounded-full ${dotColors[color]}`} />
        <span className="text-slate-600">{label}</span>
      </div>
      <span className="font-semibold text-slate-800">{count.toLocaleString()}</span>
    </div>
  );
}

function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-600">{label}</span>
      <span
        className={`inline-flex items-center space-x-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
          ok
            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
            : "bg-rose-50 text-rose-700 border-rose-100"
        }`}
      >
        {ok ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <XCircle className="w-3 h-3" />
        )}
        <span>{ok ? "正常" : "異常"}</span>
      </span>
    </div>
  );
}

function AiStatusRow({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  const textColors: Record<string, string> = {
    slate: "text-slate-500 bg-slate-50 border-slate-200",
    sky: "text-sky-600 bg-sky-50 border-sky-100",
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-100",
    rose: "text-rose-700 bg-rose-50 border-rose-100",
    amber: "text-amber-700 bg-amber-50 border-amber-100",
  };
  return (
    <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50 last:border-0">
      <span className="text-slate-600">{label}</span>
      <span
        className={`font-semibold px-2 py-0.5 rounded-full border text-[11px] ${textColors[color]}`}
      >
        {count.toLocaleString()}
      </span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function FounderDashboardPage() {
  const metrics = await getDashboardMetrics();
  const { business, subscription, aiRuntime, content, system, recentErrors } = metrics;

  const errorTypeLabel = (type: string, data: any): string => {
    if (type === "AIJob") return `[AI] ${data.jobType} — ${data.lastError ?? "エラー詳細なし"}`;
    return `[${data.category}] ${data.action} — ${data.severity}`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
          Founder Dashboard
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          YOHAKUの全体状況をリアルタイムで確認します。
        </p>
      </div>

      {/* ── Section 1: Business KPI ─────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
          Business KPI
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard label="総ユーザー数" value={business.totalUsers} unit="名" icon={Users} color="slate" />
          <KpiCard label="有料会員数" value={business.totalPaidMembers} unit="名" icon={Crown} color="amber" />
          <KpiCard label="今月新規登録" value={business.newRegistrationsThisMonth} unit="名" icon={UserPlus} color="emerald" />
          <KpiCard label="今月有料転換" value={business.newPaidConversionsThisMonth} unit="件" icon={TrendingUp} color="indigo" />
          <KpiCard label="保存コンテンツ総数" value={business.totalSavedContents} unit="件" icon={FileText} color="violet" />
          <KpiCard label="AI処理総数" value={business.totalAiProcessings} unit="件" icon={Cpu} color="sky" />
        </div>
      </section>

      {/* ── Section 2 & 3: Subscription + AI Runtime ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Section 2: Subscription Health */}
        <section className="bg-white border border-slate-200/60 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Subscription Health
            </h2>
            <CreditCard className="w-4 h-4 text-slate-300 stroke-[1.5]" />
          </div>
          <div className="divide-y divide-slate-50">
            <SubsBar label="Active（有料）" count={subscription.active} color="emerald" />
            <SubsBar label="Trialing（試用中）" count={subscription.trialing} color="sky" />
            <SubsBar label="Past Due（支払い遅延）" count={subscription.past_due} color="amber" />
            <SubsBar label="Canceled（解約済み）" count={subscription.canceled} color="rose" />
          </div>
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-[10px] text-slate-400 mb-1">推定 MRR</p>
              <p className="text-xl font-bold text-slate-800">
                ¥{subscription.mrr.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-400 mb-1">直近30日 解約数</p>
              <p className={`text-xl font-bold ${subscription.recentChurn > 0 ? "text-rose-600" : "text-slate-800"}`}>
                {subscription.recentChurn}
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: AI Runtime Health */}
        <section className="bg-white border border-slate-200/60 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              AI Runtime Health
            </h2>
            <Activity className="w-4 h-4 text-slate-300 stroke-[1.5]" />
          </div>
          <div>
            <AiStatusRow label="Pending（待機中）" count={aiRuntime.pending} color="slate" />
            <AiStatusRow label="Processing（実行中）" count={aiRuntime.processing} color="sky" />
            <AiStatusRow label="Completed（完了）" count={aiRuntime.completed} color="emerald" />
            <AiStatusRow label="Failed（失敗）" count={aiRuntime.failed} color="rose" />
          </div>
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Gemini エラー（直近24h）</span>
              <span
                className={`text-sm font-bold ${aiRuntime.geminiErrors24h > 0 ? "text-rose-600" : "text-emerald-600"}`}
              >
                {aiRuntime.geminiErrors24h} 件
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* ── Section 4: Content Health ────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
          Content Health
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard label="総コンテンツ数" value={content.totalContentCount} unit="件" icon={FileText} color="slate" />
          <KpiCard label="今日の保存数" value={content.todaySavedCount} unit="件" icon={Clock} color="emerald" />
          <KpiCard label="今週の保存数" value={content.weekSavedCount} unit="件" icon={TrendingUp} color="indigo" />
          <KpiCard label="Reflection生成" value={content.totalReflections} unit="件" icon={BookOpen} color="violet" />
          <KpiCard label="Landscape生成" value={content.totalLandscapes} unit="件" icon={Map} color="sky" />
          <KpiCard label="Companion会話" value={content.totalConversations} unit="件" icon={MessageSquare} color="amber" />
        </div>
      </section>

      {/* ── Section 5 & 6: System Health + Recent Errors ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Section 5: System Health */}
        <section className="lg:col-span-2 bg-white border border-slate-200/60 rounded-xl shadow-sm p-6 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              System Health
            </h2>
            <Zap className="w-4 h-4 text-slate-300 stroke-[1.5]" />
          </div>
          <StatusDot ok={system.db} label="DB接続（Supabase）" />
          <StatusDot ok={system.stripe} label="Stripe接続（APIキー設定）" />
          <StatusDot ok={system.gemini} label="Gemini接続（APIキー設定）" />
          <StatusDot ok={system.webhook} label="Webhook稼働（直近24h受信）" />
          <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
            <span className="text-xs text-slate-600">Cron稼働</span>
            <span className="inline-flex items-center space-x-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-100">
              <MinusCircle className="w-3 h-3" />
              <span>モック表示</span>
            </span>
          </div>
        </section>

        {/* Section 6: Recent Errors */}
        <section className="lg:col-span-3 bg-white border border-slate-200/60 rounded-xl shadow-sm p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Recent Errors
            </h2>
            <AlertTriangle className="w-4 h-4 text-rose-300 stroke-[1.5]" />
          </div>
          {recentErrors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 space-y-1">
              <CheckCircle className="w-6 h-6 text-emerald-300 stroke-[1.5]" />
              <p className="text-xs font-medium text-slate-500">現在エラーはありません</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-72 space-y-1.5 pr-1">
              {recentErrors.map((err, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-2.5 p-2.5 rounded-lg bg-rose-50/40 border border-rose-100/60"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-rose-800 truncate leading-tight">
                      {errorTypeLabel(err.type, err.data)}
                    </p>
                    <p className="text-[10px] text-rose-400 mt-0.5">
                      {new Date(err.date).toLocaleString("ja-JP")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
