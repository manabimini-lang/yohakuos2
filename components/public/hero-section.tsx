import Link from "next/link";

export function HeroSection({ primaryColor }: { primaryColor?: string }) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-8 md:p-12 shadow-sm">
      <h1 className="text-3xl font-medium leading-tight text-slate-800 md:text-4xl tracking-wide">
        学びを、余白のある習慣に。
      </h1>
      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
        読んで終わりではなく、少しだけ手も動かしてみる。<br className="hidden md:block" />
        YOHAKUは、毎月の小さなテーマを通して無理なく続く学びのリズムを作ります。
      </p>
      <div className="mt-8">
        <Link
          href="/member"
          className="inline-flex rounded-xl px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: primaryColor ?? "#0f172a" }}
        >
          ゆっくり、はじめる
        </Link>
      </div>
    </section>
  );
}
