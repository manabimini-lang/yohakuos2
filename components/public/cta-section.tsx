import Link from "next/link";

export function CtaSection({ primaryColor }: { primaryColor?: string }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-8 md:p-10 shadow-sm text-center">
      <h2 className="text-xl font-medium text-foreground tracking-wide">ここは、いつでも戻れる場所です。</h2>
      <p className="mt-3 text-sm text-slate-600 leading-relaxed">
        必要なときにだけ、少しページを開いてみる。<br className="hidden md:block" />
        まずは1つの記事から、静かに始めてみませんか。
      </p>
      <div className="mt-8 flex justify-center">
        <Link
          href="/login"
          className="inline-flex rounded-xl px-6 py-3 text-sm font-medium text-foreground transition-opacity hover:opacity-90 shadow-sm"
          style={{ backgroundColor: primaryColor ?? "#0f172a" }}
        >
          ゆっくり、はじめる
        </Link>
      </div>
    </section>
  );
}
