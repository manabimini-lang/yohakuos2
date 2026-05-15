import Link from "next/link";

export function CtaSection({ primaryColor }: { primaryColor?: string }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white md:p-10">
      <h2 className="text-2xl font-semibold">今日から、学びを積み上げる。</h2>
      <p className="mt-2 text-sm text-slate-200">
        無料ではじめて、必要に応じて学習を拡張できます。まずは1つのコンテンツから始めましょう。
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
          className="rounded-lg border border-slate-400 px-4 py-2 text-sm font-medium text-white"
        >
          ログイン
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-slate-400 px-4 py-2 text-sm font-medium text-white"
        >
          会員登録
        </Link>
      </div>
    </section>
  );
}
