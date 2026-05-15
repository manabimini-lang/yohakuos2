type DashboardHeroProps = {
  name: string;
  role: string;
};

export function DashboardHero({ name, role }: DashboardHeroProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-sm font-medium text-slate-500">Welcome back</p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">{name}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {role}
        </span>
        <span className="text-sm text-slate-600">
          今日の一言: 小さく継続するほど、学びは積み上がります。
        </span>
      </div>
    </section>
  );
}
