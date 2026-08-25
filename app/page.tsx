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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(218,232,255,0.9),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(222,210,255,0.72),transparent_32%),linear-gradient(135deg,#fafcff_0%,#f5f3ff_48%,#f8fafc_100%)]" />
        <div className="absolute -right-24 top-8 h-96 w-96 rounded-full bg-violet-300/20 blur-3xl" />

        <div className="relative mx-auto grid min-h-[84vh] max-w-7xl items-center gap-14 px-6 py-16 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-16">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/80 px-4 py-2 text-[11px] font-semibold tracking-[0.16em] text-violet-700 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              PERSONAL AI MEMORY OS
            </p>

            <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[1.13] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">
              書き留めるだけで、
              <span className="block bg-gradient-to-r from-violet-700 via-indigo-600 to-sky-600 bg-clip-text text-transparent">あなたの次の一歩が見えてくる。</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
              YOHAKUは、日々の気づき・気分・迷いをあなた専用のAIが記憶し、
              整理、振り返り、次の行動までをひとつながりにするサービスです。
            </p>

            <ul className="mt-7 space-y-3 text-sm font-medium text-slate-700">
              {[
                "まとまっていない言葉も、そのまま記録できる",
                "過去の自分と今の気持ちを、AIがやさしくつなぐ",
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
            <div className="absolute inset-6 rounded-[2.5rem] bg-gradient-to-br from-violet-400/40 to-sky-300/30 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl sm:p-7">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-5">
                <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white"><BrainCircuit className="h-5 w-5" /></span><div><p className="text-sm font-bold text-slate-900">YOHAKU AI</p><p className="text-xs text-emerald-600">あなたの文脈を読んでいます</p></div></div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">今日</span>
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl rounded-tl-sm bg-slate-100 p-4 text-sm leading-6 text-slate-600">「忙しいのに、何も進んでいない気がする」</div>
                <div className="ml-6 rounded-2xl rounded-tr-sm bg-gradient-to-br from-violet-600 to-indigo-600 p-4 text-sm leading-6 text-white shadow-lg shadow-violet-500/20">最近の記録には、「人と話す時間がある日は満たされる」という共通点があります。今日は15分、誰かに連絡してみませんか？</div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-violet-100 bg-violet-50 p-3"><p className="text-[11px] font-semibold text-violet-700">見つけた傾向</p><p className="mt-1 text-xs leading-5 text-slate-600">人との対話が、回復のきっかけ</p></div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3"><p className="text-[11px] font-semibold text-sky-700">今日の一歩</p><p className="mt-1 text-xs leading-5 text-slate-600">友人に短いメッセージを送る</p></div>
              </div>
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
