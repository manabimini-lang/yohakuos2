// ===================================================
// YOHAKU Life OS — Layout
// ===================================================
//
// 静かな知的空間を維持するレイアウト。
// Notion化 / SNS化禁止。
//

import Link from "next/link";

const NAV_ITEMS = [
    { href: "/life/timeline", label: "タイムライン", icon: "⊞" },
    { href: "/landscape", label: "内面の風景", icon: "⚏" },
    { href: "/life/areas", label: "人生領域", icon: "◎" },
    { href: "/life/meaning", label: "意味の兆し", icon: "◇" },
    { href: "/life/energy", label: "エネルギー", icon: "〜" },
    { href: "/life/seasonal", label: "季節の振り返り", icon: "◈" },
    { href: "/life/balance", label: "バランス", icon: "☯" },
    { href: "/life/planning", label: "静かな計画", icon: "·" },
    { href: "/life/direction", label: "方向性", icon: "→" },
];

export default function LifeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-stone-50">
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header */}
                <header className="mb-8">
                    <Link href="/life/timeline" className="inline-block">
                        <h1 className="text-2xl font-light tracking-wider text-stone-700">
                            Life OS
                        </h1>
                        <p className="text-sm text-stone-400 font-light mt-1">
                            人生の流れを静かに見る
                        </p>
                    </Link>
                </header>

                {/* Navigation */}
                <nav className="mb-8 border-b border-stone-200 pb-2">
                    <div className="flex flex-wrap gap-1">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded transition-colors"
                            >
                                <span className="mr-1.5 text-stone-300">{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </nav>

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
        </div>
    );
}