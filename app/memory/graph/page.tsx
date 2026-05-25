'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface GraphNode {
    id: string;
    type: string;
    title: string;
    confidence: number;
}

interface GraphEdge {
    id: string;
    source: string;
    target: string;
    relation: string;
    strength: number;
}

interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

const RELATION_COLORS: Record<string, string> = {
    supports: 'text-emerald-500 border-emerald-200 bg-emerald-50',
    contradicts: 'text-red-500 border-red-200 bg-red-50',
    causes: 'text-blue-500 border-blue-200 bg-blue-50',
    results_in: 'text-purple-500 border-purple-200 bg-purple-50',
    similar_to: 'text-amber-500 border-amber-200 bg-amber-50',
    evolved_to: 'text-indigo-500 border-indigo-200 bg-indigo-50',
    influenced_by: 'text-orange-500 border-orange-200 bg-orange-50',
};

const RELATION_LABELS: Record<string, string> = {
    supports: '補強',
    contradicts: '矛盾',
    causes: '原因',
    results_in: '結果',
    similar_to: '類似',
    evolved_to: '進化',
    influenced_by: '影響',
};

export default function MemoryGraphPage() {
    const [graph, setGraph] = useState<GraphData | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, fetch from API
        // const res = await fetch(`/api/memory/graph?userId=${userId}`);
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="animate-pulse text-sm text-muted-foreground">Loading...</div>
            </div>
        );
    }

    if (!graph || graph.nodes.length === 0) {
        return (
            <div className="space-y-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-black tracking-tight">メモリーグラフ</h1>
                    <p className="text-muted-foreground text-sm">
                        あなたの価値観・信念・行動の関係性を可視化します。
                    </p>
                </div>
                <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                        <Share2 className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-black italic">グラフを構築中です</p>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        ナレッジカードが蓄積されると、ここにあなたの知識グラフが表示されます。
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight">メモリーグラフ</h1>
                <p className="text-muted-foreground text-sm">
                    あなたの価値観・信念・行動の関係性マップ。
                    ノードをクリックすると詳細を表示します。
                </p>
            </div>

            {/* Graph visualization (placeholder - real implementation needs D3.js or vis-network) */}
            <Card className="p-8 border border-border/10">
                <div className="text-center text-sm text-muted-foreground">
                    <p className="mb-2">📊 グラフ可視化（実装予定: D3.js / vis-network）</p>
                    <p className="text-xs">
                        現在 {graph.nodes.length} ノード、{graph.edges.length} エッジ
                    </p>
                </div>
            </Card>

            {/* Edge list */}
            <div className="space-y-4">
                <h2 className="font-black text-sm text-muted-foreground uppercase tracking-widest">
                    関係一覧 ({graph.edges.length})
                </h2>
                <div className="grid gap-2 md:grid-cols-2">
                    {graph.edges.map((edge) => {
                        const source = graph.nodes.find((n) => n.id === edge.source);
                        const target = graph.nodes.find((n) => n.id === edge.target);
                        if (!source || !target) return null;

                        return (
                            <motion.div
                                key={edge.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`text-xs px-3 py-2 rounded-lg border ${RELATION_COLORS[edge.relation] || 'border-gray-200 text-gray-600'}`}
                            >
                                <span className="font-bold">{source.title}</span>
                                <span className="mx-1.5 opacity-50">→</span>
                                <span className="font-bold">{target.title}</span>
                                <span className="ml-2 text-[10px] opacity-70">
                                    ({RELATION_LABELS[edge.relation] || edge.relation}, 強度:{' '}
                                    {Math.round(edge.strength * 100)}%)
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
                グラフはAIが自動構築しています。関係性は推定であり、絶対的なものではありません。
            </div>
        </div>
    );
}