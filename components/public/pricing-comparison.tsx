const rows = [
  { label: "記事の閲覧", free: "一部", paid: "すべて" },
  { label: "タスクの実践", free: "一部", paid: "すべて" },
  { label: "限定動画", free: "-", paid: "視聴可能" },
  { label: "AI思考整理", free: "-", paid: "利用可能" },
];

export function PricingComparison() {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-foreground">ご利用プランについて</h2>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs font-medium tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-3">内容</th>
              <th className="px-3 py-3">無料プラン</th>
              <th className="px-3 py-3 text-slate-700">会員プラン</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-slate-50 text-slate-600">
                <td className="px-3 py-4">{row.label}</td>
                <td className="px-3 py-4 text-muted-foreground">{row.free}</td>
                <td className="px-3 py-4 font-medium">{row.paid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
