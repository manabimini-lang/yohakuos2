// ===================================================
// YOHAKU Companion — Main Page
// ===================================================
//
// 「Chat UI」ではなく、“静かな対話空間”
//

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CompanionChat from "@/components/companion/companion-chat";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getStarterJourneyStatus } from "@/lib/ai/starter-journey";
import { StarterJourneyBanner } from "@/components/ai/StarterJourneyBanner";
import { checkAIAvailability } from "@/lib/ai/gemini";

export const metadata = {
    title: "静かな対話 | YOHAKU Companion",
    description: "YOHAKU Companion - 人生文脈を理解した静かな伴走者",
};

export default async function CompanionPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const userId = session.user.id;
    const [userSettings, starterJourney, aiAvailability] = await Promise.all([
        prisma.userAISettings.findUnique({ where: { userId } }),
        getStarterJourneyStatus(userId),
        checkAIAvailability(userId),
    ]);

    const hasAiAccess = aiAvailability.available || starterJourney.active;

    if (!hasAiAccess) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
                <div className="max-w-md w-full p-8 rounded-2xl border border-border bg-card space-y-6 text-center">
                    <h2 className="text-lg font-light text-foreground tracking-wider">静かな対話</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed font-light">
                        現在、会話を始めるための Gemini 接続が見つかりません。
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed font-light">
                        環境変数の Gemini APIキー、または設定画面で有効化されたユーザーキーがあれば会話できます。
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-4">
                        <Link 
                            href="/member/settings"
                            className="inline-flex items-center text-xs font-light text-muted-foreground hover:text-foreground transition-colors group"
                        >
                            AI設定へ
                            <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link 
                            href="/memory"
                            className="inline-flex items-center text-xs font-light text-muted-foreground hover:text-foreground transition-colors group"
                        >
                            記憶を見る
                            <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="h-screen flex flex-col">
                {starterJourney.active && !userSettings?.isEnabled && (
                    <div className="mx-auto my-6 w-full max-w-4xl px-6">
                        <StarterJourneyBanner
                            remainingHours={starterJourney.remainingHours}
                            remainingMinutes={starterJourney.remainingMinutes}
                        />
                    </div>
                )}
                <CompanionChat />
            </div>
        </div>
    );
}
