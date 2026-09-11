import { AI_MONTHLY_REQUEST_LIMIT } from "@/lib/constants/plan";

const rows = [
  { label: "料金", free: "¥0", paid: "月額¥980（税込）" },
  { label: "メモ・目標・タスク・振り返り", free: "利用可能", paid: "利用可能" },
  { label: "月間AI利用", free: `${AI_MONTHLY_REQUEST_LIMIT.FREE}回`, paid: `${AI_MONTHLY_REQUEST_LIMIT.PREMIUM}回（自動レポート等を含む）` },
  { label: "朝晩の秘書レポート", free: "画面で手動確認（AI消費なし）", paid: "有効にすると朝7時台・夜20時台に自動作成（日本時間）" },
  { label: "Google Calendar・Gmail", free: "接続可能・手動同期", paid: "接続可能・レポート作成前にも自動同期" },
  { label: "AI相談の設定", free: "GeminiまたはGroqのAPIキーが必要", paid: "APIキー不要・AI利用料込み" },
  { label: "新しく保存するURL・PDF・写真", free: "保存から7日間", paid: "保存時に期限を設定しない" },
];

export function PricingComparison() {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-foreground">無料版とPremiumの違い</h2>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs font-medium tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-2 py-3">内容</th>
              <th scope="col" className="px-2 py-3">無料プラン</th>
              <th scope="col" className="px-2 py-3 text-slate-700">Premium</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-slate-50 text-slate-600">
                <th scope="row" className="px-2 py-4 align-top font-normal">{row.label}</th>
                <td className="px-2 py-4 align-top text-muted-foreground">{row.free}</td>
                <td className="px-2 py-4 align-top font-medium">{row.paid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 space-y-3 text-xs leading-6 text-muted-foreground">
        <p>AIの回数は、会話・提案・要約・写真解析などの外部AIへのリクエスト単位です。1回の操作で複数回使う場合があり、自動レポートのAI処理も含まれます。毎月1日午前9時（日本時間）にリセットされます。</p>
        <p>朝晩のレポートはアプリ内に表示します。端末へのプッシュ通知ではありません。外部情報の自動同期にはGoogleの接続が必要です。</p>
        <p>7日間の保存期限は、YUIのメモ・目標・タスク・振り返りすべてに適用されるものではありません。加入前の保存データに設定された期限は自動延長されません。削除済みデータの復元はできません。</p>
      </div>
    </section>
  );
}
