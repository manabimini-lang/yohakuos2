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
                    <div className="flex flex-col items-center space-y-4">
                        <p className="text-xs text-stone-300 text-center font-light">
                            静かな知的空間 — YOHAKU Life OS
                        </p>
                        <a 
                            href="https://discord.gg/your-invite-link" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors border border-stone-200 rounded-full px-4 py-1.5"
                        >
                            Discordコミュニティに参加する
                        </a>
                    </div>
                </footer>
            </div>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
