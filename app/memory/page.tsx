import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import { BrainCircuit, Heart, History, Sparkles, Share2, Eye } from 'lucide-react';
import Link from 'next/link';

interface MemoryPageProps {
    searchParams: { userId?: string };
}

const SECTIONS = [
    {
        href: '/memory/values',
        icon: Heart,
        title: '価値観',
        description: 'あなたのコアバリュー',
        color: 'text-rose-500',
        bg: 'bg-rose-50',
    },
    {
        href: '/memory/beliefs',
        icon: BrainCircuit,
        title: '思考傾向',
        description: '信念・感情・思考パターン',
        color: 'text-blue-500',
        bg: 'bg-blue-50',
    },
    {
        href: '/memory/timeline',
        icon: History,
        title: '人生の流れ',
        description: 'アイデンティティ変化の記録',
        color: 'text-purple-500',
        bg: 'bg-purple-50',
    },
    {
        href: '/memory/reflection',
        icon: Sparkles,
        title: 'AI リフレクション',
        description: '静かな気づきと観察',
        color: 'text-brand',
        bg: 'bg-brand/5',
    },
    {
        href: '/memory/graph',
        icon: Share2,
        title: 'メモリーグラフ',
        description: '知識の関係性マップ',
        color: 'text-emerald-500',
        bg: 'bg-emerald-50',
    },
];

export default async function MemoryPage({ searchParams }: MemoryPageProps) {
    const userId = searchParams.userId || 'default';

    const [memoryCount, reflectionCount, cardCount] = await Promise.all([
        prisma.userMemory.count({
            where: { userId, confidence: { gte: 0.3 } },
        }),
        prisma.reflection.count({ where: { userId } }),
        prisma.knowledgeCard.count({ where: { userId } }),
    ]);

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-brand font-black uppercase tracking-[0.2em] text-xs">
                    <BrainCircuit className="h-4 w-4" />
                    PERSONAL MEMORY LAYER
                </div>
                <h1 className="text-3xl font-black tracking-tight">記憶</h1>
                <p className="text-muted-foreground text-sm max-w-lg">
                    あなたの学び・感情・行動・価値観を、AIが長期的に理解するための構造です。
                    これらの情報は「参考」であり、「断定」ではありません。
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 border border-border/20 text-center">
                    <p className="text-2xl font-black">{memoryCount}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        記憶
                    </p>
                </Card>
                <Card className="p-4 border border-border/20 text-center">
                    <p className="text-2xl font-black">{reflectionCount}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        気づき
                    </p>
                </Card>
                <Card className="p-4 border border-border/20 text-center">
                    <p className="text-2xl font-black">{cardCount}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        カード
                    </p>
                </Card>
            </div>

            {/* Navigation Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {SECTIONS.map((section) => (
                    <Link key={section.href} href={section.href}>
                        <Card className="p-5 border border-border/20 hover:border-border/40 hover:shadow-sm transition-all cursor-pointer h-full">
                            <div className="space-y-3">
                                <div
                                    className={`h-10 w-10 rounded-xl ${section.bg} flex items-center justify-center ${section.color}`}
                                >
                                    <section.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-black">{section.title}</h3>
                                    <p className="text-xs text-muted-foreground">
                                        {section.description}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Empty State Note */}
            {memoryCount === 0 && (
                <Card className="p-6 bg-brand/5 border-none">
                    <p className="text-sm text-muted-foreground italic">
                        「ナレッジ」ページから情報を追加すると、ここにあなたの記憶が構築されていきます。
                        最初は何もなくて当然です。少しずつ育てていきましょう。
                    </p>
                </Card>
            )}
        </div>
    );
}