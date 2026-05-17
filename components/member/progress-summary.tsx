type ProgressSummaryProps = {
  completedCount: number;
  totalProgressCount: number;
  completionRate: number;
};

function StatCard({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <article className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-400 tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-medium text-slate-700">
        {value}
        {unit && <span className="text-sm text-slate-400 ml-1">{unit}</span>}
      </p>
    </article>
  );
}

export function ProgressSummary({
  completedCount,
  totalProgressCount,
  completionRate,
}: ProgressSummaryProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-slate-500 tracking-wide pl-1">これまでの歩み</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="完了したタスク" value={completedCount} unit="件" />
        <StatCard label="記録したタスク" value={totalProgressCount} unit="件" />
        <StatCard label="進捗" value={completionRate} unit="%" />
      </div>
    </section>
  );
}
