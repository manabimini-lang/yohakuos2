import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Brain,
  Feather,
  ShieldCheck,
  PenLine,
  BookMarked,
  Compass,
  MessageCircle,
  Layers,
  Cloud,
  History
} from "lucide-react";

const journeySteps = [
  {
    step: "01",
    icon: Feather,
    title: "今日：断片を置く",
    description: "整理できなくても大丈夫。今の気持ち、拾った言葉を、そのままそっと置いておきます。",
    accent: "bg-slate-50 text-slate-400"
  },
  {
    step: "02",
    icon: Layers,
    title: "数週間後：層が生まれる",
    description: "積もった断片が重なり、あなたの「人生の層」として静かに形を成していきます。",
    accent: "bg-stone-50 text-stone-400"
  },
  {
    step: "03",
    icon: History,
    title: "振り返り：意味に出会う",
    description: "AIがあなたの軌跡を繋ぎます。それは保存ではなく、未来の自分との再会です。",
    accent: "bg-zinc-900 text-white"
  },
];

const principles = [
  {
    title: "保存より再会",
    description: "溜めるための場所ではなく、出会い直すための場所。蓄積が重荷にならない UI を。"
  },
  {
    title: "整理しない自由",
    description: "完璧に整える必要はありません。散らかったままでも、AIがそっと文脈を紡ぎます。"
  },
  {
    title: "静かな伴走",
    description: "AIは主役ではありません。あなたの記憶の地層を、影のように支え、整える存在です。"
  }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f7] text-slate-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),rgba(245,245,247,0.92)_40%,rgba(245,245,247,0.72)_70%,rgba(245,245,247,0.55))]" />
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-white/90 to-transparent" />

        <div className="relative mx-auto flex min-h-[84vh] max-w-7xl flex-col justify-center px-6 py-16 sm:px-10 lg:px-16">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-4 py-2 text-[11px] font-medium tracking-[0.22em] text-slate-500 backdrop-blur">
              <Feather className="h-3.5 w-3.5" />
              YOHAKU OS
            </p>

            <h1 className="mt-8 max-w-3xl text-5xl font-light tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
              深呼吸して、
              <span className="block text-slate-500">今日は静かに始めましょう。</span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              YOHAKUは、記録と整理を自然につなぎ、
              「今の自分に必要な一歩」を静かに見つける場所です。
            </p>
          </div>
        </div>
      </section>

      {/* Story Section: 残したものが、意味になるまで */}
      <section className="py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-16 text-center">
          <h2 className="text-3xl font-light tracking-tight text-slate-950 sm:text-4xl">
            残したものが、意味になるまで
          </h2>
          <p className="mt-4 text-slate-500 font-light">
            整理できなくても大丈夫。断片が重なり、人生の層に変わる旅。
          </p>

          <div className="mt-20 grid gap-8 lg:grid-cols-3">
            {journeySteps.map((step) => (
              <div
                key={step.step}
                className="relative rounded-[2rem] border border-slate-100 bg-slate-50/30 p-8 text-left transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50"
              >
                <span className="text-[4rem] font-bold text-slate-100 absolute top-4 right-8 select-none leading-none">
                  {step.step}
                </span>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${step.accent} shadow-sm mb-6 relative z-10`}>
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-medium text-slate-950 relative z-10">
                  {step.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-600 font-light relative z-10">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Memory Principles Section */}
      <section className="py-32 border-t border-slate-100">
        <div className="mx-auto max-w-5xl px-6 lg:px-16">
          <p className="text-xs font-medium tracking-[0.22em] text-slate-400 uppercase text-center mb-12">
            Memory OS Principles
          </p>
          <div className="grid gap-12 sm:grid-cols-3">
            {principles.map((principle) => (
              <div key={principle.title} className="text-center sm:text-left">
                <h3 className="text-lg font-medium text-slate-950">{principle.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500 font-light">
                  {principle.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-slate-950 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.2),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-16 text-center">
          <h2 className="text-3xl font-light tracking-tight sm:text-4xl">
            あなたの余白を、ここから始めましょう。
          </h2>
          <p className="mt-6 text-slate-400 font-light max-w-xl mx-auto">
            溜めるためではなく、自分と出会うための場所。<br />
            YOHAKU は、あなたと共に静かに呼吸します。
          </p>
          <div className="mt-10">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-medium text-slate-950 transition-transform hover:-translate-y-0.5"
            >
              扉をひらく
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
