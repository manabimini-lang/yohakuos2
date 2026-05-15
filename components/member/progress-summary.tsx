type ProgressSummaryProps = {
  completedCount: number;
  totalProgressCount: number;
  completionRate: number;
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
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
      <h2 className="text-base font-semibold text-slate-900">Progress Summary</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Completed" value={completedCount} />
        <StatCard label="Tracked" value={totalProgressCount} />
        <StatCard label="Completion Rate" value={`${completionRate}%`} />
      </div>
    </section>
  );
}
