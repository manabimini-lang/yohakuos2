import Link from "next/link";

export function HeroSection({ primaryColor }: { primaryColor?: string }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 md:p-12">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        YOHAKU Learning Platform
      </p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
        学びを、余白のある習慣に。
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
        読んで終わりではなく、実践して定着させる。YOHAKUは、毎月のテーマと実践タスクで
        継続できる学びの流れをつくります。
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/member"
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: primaryColor ?? "#0f172a" }}
        >
          無料ではじめる
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
        >
          ログイン
        </Link>
      </div>
    </section>
  );
}
