import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSlowFeed, getUnreadFeedCount, getResonancePatterns } from "@/lib/ambient";
import Link from "next/link";

export default async function AmbientPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const [feed, unreadCount, resonances] = await Promise.all([
        getSlowFeed(session.user.id, 10),
        getUnreadFeedCount(session.user.id),
        getResonancePatterns(session.user.id),
    ]);

    return (
        <div className="min-h-screen bg-stone-50">
            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Header */}
                <header className="mb-12">
                    <h1 className="text-2xl font-light tracking-wider text-stone-700">
                        Ambient Intelligence
                    </h1>
                    <p className="text-sm text-stone-400 font-light mt-1">
                        必要な時だけ静かに現れる — 静かな知的環境
                    </p>
                </header>

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <div className="mb-8 bg-white rounded-lg p-4 border border-stone-200">
                        <p className="text-sm text-stone-500 font-light">
                            {unreadCount}件の新しい気づきがあります
                        </p>
                    </div>
                )}

                {/* Slow Feed */}
                <section className="mb-12">
                    <h2 className="text-lg font-light text-stone-600 mb-4">
                        静かな知性
                        <span className="text-xs text-stone-300 ml-2">低頻度 · 深い文脈 · 静かな問い</span>
                    </h2>

                    {feed.length === 0 ? (
                        <div className="bg-white rounded-lg p-8 border border-stone-200 text-center">
                            <p className="text-stone-400 font-light">
                                まだフィードはありません。日々の記録を続けると、
                                ここに静かな気づきが現れます。
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {feed.map((entry) => (
                                <div
                                    key={entry.id}
                                    className={`bg-white rounded-lg p-5 border transition-colors ${entry.isRead
                                            ? "border-stone-100 opacity-60"
                                            : "border-stone-200 hover:border-stone-300"
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs text-stone-400">
                                                {getEntryIcon(entry.entryType)}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2">
                                                <h3 className="text-sm font-medium text-stone-700">
                                                    {entry.title}
                                                </h3>
                                                <span className="text-[10px] text-stone-300">
                                                    {formatTimeAgo(entry.surfacedAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-stone-400 font-light mt-1 leading-relaxed">
                                                {entry.content}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] px-1.5 py-0.5 bg-stone-50 text-stone-400 rounded">
                                                    {getEntryLabel(entry.entryType)}
                                                </span>
                                                {entry.confidence < 0.3 && (
                                                    <span className="text-[10px] text-stone-300">
                                                        小さな兆し
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Resonance Patterns */}
                {resonances.length > 0 && (
                    <section className="mb-12">
                        <h2 className="text-lg font-light text-stone-600 mb-4">
                            人生の反復
                            <span className="text-xs text-stone-300 ml-2">繰り返し現れるパターン</span>
                        </h2>
                        <div className="space-y-3">
                            {resonances.map((pattern) => (
                                <div
                                    key={pattern.id}
                                    className="bg-white rounded-lg p-5 border border-stone-200"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded">
                                            {pattern.patternType.replace(/_/g, " ")}
                                        </span>
                                        <span className="text-[10px] text-stone-300">
                                            {pattern.observedCount}回観測
                                        </span>
                                        <span className="text-[10px] text-stone-300">
                                            確度: {Math.round(pattern.confidence * 100)}%
                                        </span>
                                    </div>
                                    <p className="text-sm text-stone-500 font-light">
                                        {pattern.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Footer */}
                <footer className="pt-8 border-t border-stone-200">
                    <p className="text-xs text-stone-300 text-center font-light">
                        静かに、しかし確かに — YOHAKU Ambient Intelligence
                    </p>
                </footer>
            </div>
        </div>
    );
}

function getEntryIcon(type: string): string {
    const icons: Record<string, string> = {
        insight: "◇",
        resonance: "◎",
        reflection: "◈",
        seasonal_echo: "〜",
        quiet_connection: "·",
    };
    return icons[type] || "·";
}

function getEntryLabel(type: string): string {
    const labels: Record<string, string> = {
        insight: "気づき",
        resonance: "共鳴",
        reflection: "内省",
        seasonal_echo: "季節のこだま",
        quiet_connection: "静かな接続",
    };
    return labels[type] || type;
}

function formatTimeAgo(date: Date): string {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "たった今";
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}