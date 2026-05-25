import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import { History } from 'lucide-react';

interface TimelinePageProps {
    searchParams: { userId?: string };
}

export default async function TimelinePage({ searchParams }: TimelinePageProps) {
    const userId = searchParams.userId || 'default';

    const [snapshots, memoriesByMonth] = await Promise.all([
        // Identity snapshots
        prisma.identitySnapshot.findMany({
            where: { userId },
            orderBy: { startDate: 'desc' },
        }),
        // Group memories by month for timeline
        prisma.userMemory.findMany({
            where: { userId, confidence: { gte: 0.3 } },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                type: true,
                title: true,
                confidence: true,
                createdAt: true,
            },
        }),
    ]);

    // Group memories by month
    const timeline = memoriesByMonth.reduce(
        (acc, m) => {
            const month = m.createdAt.toISOString().slice(0, 7); // "2026-05"
            if (!acc[month]) acc[month] = [];
            acc[month].push(m);
            return acc;
        },
        {} as Record<string, typeof memoriesByMonth>
    );

    const sortedMonths = Object.keys(timeline).sort().reverse();

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight">人生の流れ</h1>
                <p className="text-muted-foreground text-sm">
                    あなたの記憶とアイデンティティの変化を時系列で振り返ります。
                </p>
            </div>

            {sortedMonths.length === 0 && snapshots.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                        <History className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-black italic">まだデータがありません</p>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        ナレッジカードを追加すると、ここにあなたの学びの蓄積が表示されます。
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Identity Snapshots */}
                    {snapshots.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="font-black text-sm text-muted-foreground uppercase tracking-widest">
                                アイデンティティ変化
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                {snapshots.map((s) => (
                                    <Card key={s.id} className="p-5 border-l-4 border-l-brand">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    {s.period}
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground">
                                                    確度 {Math.round((s.traits as any)?.confidence || 70)}%
                                                </span>
                                            </div>
                                            <h3 className="font-black text-lg">{s.label}</h3>
                                            <p className="text-sm text-muted-foreground">{s.summary}</p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Memory Timeline */}
                    <section className="space-y-4">
                        <h2 className="font-black text-sm text-muted-foreground uppercase tracking-widest">
                            月別の学び
                        </h2>
                        <div className="relative">
                            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                            <div className="space-y-6">
                                {sortedMonths.map((month) => (
                                    <div key={month} className="relative pl-10">
                                        <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full bg-brand border-2 border-white shadow-sm" />
                                        <div className="space-y-2">
                                            <h3 className="font-bold text-sm">
                                                {new Date(month + '-01').toLocaleDateString('ja-JP', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                })}
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {timeline[month].map((m) => (
                                                    <span
                                                        key={m.id}
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 text-[10px] font-bold text-muted-foreground"
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-brand/50" />
                                                        {m.title}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}