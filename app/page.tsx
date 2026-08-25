import Link from "next/link";
import {
  ArrowRight,
  Feather,
  Layers,
  History,
  BrainCircuit,
  Check,
  Sparkles,
  LockKeyhole,
  ArrowUpRight,
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

const otherAiCategories = [
  {
    label: "A",
    title: "予定を整えるAI",
    description: "空いている時間を見つけ、予定を最適化する。",
  },
  {
    label: "B",
    title: "スケジュールを決めるAI",
    description: "タスクを並べ、今日の時間割をつくる。",
  },
  {
    label: "C",
    title: "仕事を実行するAI",
    description: "メールや定型業務を、AIに任せる。",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f7] text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-200/70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(220,229,255,0.85),transparent_28%),radial-gradient(circle_at_82%_72%,rgba(232,225,255,0.7),transparent_30%)]" />
        <div className="absolute -right-32 top-16 h-[26rem] w-[26rem] rounded-full bg-violet-300/15 blur-3xl" />

        <div className="relative mx-auto grid min-h-[78vh] max-w-7xl items-center gap-14 px-6 py-20 sm:px-10 lg:grid-cols-[1.12fr_0.88fr] lg:px-16 lg:py-24">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-violet-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              AI EXECUTIVE ASSISTANT
            </p>

            <h1 className="mt-7 max-w-3xl text-5xl font-light leading-[1.16] tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl xl:text-7xl">
              今日、何をするか。<br />
              <span className="sm:whitespace-nowrap">もう、探さなくていい。</span>
            </h1>

            <p className="mt-8 max-w-xl text-lg font-light leading-8 text-slate-600 sm:text-xl">
              予定、メール、目標、そしてこれまでの流れ。<br />
              YOHAKUOSは、散らばった情報を並べるのではなく、あなたの今を理解して、今日進めることを一緒に考えます。
            </p>

            <ul className="mt-8 space-y-3 text-sm font-medium text-slate-700">
              {[
                "まとまっていない言葉も、そのまま記録できる",
                "過去の流れと、いまの気持ちをやさしくつなぐ",
                "考えすぎずに始められる、今日の小さな提案",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700"><Check className="h-3.5 w-3.5" /></span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-violet-700">
                無料でYOHAKUをはじめる <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/70 px-7 py-4 text-sm font-semibold text-slate-700 transition hover:bg-white">
                ログイン
              </Link>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500"><LockKeyhole className="h-3.5 w-3.5" />あなたの記録は、あなたのためだけに使われます。</p>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -inset-8 rounded-full bg-violet-200/25 blur-3xl" />
            <div className="relative border-l border-slate-300/80 pl-7 sm:pl-10 lg:ml-10">
              <div className="flex items-center gap-3 text-xs font-medium tracking-[0.12em] text-slate-500">
                <BrainCircuit className="h-4 w-4 text-violet-600" aria-hidden="true" />
                TODAY&apos;S CONTEXT
              </div>
              <p className="mt-8 text-2xl font-light leading-relaxed tracking-[-0.035em] text-slate-900 sm:text-3xl">
                「忙しいのに、何も進んでいない気がする」
              </p>
              <div className="mt-8 border-t border-slate-300/70 pt-6">
                <p className="text-xs font-semibold tracking-[0.14em] text-violet-700">YOHAKU AI</p>
                <p className="mt-3 text-base font-light leading-8 text-slate-600">
                  最近の記録には、人と話す時間がある日は満たされるという共通点があります。今日は15分、誰かに連絡してみませんか？
                </p>
              </div>
              <div className="mt-8 flex items-center gap-3 text-sm text-slate-700">
                <span className="h-px w-8 bg-violet-400" />
                今日の一歩：友人に短いメッセージを送る
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-slate-400">POSITIONING</p>
            <h2 className="mt-5 text-4xl font-light tracking-[-0.045em] text-slate-950 sm:text-5xl">AIは、何を手伝うべきだろう。</h2>
            <p className="mt-6 text-base font-light leading-8 text-slate-500">便利にすることだけが、今日を前へ進めることではありません。</p>
          </div>

          <div className="mt-16 grid gap-x-12 gap-y-10 border-y border-slate-200 py-10 md:grid-cols-3">
            {otherAiCategories.map((category) => (
              <div key={category.label} className="max-w-xs">
                <p className="text-xs font-semibold tracking-[0.18em] text-slate-400">{category.label}</p>
                <h3 className="mt-4 text-lg font-medium text-slate-900">{category.title}</h3>
                <p className="mt-3 text-sm font-light leading-7 text-slate-500">{category.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-violet-700">YOHAKUOS</p>
              <h3 className="mt-4 text-3xl font-light tracking-[-0.04em] text-slate-950 sm:text-4xl">あなたを理解するAI</h3>
            </div>
            <div className="border-l border-violet-300 pl-6 sm:pl-9">
              <p className="max-w-2xl text-xl font-light leading-9 tracking-[-0.025em] text-slate-700 sm:text-2xl">
                予定も、メールも、目標も、それぞれを見るだけではありません。これまでの流れと今の状況から、今日、何を進めるべきかを一緒に考える。
              </p>
              <Link href="/signup" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-violet-700">
                YOHAKUOSをはじめる <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
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
