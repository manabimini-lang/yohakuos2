import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface ValueCardProps {
    title: string;
    content: string;
    confidence: number;
    category?: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
    growth: '成長',
    connection: '繋がり',
    stability: '安定',
    contribution: '貢献',
    freedom: '自由',
};

export function ValueCard({ title, content, confidence, category }: ValueCardProps) {
    const confidencePercent = Math.round(confidence * 100);
    const barColor =
        confidencePercent >= 80 ? 'bg-emerald-500' :
            confidencePercent >= 60 ? 'bg-blue-500' :
                confidencePercent >= 40 ? 'bg-amber-500' :
                    'bg-gray-400';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="p-5 border border-border/20 hover:border-border/40 transition-colors">
                <div className="space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <h3 className="font-black text-lg tracking-tight">{title}</h3>
                            {category && (
                                <span className="inline-block text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    {CATEGORY_LABELS[category] || category}
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-bold text-muted-foreground shrink-0 ml-4">
                            確度 {confidencePercent}%
                        </span>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {content}
                    </p>

                    {/* Confidence bar */}
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full ${barColor} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${confidencePercent}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}