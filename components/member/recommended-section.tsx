const recommended = [
  { title: "今月おすすめ", description: "基礎理解を深めるショートレッスンを3本。" },
  { title: "実践タスク", description: "今週はアウトプット中心で手を動かす。" },
  { title: "初心者向け", description: "難所の前に復習しておきたい導入セット。" },
];

export function RecommendedSection() {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">Recommended</h2>
      <div className="grid gap-3 md:grid-cols-3">
        {recommended.map((item) => (
          <article key={item.title} className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
