// ===================================================
// YOHAKU Life OS — Life Timeline Page
// ===================================================
//
// 人生の流れを静かに見るタイムライン。
// SNSタイムラインではなく「人生アーカイブ」。
//

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLifeTimeline, getLifeTimelineStats } from "@/lib/lifeos";

export default async function LifeTimelinePage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = session.user.id;
    const [timeline, stats] = await Promise.all([
        getLifeTimeline({ userId, limit: 50 }),
        getLifeTimelineStats(userId),
    ]);

    return (
        <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border border-stone-200">
                    <p className="text-xs text-stone-400 font-light">総エントリー</p>
                    <p className="text-xl font-light text-stone-700 mt-1">{stats.totalEntries}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-stone-200">
                    <p className="text-xs text-stone-400 font-light">1日平均</p>
                    <p className="text-xl font-light text-stone-700 mt-1">{stats.dailyAverage}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-stone-200">
                    <p className="text-xs text-stone-400 font-light">内省</p>
                    <p className="text-xl font-light text-stone-700 mt-1">{stats.byType.reflection}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-stone-200">
                    <p className="text-xs text-stone-400 font-light">意味シグナル</p>
                    <p className="text-xl font-light text-stone-700 mt-1">{stats.byType.meaning}</p>
                </div>
            </div>

            {/* Timeline Entries */}
            <div className="space-y-3">
                <h2 className="text-lg font-light text-stone-600">タイムライン</h2>
                {timeline.entries.length === 0 ? (
                    <div className="bg-white rounded-lg p-8 border border-stone-200 text-center">
                        <p className="text-stone-400 font-light">
                            まだタイムラインに表示できるデータがありません。
                        </p>
                        <p className="text-stone-300 text-sm font-light mt-2">
                            内省や学びを記録すると、ここに表示されます。
                        </p>
                    </div>
                ) : (
                    timeline.entries.map((entry) => (
                        <div
                            key={entry.id}
                            className="bg-white rounded-lg p-4 border border-stone-200 hover:border-stone-300 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                {/* Type icon */}
                                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs text-stone-400">
                                        {getTypeIcon(entry.type)}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-sm font-medium text-stone-700 truncate">
                                            {entry.title}
                                        </h3>
                                        <span className="text-[10px] text-stone-300 flex-shrink-0">
                                            {formatDate(entry.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-stone-400 font-light mt-1 line-clamp-2">
                                        {entry.description}
                                    </p>

                                    {/* Meta */}
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-[10px] px-1.5 py-0.5 bg-stone-50 text-stone-400 rounded">
                                            {getTypeLabel(entry.type)}
                                        </span>
                                        {entry.areaType && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-stone-50 text-stone-400 rounded">
                                                {entry.areaType}
                                            </span>
                                        )}
                                        {entry.confidence < 0.4 && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-stone-50 text-stone-300 rounded">
                                                低確度
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
        learning: "📖",
        emotion: "💭",
        action: "⚡",
        reflection: "◈",
        road: "→",
        meaning: "◇",
        habit: "○",
        conversation: "💬",
        energy: "〜",
        direction: "↑",
    };
    return icons[type] || "·";
}

function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        learning: "学び",
        emotion: "感情",
        action: "行動",
        reflection: "内省",
        road: "道",
        meaning: "意味",
        habit: "習慣",
        conversation: "会話",
        energy: "エネルギー",
        direction: "方向性",
    };
    return labels[type] || type;
}

function formatDate(date: Date): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "今日";
    if (days === 1) return "昨日";
    if (days < 7) return `${days}日前`;
    return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}