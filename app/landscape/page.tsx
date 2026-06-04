import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LandscapeTrigger from "@/components/landscape/landscape-trigger";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { checkAIAvailability } from "@/lib/ai/gemini";

export const metadata = {
    title: "内面の風景 — YOHAKU",
    description: "あなたの記録から静かに読み取られた、内面の風景。",
};

function classifyAiError(lastError: string | null): { subMessage: string; showSettings: boolean } {
  if (!lastError) {
    return { subMessage: "整理を完了できませんでした。後ほど再試行されます。", showSettings: true };
  }
  const errStr = lastError.toLowerCase();
  if (errStr.includes("api key") || errStr.includes("invalid") || errStr.includes("key not valid") || errStr.includes("unauthorized") || errStr.includes("auth")) {
    return { subMessage: "接続情報を確認してください。", showSettings: true };
  }
  if (errStr.includes("exhausted") || errStr.includes("quota") || errStr.includes("limit") || errStr.includes("429")) {
    return { subMessage: "現在AI利用上限に達しています。しばらく時間を空けて再試行されます。", showSettings: false };
  }
  if (errStr.includes("fetch") || errStr.includes("network") || errStr.includes("dns") || errStr.includes("timeout") || errStr.includes("connect") || errStr.includes("econnrefused")) {
    return { subMessage: "一時的な接続の問題が発生しました。", showSettings: false };
  }
  return { subMessage: "整理を完了できませんでした。後ほど再試行されます。", showSettings: true };
}

