type DashboardHeroProps = {
  name: string;
  role: string;
};

export function DashboardHero({ name, role }: DashboardHeroProps) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500 tracking-wide">おかえりなさい。</p>
      <h1 className="mt-1 text-2xl font-medium text-slate-800">{name}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-md bg-slate-50 border border-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
          {role}
        </span>
        <span className="text-sm text-slate-500">
          今日できることを、少しずつ。
        </span>
      </div>
    </section>
  );
}
