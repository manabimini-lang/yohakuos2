// ===================================================
// YOHAKU Life OS — Layout
// ===================================================
//
// 静かな知的空間を維持するレイアウト。
// Notion化 / SNS化禁止。
//

import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

export default function LifeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-stone-50 relative">
            <div className="max-w-5xl mx-auto px-4 pt-8 pb-24">
                {/* Header */}
                <header className="mb-8">
                    <Link href="/member" className="inline-block">
                        <h1 className="text-2xl font-light tracking-wider text-stone-700">
                            Life OS
                        </h1>
                        <p className="text-sm text-stone-400 font-light mt-1">
                            人生の流れを静かに見る
                        </p>
                    </Link>
                </header>

                {/* Content */}
                <main className="min-h-[60vh]">
                    {children}
                </main>

                {/* Footer */}
                <footer className="mt-16 pt-8 border-t border-stone-200">
                    <p className="text-xs text-stone-300 text-center font-light">
                        静かな知的空間 — YOHAKU Life OS
                    </p>
                </footer>
            </div>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
