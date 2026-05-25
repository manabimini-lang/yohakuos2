import { prisma } from '@/lib/prisma';
import { ReflectionCard } from '@/components/memory/ReflectionCard';
import { Sparkles } from 'lucide-react';

interface ReflectionPageProps {
    searchParams: { userId?: string };
}

export default async function ReflectionPage({ searchParams }: ReflectionPageProps) {
    const userId = searchParams.userId || 'default';

    const reflections = await prisma.reflection.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
            id: true,
            title: true,
            content: true,
            reflectionText: true,
            type: true,
            confidence: true,
            createdAt: true,
        },
    });

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight">AI リフレクション</h1>
                <p className="text-muted-foreground text-sm max-w-lg">
                    あなたのナレッジからAIが静かに観察した気づきです。
                    これらは断定ではなく、あくまで一つの視点として受け止めてください。
                </p>
            </div>

            {reflections.length > 0 ? (
                <div className="space-y-4">
                    {reflections.map((r) => (
                        <ReflectionCard
                            key={r.id}
                            title={r.title || 'リフレクション'}
                            content={r.content || r.reflectionText || ''}
                            confidence={r.confidence ?? 0.5}
                            createdAt={r.createdAt.toISOString()}
                            type={r.type || 'insight'}
                        />
                    ))}
                </div>
            ) : (
                <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-brand/5 flex items-center justify-center text-brand/30">
                        <Sparkles className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-lg font-black italic">静かな時間が続いています</p>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            ナレッジカードが5枚蓄積されるたびに、AIが静かな気づきを生成します。
                            もう少しデータが集まるのをお待ちください。
                        </p>
                    </div>
                </div>
            )}

            {reflections.length > 0 && (
                <div className="text-xs text-muted-foreground text-center">
                    これらはAIの観察に基づく参考情報です。あなた自身の解釈が最も重要です。
                </div>
            )}
        </div>
    );
}