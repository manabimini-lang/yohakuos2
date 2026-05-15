const rows = [
  { label: "一部記事", free: "○", paid: "○" },
  { label: "実践タスク", free: "△", paid: "○" },
  { label: "限定動画", free: "×", paid: "○" },
  { label: "コミュニティ", free: "×", paid: "○" },
];

export function PricingComparison() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-xl font-semibold text-slate-900">Free vs Paid</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">項目</th>
              <th className="px-3 py-2">Free</th>
              <th className="px-3 py-2">Paid</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-slate-100 text-slate-700">
                <td className="px-3 py-2">{row.label}</td>
                <td className="px-3 py-2">{row.free}</td>
                <td className="px-3 py-2">{row.paid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