export default async function LandscapePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const userId = session.user.id;

    const [landscape, itemCount, latestJob, hasAiConnection] = await Promise.all([
        prisma.innerLandscape.findFirst({
            where: { userId },
            orderBy: { generatedAt: "desc" },
        }),
        prisma.contentItem.count({ where: { userId, memoryState: "active" } }),
        prisma.aIJob.findFirst({
            where: {
                userId,
                jobType: "generate_inner_landscape",
            },
            orderBy: { createdAt: "desc" },
        }),
        checkAIAvailability(userId),
    ]);

    const hasPendingJob = latestJob ? (latestJob.status === "pending" || latestJob.status === "processing") : false;
    const isFailed = latestJob ? (latestJob.status === "failed") : false;
    const errorDetails = classifyAiError(latestJob?.lastError ?? null);

    const generatedDate = landscape
        ? new Intl.DateTimeFormat("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
          }).format(new Date(landscape.generatedAt))
        : null;

    return (
        <div className="min-h-screen bg-stone-50">
            <div className="max-w-2xl mx-auto px-6 py-14 space-y-12">

                {/* Header */}
                <header className="space-y-1">
                    <h1 className="text-lg font-light tracking-wider text-stone-600">
                        内面の風景
                    </h1>
                    {generatedDate && (
                        <p className="text-xs text-stone-300 font-light">{generatedDate}</p>
                    )}
                </header>

                {/* AI status / Unified guidance card */}
                {!hasAiConnection && (
                    <div className="p-8 rounded-2xl border border-stone-200 bg-white space-y-4">
                        <p className="text-sm text-stone-700 leading-relaxed font-light">
                            AI接続がまだ行われていません。
                        </p>
                        <p className="text-xs text-stone-400 font-light leading-relaxed">
                            Gemini APIキーを設定すると、保存した記録が静かに整えられ、パーソナルAIとの対話や、内面の風景の描画が始まります。
                        </p>
                        <div className="pt-2">
                            <Link
                                href="/settings/ai"
                                className="inline-flex items-center text-xs font-light text-stone-500 hover:text-stone-700 transition-colors group"
                            >
                                AI設定へ
                                <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* AI Failure Recovery UX Card */}
                {hasAiConnection && isFailed && (
                    <div className="p-8 rounded-2xl border border-stone-200 bg-white space-y-4">
                        <p className="text-sm text-stone-700 leading-relaxed font-light">
                            AIは今夜、静かに休んでいます。
                        </p>
                        <p className="text-xs text-stone-400 font-light leading-relaxed">
                            {errorDetails.subMessage}
                        </p>
                        <div className="flex gap-4 pt-2">
                            {errorDetails.showSettings && (
                                <Link
                                    href="/settings/ai"
                                    className="inline-flex items-center text-xs font-light text-stone-500 hover:text-stone-700 transition-colors group"
                                >
                                    AI設定を確認する
                                    <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            )}
                            <Link
                                href="/landscape/retry"
                                className="inline-flex items-center text-xs font-light text-stone-500 hover:text-stone-700 transition-colors group"
                            >
                                もう一度試す
                                <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Landscape content */}
                {hasAiConnection && landscape ? (
                    <div className="space-y-8">

                        {/* Seasonal Air */}
                        {landscape.seasonalAir && (
                            <section className="space-y-2">
                                <h2 className="text-xs text-stone-300 font-light tracking-widest uppercase">
                                    季節の空気
                                </h2>
                                <p className="text-sm text-stone-600 font-light leading-relaxed">
                                    {landscape.seasonalAir}
                                </p>
                            </section>
                        )}

                        {/* Dominant Theme */}
                        {landscape.dominantTheme && (
                            <section className="space-y-2">
                                <h2 className="text-xs text-stone-300 font-light tracking-widest uppercase">
                                    流れるテーマ
                                </h2>
                                <p className="text-sm text-stone-500 font-light italic">
                                    {landscape.dominantTheme}
                                </p>
                            </section>
                        )}

                        {/* Quiet Currents */}
                        {Array.isArray(landscape.quietCurrents) &&
                            landscape.quietCurrents.length > 0 && (
                            <section className="space-y-3">
                                <h2 className="text-xs text-stone-300 font-light tracking-widest uppercase">
                                    静かな流れ
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {(landscape.quietCurrents as unknown[])
                                        .filter((x): x is string => typeof x === "string")
                                        .map((t, i) => (
                                            <span
                                                key={i}
                                                className="
                                                    text-xs px-3 py-1
                                                    bg-white border border-stone-200
                                                    text-stone-500 font-light rounded-full
                                                "
                                            >
                                                {t}
                                            </span>
                                        ))}
                                </div>
                            </section>
                        )}

                        {/* Returning Questions */}
                        {Array.isArray(landscape.returningQuestions) &&
                            landscape.returningQuestions.length > 0 && (
                            <section className="space-y-3">
                                <h2 className="text-xs text-stone-300 font-light tracking-widest uppercase">
                                    戻ってくる問い
                                </h2>
                                <ul className="space-y-2">
                                    {(landscape.returningQuestions as unknown[])
                                        .filter((x): x is string => typeof x === "string")
                                        .map((q, i) => (
                                            <li
                                                key={i}
                                                className="
                                                    text-sm text-stone-600 font-light
                                                    pl-3 border-l border-stone-200
                                                    leading-relaxed
                                                "
                                            >
                                                {q}
                                            </li>
                                        ))}
                                </ul>
                            </section>
                        )}

                        {/* Resonance Weather */}
                        {landscape.resonanceWeather && (
                            <section className="space-y-2">
                                <h2 className="text-xs text-stone-300 font-light tracking-widest uppercase">
                                    共鳴の天気
                                </h2>
                                <p className="text-sm text-stone-500 font-light leading-relaxed">
                                    {landscape.resonanceWeather}
                                </p>
                            </section>
                        )}

                        {/* Philosophy Echoes */}
                        {Array.isArray(landscape.philosophyEchoes) &&
                            landscape.philosophyEchoes.length > 0 && (
                            <section className="space-y-3">
                                <h2 className="text-xs text-stone-300 font-light tracking-widest uppercase">
                                    哲学の残響
                                </h2>
                                <div className="space-y-3">
                                    {(landscape.philosophyEchoes as unknown[])
                                        .filter((x): x is string => typeof x === "string")
                                        .map((e, i) => (
                                            <p
                                                key={i}
                                                className="text-sm text-stone-500 font-light leading-relaxed"
                                            >
                                                {e}
                                            </p>
                                        ))}
                                </div>
                            </section>
                        )}

                        {/* Divider */}
                        <div className="border-t border-stone-100 pt-6" />
                    </div>
                ) : null}

                {/* Manual Trigger */}
                {hasAiConnection && (
                    <LandscapeTrigger
                        hasLandscape={!!landscape}
                        hasPendingJob={hasPendingJob}
                        itemCount={itemCount}
                    />
                )}
            </div>
        </div>
    );
}
