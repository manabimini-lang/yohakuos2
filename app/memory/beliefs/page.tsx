import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import { BrainCircuit } from 'lucide-react';

interface BeliefsPageProps {
    searchParams: { userId?: string };
}

export default async function BeliefsPage({ searchParams }: BeliefsPageProps) {
    const userId = searchParams.userId || 'default';

    const [beliefs, emotionalPatterns, thinkingPatterns] = await Promise.all([
        prisma.userMemory.findMany({
            where: { userId, type: 'belief', confidence: { gte: 0.3 } },
            orderBy: { confidence: 'desc' },
            select: { id: true, title: true, content: true, confidence: true },
        }),
        prisma.userMemory.findMany({
            where: { userId, type: 'emotional_pattern', confidence: { gte: 0.3 } },
            orderBy: { confidence: 'desc' },
            select: { id: true, title: true, content: true, confidence: true },
        }),
        prisma.userMemory.findMany({
            where: { userId, type: 'thinking_pattern', confidence: { gte: 0.3 } },
            orderBy: { confidence: 'desc' },
            select: { id: true, title: true, content: true, confidence: true },
        }),
    ]);

    const isEmpty = beliefs.length === 0 && emotionalPatterns.length === 0 && thinkingPatterns.length === 0;

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight">思考傾向</h1>
                <p className="text-muted-foreground text-sm">
                    あなたの思考パターン、信念、感情の傾向です。
                    これらは絶対的な診断ではなく、あくまでAIによる観察です。
                </p>
            </div>

            {isEmpty ? (
                <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                        <BrainCircuit className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-black italic">まだ十分なデータがありません</p>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        ナレッジカードを追加すると、思考傾向の分析が可能になります。
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {beliefs.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="font-black text-sm text-muted-foreground uppercase tracking-widest">
                                信念・価値判断 ({beliefs.length})
                            </h2>
                            <div className="grid gap-3 md:grid-cols-2">
                                {beliefs.map((b) => (
                                    <Card key={b.id} className="p-4 border border-border/20">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-sm">{b.title}</h3>
                                                <span className="text-[10px] font-bold text-muted-foreground">
                                                    {Math.round(b.confidence * 100)}%
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {b.content}
                                            </p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    )}

                    {emotionalPatterns.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="font-black text-sm text-muted-foreground uppercase tracking-widest">
                                感情パターン ({emotionalPatterns.length})
                            </h2>
                            <div className="grid gap-3 md:grid-cols-2">
                                {emotionalPatterns.map((e) => (
                                    <Card key={e.id} className="p-4 border border-border/20">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-sm">{e.title}</h3>
                                                <span className="text-[10px] font-bold text-muted-foreground">
                                                    {Math.round(e.confidence * 100)}%
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {e.content}
                                            </p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    )}

                    {thinkingPatterns.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="font-black text-sm text-muted-foreground uppercase tracking-widest">
                                思考パターン ({thinkingPatterns.length})
                            </h2>
                            <div className="grid gap-3 md:grid-cols-2">
                                {thinkingPatterns.map((t) => (
                                    <Card key={t.id} className="p-4 border border-border/20">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-sm">{t.title}</h3>
                                                <span className="text-[10px] font-bold text-muted-foreground">
                                                    {Math.round(t.confidence * 100)}%
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {t.content}
                                            </p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {!isEmpty && (
                <div className="text-xs text-muted-foreground text-center">
                    AIによる推定です。あなた自身の解釈が最も重要です。
                </div>
            )}
        </div>
    );
}