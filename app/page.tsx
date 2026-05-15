import Link from "next/link";

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
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-900">
          {logoUrl ? <img src={logoUrl} alt={siteTitle} className="h-6 w-6 rounded object-cover" /> : null}
          {siteTitle}
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-slate-600 md:flex">
          <Link href="/member/contents">Contents</Link>
          <a href="#" aria-disabled="true" className="opacity-70">
            Pricing
          </a>
          <Link href="/login">Login</Link>
          <Link href="/login" className="rounded-md bg-slate-900 px-3 py-1.5 text-white">
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}

function LearningFlow() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-xl font-semibold text-slate-900">Learning Flow</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">1</p>
          <h3 className="mt-1 font-semibold text-slate-900">学ぶ</h3>
          <p className="mt-2 text-sm text-slate-600">短い記事と動画で要点をつかむ。</p>
        </article>
        <article className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">2</p>
          <h3 className="mt-1 font-semibold text-slate-900">実践する</h3>
          <p className="mt-2 text-sm text-slate-600">タスクで手を動かして定着させる。</p>
        </article>
        <article className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">3</p>
          <h3 className="mt-1 font-semibold text-slate-900">継続する</h3>
          <p className="mt-2 text-sm text-slate-600">月次テーマで習慣化して積み上げる。</p>
        </article>
      </div>
    </section>
  );
}

function MonthlyThemePreview() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-xl font-semibold text-slate-900">Monthly Theme Preview</h2>
      <p className="mt-2 text-sm text-slate-600">今月のテーマ: 学びを習慣化する。</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
        <li>週3回の学習時間を固定する</li>
        <li>1つ学んだら1つアウトプットする</li>
        <li>月末に振り返り、次月へつなげる</li>
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
