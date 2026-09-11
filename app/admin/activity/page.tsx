import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardCheck, Lightbulb, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { getActivityHubData } from "./actions";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  draft: "下書き",
  review_required: "レビュー待ち",
  backlog: "仮説バックログ",
  planned: "計画中",
  in_progress: "検証中",
  published: "公開済み",
};

function Status({ value }: { value: string }) {
  return <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">{statusLabel[value] ?? value}</span>;
}

export default async function ActivityHubPage() {
  const data = await getActivityHubData();
  const nextActions = [
    ...data.insights
      .filter((item) => item.status === "review_required")
      .map((item) => ({ type: "レビュー", title: item.title, href: "/admin/product-learning" })),
    ...data.campaigns
      .filter((item) => item.status === "draft")
      .map((item) => ({ type: "配信企画", title: item.title, href: "/admin/newsletter" })),
    ...data.hypotheses
      .filter((item) => item.status === "backlog")
      .map((item) => ({ type: "製品仮説", title: item.title, href: "/admin/product-learning" })),
    ...data.reports
      .filter((item) => item.status === "draft" || item.status === "review_required")
      .map((item) => ({ type: "活動レポート", title: item.title, href: "/admin/reports" })),
  ].slice(0, 6);
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Activity OS</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">知識循環ハブ</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">YOHAKUで生まれた問いや知識を、安全に編集し、届け、製品と活動へ還元するための運営ワークスペースです。</p>
      </header>

      {!data.storageReady && <section className="rounded-2xl border border-red-200 bg-red-50 p-5" role="alert"><h2 className="text-sm font-semibold text-red-900">活動OSのデータ接続を確認してください</h2><p className="mt-1 text-xs leading-5 text-red-800">管理画面の認証は通っていますが、活動OS用テーブルを本番DBから読み込めません。Supabaseで <code className="rounded bg-red-100 px-1">prisma/migrations/20260829_activity_os/migration.sql</code> を適用し、VercelのProduction環境変数が同じDBを指しているか確認してください。</p></section>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={BookOpen} label="知識コンテンツ" value={data.knowledgeCount} note="公開・下書きを含む" />
        <Metric icon={Sparkles} label="匿名インサイト" value={data.insights.length} note="直近8件を表示" />
        <Metric icon={Mail} label="メルマガ企画" value={data.campaigns.length} note="企画・配信の記録" />
        <Metric icon={Lightbulb} label="製品仮説" value={data.hypotheses.length} note="学習ループの入口" />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-slate-800">活動の温度</h2><p className="mt-1 text-xs text-slate-500">直近30日。人数はログまたは振り返りがあるユニークユーザーです。</p></div><Link href="/admin/analytics" className="text-xs text-slate-500 hover:text-slate-900">詳細分析 <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-6"><Mini label="アクティブ（30日）" value={data.metricsReady ? data.activity.activeUsers30d : null} /><Mini label="アクティブ（7日）" value={data.metricsReady ? data.activity.activeUsers7d : null} /><Mini label="YUI会話（30日）" value={data.metricsReady ? data.activity.yuiConversations30d : null} /><Mini label="ログ（30日）" value={data.metricsReady ? data.activity.logs30d : null} /><Mini label="振り返り（30日）" value={data.metricsReady ? data.activity.reflections30d : null} /><Mini label="完了コンテンツ" value={data.metricsReady ? data.activity.completedContents30d : null} /></div>
        {!data.metricsReady && <p className="mt-3 text-[11px] text-amber-700">利用状況の集計は未取得です。0件ではなく、既存データとの接続を確認してください。</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="text-sm font-semibold text-slate-800">今週の運営アクション</h2><p className="mt-1 text-xs text-slate-500">ここに表示されたものから、今週扱うテーマを1〜2件選びます。</p></div>
          <ClipboardCheck className="h-5 w-5 text-slate-400" />
        </div>
        {nextActions.length === 0 ? (
          <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-3 text-xs text-emerald-800">未処理の項目はありません。利用データを見ながら、次の問いを一つ記録しましょう。</p>
        ) : (
          <div className="mt-4 grid gap-2 md:grid-cols-2">{nextActions.map((item) => <Link key={`${item.type}-${item.title}`} href={item.href} className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3 transition hover:border-slate-300 hover:bg-white"><span className="min-w-0"><span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{item.type}</span><span className="mt-1 block truncate text-sm font-medium text-slate-800">{item.title}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-800" /></Link>)}</div>
        )}
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <h2 className="text-sm font-semibold text-amber-900">二次利用の安全ゲート</h2>
            <p className="mt-1 text-xs leading-5 text-amber-800">インサイトは初期状態ではレビュー待ちです。個人を特定できる内容を公開せず、利用目的・匿名化状態・最低集計人数を確認してから配信やレポートに利用してください。</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <ListCard title="最近のインサイト" href="/admin/product-learning" action="製品学習を開く">
          {data.insights.length === 0 ? <Empty text="まだインサイトはありません" /> : data.insights.map((item) => <div key={item.id} className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-0"><div><p className="text-sm font-medium text-slate-800">{item.title}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.summary}</p></div><Status value={item.anonymizationStatus} /></div>)}
        </ListCard>
        <ListCard title="メルマガ企画" href="/admin/newsletter" action="企画を開く">
          {data.campaigns.length === 0 ? <Empty text="企画を作成するとここに表示されます" /> : data.campaigns.map((item) => <div key={item.id} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0"><div><p className="text-sm font-medium text-slate-800">{item.title}</p><p className="mt-1 text-xs text-slate-500">対象：{item.segment}</p></div><Status value={item.status} /></div>)}
        </ListCard>
        <ListCard title="製品仮説" href="/admin/product-learning" action="仮説を開く">
          {data.hypotheses.length === 0 ? <Empty text="仮説を作成するとここに表示されます" /> : data.hypotheses.map((item) => <div key={item.id} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0"><p className="text-sm font-medium text-slate-800">{item.title}</p><Status value={item.status} /></div>)}
        </ListCard>
        <ListCard title="活動レポート" href="/admin/reports" action="レポートを開く">
          {data.reports.length === 0 ? <Empty text="活動レポートを作成するとここに表示されます" /> : data.reports.map((item) => <div key={item.id} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0"><p className="text-sm font-medium text-slate-800">{item.title}</p><Status value={item.status} /></div>)}
        </ListCard>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, note }: { icon: React.ElementType; label: string; value: number; note: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-4 w-4 text-slate-500" /><p className="mt-3 text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold text-slate-900">{value.toLocaleString()}</p><p className="mt-1 text-[11px] text-slate-400">{note}</p></div>;
}

function ListCard({ title, href, action, children }: { title: string; href: string; action: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-slate-800">{title}</h2><Link href={href} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900">{action}<ArrowRight className="h-3.5 w-3.5" /></Link></div><div className="mt-3">{children}</div></section>;
}

function Empty({ text }: { text: string }) { return <p className="py-5 text-center text-xs text-slate-400">{text}</p>; }
function Mini({ label, value }: { label: string; value: number | null }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold text-slate-900">{value === null ? "未取得" : value.toLocaleString()}</p></div>; }
