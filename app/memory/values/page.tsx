import { prisma } from '@/lib/prisma';
import { ValueCard } from '@/components/memory/ValueCard';

interface ValuesPageProps {
    searchParams: { userId?: string };
}

export default async function ValuesPage({ searchParams }: ValuesPageProps) {
    const userId = searchParams.userId || 'default';

    const values = await prisma.userMemory.findMany({
        where: {
            userId,
            type: 'value',
            confidence: { gte: 0.3 },
        },
        orderBy: { confidence: 'desc' },
        select: {
            id: true,
            title: true,
            content: true,
            confidence: true,
            category: true,
            createdAt: true,
        },
    });

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight">あなたの価値観</h1>
                <p className="text-muted-foreground text-sm">
                    ナレッジカードから抽出された、あなたの価値観の一覧です。
                    確度はAIの推定値であり、絶対的なものではありません。
                </p>
            </div>

            {values.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {values.map((v) => (
                        <ValueCard
                            key={v.id}
                            title={v.title}
                            content={v.content}
                            confidence={v.confidence}
                            category={v.category}
                        />
                    ))}
                </div>
            ) : (
                <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                        <span className="text-2xl">?</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-lg font-black italic">まだ価値観が抽出されていません</p>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            ナレッジカードを追加すると、AIがあなたの価値観を自動抽出します。
                            「ナレッジ」ページからコンテンツを追加してください。
                        </p>
                    </div>
                </div>
            )}

            {values.length > 0 && (
                <div className="text-xs text-muted-foreground text-center">
                    {values.length}件の価値観 · 確度はAIによる推定です
                </div>
            )}
        </div>
    );
}