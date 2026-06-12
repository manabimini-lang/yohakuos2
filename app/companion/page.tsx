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
    const userSettings = await prisma.userAISettings.findUnique({
        where: { userId },
    });

    const starterJourney = await getStarterJourneyStatus(userId);
    const hasAiAccess = userSettings?.isEnabled || starterJourney.active;

    if (!hasAiAccess) {
        return (
            <div className="min-h-screen bg-[#090909] text-slate-100 flex items-center justify-center p-6">
                <div className="max-w-md w-full p-8 rounded-2xl border border-white/10 bg-white/[0.02] space-y-6 text-center">
                    <h2 className="text-lg font-light text-white tracking-wider">静かな対話</h2>
                    <p className="text-sm text-slate-300 leading-relaxed font-light">
                        AI接続がまだ行われていません。
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed font-light">
                        Gemini APIキーを設定すると、保存した記録が静かに整えられ、パーソナルAIとの対話や、内面の風景の描画が始まります。
                    </p>
                    <div className="pt-2">
                        <Link 
                            href="/member/settings"
                            className="inline-flex items-center text-xs font-light text-slate-400 hover:text-slate-200 transition-colors group"
                        >
                            AI設定へ
                            <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#090909] text-slate-100">
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
