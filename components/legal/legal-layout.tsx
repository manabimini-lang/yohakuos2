import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LastUpdated } from "./last-updated";
import { LegalTOC } from "./legal-toc";
import { LegalFooter } from "./footer";

interface LegalLayoutProps {
  title: string;
  description: string;
  lastUpdated: string;
  tocItems: { id: string; title: string }[];
  children: React.ReactNode;
}

export function LegalLayout({
  title,
  description,
  lastUpdated,
  tocItems,
  children,
}: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 dark:bg-slate-950 dark:text-slate-200 flex flex-col transition-colors duration-200">
      {/* Mini-header */}
      <header className="sticky top-0 z-20 border-b border-slate-100/80 bg-white/80 backdrop-blur-md dark:border-slate-900/60 dark:bg-slate-950/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium tracking-wide text-slate-900 dark:text-slate-100">
            YOHAKU
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            トップへ戻る
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="max-w-3xl lg:max-w-none">
          {/* Document Header */}
          <div className="space-y-4 pb-8 border-b border-slate-100 dark:border-slate-800/40">
            <LastUpdated date={lastUpdated} />
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            <p className="text-sm md:text-[15px] leading-relaxed text-slate-500 dark:text-slate-400 max-w-3xl font-light">
              {description}
            </p>
          </div>

          {/* Two-column layout on Desktop */}
          <div className="flex flex-col lg:flex-row gap-12 mt-10">
            {/* Sidebar TOC */}
            <LegalTOC items={tocItems} />

            {/* Document Article Body */}
            <article className="flex-1 max-w-3xl space-y-2 prose prose-slate dark:prose-invert">
              {children}
            </article>
          </div>
        </div>
      </main>

      {/* Shared Legal Footer */}
      <LegalFooter />
    </div>
  );
}
