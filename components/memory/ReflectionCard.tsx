import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface ReflectionCardProps {
    title: string;
    content: string;
    confidence: number;
    createdAt: string;
    type: string;
}

export function ReflectionCard({ title, content, confidence, createdAt, type }: ReflectionCardProps) {
    const date = new Date(createdAt).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Card className="p-6 border border-border/10 bg-gradient-to-br from-white to-gray-50/50">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <div className="space-y-1 flex-1">
                            <h3 className="font-bold text-base">{title}</h3>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <span>{date}</span>
                                <span>·</span>
                                <span>確度 {Math.round(confidence * 100)}%</span>
                                <span>·</span>
                                <span className="capitalize">{type}</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed pl-11">
                        {content}
                    </p>
                </div>
            </Card>
        </motion.div>
    );
}