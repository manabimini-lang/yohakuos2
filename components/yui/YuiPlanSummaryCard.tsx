import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AI_MONTHLY_REQUEST_LIMIT } from "@/lib/constants/plan";

type YuiPlanSummaryCardProps = {
  isPremium: boolean;
};

export function YuiPlanSummaryCard({ isPremium }: YuiPlanSummaryCardProps) {
  const rows = [
    { label: "月間AI利用", value: `${isPremium ? AI_MONTHLY_REQUEST_LIMIT.PREMIUM : AI_MONTHLY_REQUEST_LIMIT.FREE}回` },
    { label: "朝晩の秘書レポート", value: isPremium ? "予定時刻に自動作成" : "画面上で手動確認" },
    { label: "外部接続の更新", value: isPremium ? "レポート作成前に自動更新" : "設定画面から手動同期" },
  ];

  return (
    <Card className="space-y-4 border-border/80 bg-background/90 p-6 shadow-sm md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Plan</p>
        <h2 className="mt-2 text-lg font-semibold">{isPremium ? "Premiumプラン" : "無料プラン"}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {isPremium
            ? "最新情報を読み直し、朝晩にベテラン秘書の視点で次の一手を整えます。"
            : "日々の記録と会話を残し、必要なときにYUIの整理を確認できます。"}
        </p>
      </div>

      <dl className="divide-y divide-border/70 rounded-xl border border-border/70 bg-muted/20">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-right font-medium text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs leading-6 text-muted-foreground">{isPremium ? "PremiumはAPIキー不要で、AI利用料も含まれます。" : "無料プランでAI相談を使う場合は、GeminiまたはGroqのAPIキーが必要です。"} 朝晩のレポートはアプリ内に表示します。</p>
      <Link href="/pricing" className="inline-block text-xs underline underline-offset-4">無料版とPremiumを比較する</Link>

      {!isPremium ? (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-xs leading-5 text-muted-foreground">Premiumは月¥980で利用できます。</p>
          <Link href="/pricing" className="text-xs font-semibold text-foreground underline underline-offset-4 hover:text-muted-foreground">
            Premiumの詳細
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
