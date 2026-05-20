import React from "react";
import Link from "next/link";

export function LegalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-100 bg-white py-12 dark:border-slate-800/40 dark:bg-slate-950/20">
      <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-medium tracking-wide text-slate-800 dark:text-slate-300 hover:opacity-80 transition-opacity">
            YOHAKU
          </Link>
          <span className="text-xs text-slate-300 dark:text-slate-800">|</span>
          <p className="text-xs">止まっても、戻ってこれる場所。</p>
        </div>
        
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-normal">
          <Link href="/terms" className="transition-colors hover:text-slate-600 dark:hover:text-slate-300">
            利用規約
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-slate-600 dark:hover:text-slate-300">
            プライバシーポリシー
          </Link>
          <Link href="/legal" className="transition-colors hover:text-slate-600 dark:hover:text-slate-300">
            特定商取引法
          </Link>
          <Link href="/guidelines" className="transition-colors hover:text-slate-600 dark:hover:text-slate-300">
            コミュニティガイドライン
          </Link>
          <Link href="/ai-policy" className="transition-colors hover:text-slate-600 dark:hover:text-slate-300">
            AI利用ポリシー
          </Link>
        </nav>

        <p className="text-xs font-light tracking-wider">
          &copy; {currentYear} YOHAKU. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
