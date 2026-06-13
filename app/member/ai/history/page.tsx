import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { userRepository } from "@/lib/repositories/user.repository";
import { subscriptionService } from "@/lib/services/subscription.service";
import { dailyLogRepository, PAGE_SIZE } from "@/lib/repositories/daily-log.repository";
import { generateInsight } from "@/lib/services/insight.service";
import { HistoryLogCard } from "@/components/member/history-log-card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "記録 - YOHAKU",
  description: "これまでの整理の記録",
};

// ランダム導入メッセージ（サーバーサイドで選択）
const INTRO_MESSAGES = [
  "少しずつ積み上がっています。",
  "書けない日があっても大丈夫です。",
  "戻ってこれただけでも十分です。",
  "ここに来た、それだけで十分です。",
  "焦らずに、少しずつ。",
];

const MOOD_TAGS = [
  { value: "疲れた",       color: "border-blue-200 text-blue-600 bg-blue-50",        activeColor: "bg-blue-100 border-blue-400 text-blue-700" },
  { value: "焦る",         color: "border-amber-200 text-amber-600 bg-amber-50",      activeColor: "bg-amber-100 border-amber-400 text-amber-700" },
  { value: "不安",         color: "border-violet-200 text-violet-600 bg-violet-50",   activeColor: "bg-violet-100 border-violet-400 text-violet-700" },
  { value: "整えたい",     color: "border-teal-200 text-teal-600 bg-teal-50",         activeColor: "bg-teal-100 border-teal-400 text-teal-700" },
  { value: "少し前進したい", color: "border-emerald-200 text-emerald-600 bg-emerald-50", activeColor: "bg-emerald-100 border-emerald-400 text-emerald-700" },
];

// 月単位でログをグループ化
function groupByMonth(logs: Array<{ id: string; inputText: string; aiResponse: string | null; smallAction: string | null; moodTag: string | null; createdAt: Date }>) {
  const groups: Array<{ label: string; logs: typeof logs }> = [];
  const seen = new Set<string>();

  for (const log of logs) {
    const key = `${log.createdAt.getFullYear()}-${log.createdAt.getMonth()}`;
    const label = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long" }).format(log.createdAt);
    if (!seen.has(key)) {
      seen.add(key);
      groups.push({ label, logs: [] });
    }
    groups[groups.length - 1].logs.push(log);
  }
  return groups;
}

interface Props {
  searchParams: { page?: string; mood?: string };
}

export default async function MemberAiHistoryPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await userRepository.findById(session.user.id);
  if (!user) redirect("/login");

  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const hasActiveSub = isAdmin || await subscriptionService.hasActiveSubscription(user.id);
  if (!hasActiveSub) redirect("/inbox");

  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const activeMood = searchParams.mood || "";
  const offset = (page - 1) * PAGE_SIZE;

  // サーバーサイドでランダムメッセージを選択（毎リクエストでランダム）
  const introMessage = INTRO_MESSAGES[Math.floor(Math.random() * INTRO_MESSAGES.length)];

  const [logs, total, insightLogs] = await Promise.all([
    dailyLogRepository.findRecentByUserId(user.id, PAGE_SIZE, offset, activeMood || undefined),
    dailyLogRepository.countByUserId(user.id, activeMood || undefined),
    // インサイト用は直近20件、フィルターなし
    dailyLogRepository.findForInsight(user.id, 20),
  ]);

  const insight = generateInsight(insightLogs);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const monthGroups = groupByMonth(logs);

  return (
    <div className="max-w-xl mx-auto pb-24 pt-4 space-y-10">

      {/* セクション1｜やさしい導入 */}
      <div className="px-1 space-y-1">
        <h1 className="text-xl font-medium text-foreground">記録</h1>
        <p className="text-sm text-muted-foreground">{introMessage}</p>
      </div>

      {/* セクション3｜小さな変化（インサイト）- ログが十分あるときのみ */}
      {insight && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-5 py-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1.5">最近のようす</p>
          <p className="text-sm text-slate-600 leading-relaxed">{insight.message}</p>
        </div>
      )}

      {/* moodTagフィルター */}
      {total > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground px-1">絞り込み</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/member/ai/history"
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                !activeMood
                  ? "bg-slate-900 border-slate-900 text-foreground"
                  : "bg-white border-slate-200 text-muted-foreground hover:border-slate-300"
              }`}
            >
              すべて
            </Link>
            {MOOD_TAGS.map(tag => (
              <Link
                key={tag.value}
                href={`/member/ai/history?mood=${encodeURIComponent(tag.value)}`}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeMood === tag.value ? tag.activeColor : tag.color
                }`}
              >
                {tag.value}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* セクション2｜ログ一覧 */}
      {logs.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white/60 p-12 text-center space-y-4 shadow-sm">
          {activeMood ? (
            <>
              <p className="text-base font-medium text-slate-600 leading-relaxed">
                「{activeMood}」の記録はまだありません。
              </p>
              <Link
                href="/member/ai/history"
                className="inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-slate-600 transition-colors"
              >
                すべての記録を見る
              </Link>
            </>
          ) : (
            <>
              <p className="text-base font-medium text-slate-600 leading-relaxed">
                少し疲れた日も、<br/>
                ここへ戻ってこれます。
              </p>
              <p className="text-sm text-muted-foreground">最初の整理を書いてみましょう。</p>
              <Link
                href="/inbox"
                className="inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-slate-700 transition-colors"
              >
                思考を整理しにいく
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {monthGroups.map(group => (
            <section key={group.label} aria-label={group.label}>
              {/* 月ラベル */}
              <div className="flex items-center gap-3 mb-4 px-1">
                <span className="text-xs font-medium text-muted-foreground">{group.label}</span>
                <div className="flex-1 h-px bg-slate-100" aria-hidden="true" />
              </div>
              {/* その月のカード群 */}
              <div className="space-y-3">
                {group.logs.map(log => (
                  <HistoryLogCard key={log.id} log={log} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <nav aria-label="ページ移動" className="flex items-center justify-between px-1 pt-4">
          {hasPrev ? (
            <Link
              href={`/member/ai/history?page=${page - 1}${activeMood ? `&mood=${encodeURIComponent(activeMood)}` : ""}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              ← 前のページ
            </Link>
          ) : <span />}

          <span className="text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>

          {hasNext ? (
            <Link
              href={`/member/ai/history?page=${page + 1}${activeMood ? `&mood=${encodeURIComponent(activeMood)}` : ""}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              次のページ →
            </Link>
          ) : <span />}
        </nav>
      )}

      {/* 下部導線 */}
      <div className="text-center pt-4">
        <Link
          href="/inbox"
          className="inline-block text-sm text-muted-foreground hover:text-slate-600 transition-colors py-3"
        >
          今日の整理へ
        </Link>
      </div>

    </div>
  );
}
