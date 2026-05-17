import Link from "next/link";

export const dynamic = "force-dynamic";

import { CtaSection } from "@/components/public/cta-section";
import { FeaturedContents } from "@/components/public/featured-contents";
import { HeroSection } from "@/components/public/hero-section";
import { PricingComparison } from "@/components/public/pricing-comparison";
import { getFeaturedPublicContents } from "@/lib/content/public-query";
import { getSiteSettings } from "@/lib/settings/get-settings";

function PublicHeader({
  siteTitle,
  logoUrl,
}: {
  siteTitle: string;
  logoUrl: string | null;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium tracking-wide text-slate-900">
          {logoUrl ? <img src={logoUrl} alt={siteTitle} className="h-6 w-6 rounded object-cover" /> : null}
          {siteTitle}
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-slate-600 md:flex">
          <Link href="/member/contents" className="transition-colors hover:text-slate-900">記事</Link>
          <Link href="/login" className="transition-colors hover:text-slate-900">ログイン</Link>
        </nav>
      </div>
    </header>
  );
}

function LearningFlow() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-medium text-slate-900">少しずつ進める</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-slate-100 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">1</p>
          <h3 className="mt-1 font-medium text-slate-800">触れる</h3>
          <p className="mt-2 text-sm text-slate-600">短い記事や動画で、自分のペースで学ぶ。</p>
        </article>
        <article className="rounded-xl border border-slate-100 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">2</p>
          <h3 className="mt-1 font-medium text-slate-800">試す</h3>
          <p className="mt-2 text-sm text-slate-600">小さなタスクで、少しだけ手を動かす。</p>
        </article>
        <article className="rounded-xl border border-slate-100 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">3</p>
          <h3 className="mt-1 font-medium text-slate-800">振り返る</h3>
          <p className="mt-2 text-sm text-slate-600">記録を残し、いつでも戻ってこれるように。</p>
        </article>
      </div>
    </section>
  );
}

function MonthlyThemePreview() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-medium text-slate-900">今月のテーマ</h2>
      <p className="mt-2 text-sm text-slate-600">余白をつくる。</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600 marker:text-slate-300">
        <li>まずは、立ち止まる時間を作る</li>
        <li>書けない日は、無理に書かない</li>
        <li>必要なときに、またここへ戻ってくる</li>
      </ul>
    </section>
  );
}

export default async function LandingPage() {
  const [featured, settings] = await Promise.all([
    getFeaturedPublicContents(),
    getSiteSettings(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader siteTitle={settings.siteTitle} logoUrl={settings.logoUrl} />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:py-8">
        <HeroSection primaryColor={settings.primaryColor} />
        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          {settings.siteDescription}
        </section>
        <FeaturedContents items={featured} />
        <LearningFlow />
        <PricingComparison />
        <MonthlyThemePreview />
        <CtaSection primaryColor={settings.primaryColor} />
      </main>
    </div>
  );
}
