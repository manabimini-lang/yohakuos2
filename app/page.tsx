import Link from "next/link";
import { ArrowRight, Sparkles, Brain, Feather, ShieldCheck } from "lucide-react";

const highlights = [
  {
    icon: Sparkles,
    title: "静かな整理",
    description: "散らかった思考を、無理なく整えるための余白をつくります。",
  },
  {
    icon: Brain,
    title: "AIと伴走",
    description: "記録や気づきを、AIがやさしくつないで次の一歩に変えます。",
  },
  {
    icon: ShieldCheck,
    title: "安心の設計",
    description: "ログイン後の体験を、落ち着いた導線で安全に進められます。",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f7] text-slate-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),rgba(245,245,247,0.92)_40%,rgba(245,245,247,0.72)_70%,rgba(245,245,247,0.55))]" />
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-white/90 to-transparent" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-16 sm:px-10 lg:px-16">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-4 py-2 text-xs font-medium tracking-[0.22em] text-slate-500 backdrop-blur">
              <Feather className="h-3.5 w-3.5" />
              YOHAKU
            </p>

            <h1 className="mt-8 max-w-3xl text-5xl font-light tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
              深呼吸して、
              <span className="block text-slate-500">少しだけ整えましょう。</span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              YOHAKUは、毎日の記録・AI整理・小さな実践をひとつにまとめ、
              静かに戻ってこられる場所をつくります。
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-medium text-white shadow-[0_12px_40px_rgba(15,23,42,0.15)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-slate-900"
              >
                ログインして始める
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full border border-slate-300/80 bg-white/70 px-6 py-3.5 text-sm font-medium text-slate-700 backdrop-blur transition-colors duration-200 hover:bg-white hover:text-slate-900"
              >
                アカウントを作成
              </Link>
            </div>
          </div>

          <div className="mt-20 grid gap-4 lg:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[1.75rem] border border-slate-200/80 bg-white/70 p-6 backdrop-blur-sm shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-5 text-lg font-medium tracking-[-0.02em] text-slate-950">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
