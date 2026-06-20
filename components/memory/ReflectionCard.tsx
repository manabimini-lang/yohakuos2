"use client";

import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Share2, Loader2, Check, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { shareReflectionToDiscord } from '@/lib/share/share-reflection';

interface ReflectionCardProps {
    title: string;
    content: string;
    confidence: number;
    createdAt: string;
    type: string;
}

type ShareStatus = 'idle' | 'sharing' | 'success' | 'error';

export function ReflectionCard({ title, content, confidence, createdAt, type }: ReflectionCardProps) {
    const [isPending, startTransition] = useTransition();
    const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');

    const date = new Date(createdAt).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const handleShare = () => {
        setShareStatus('sharing');
        startTransition(async () => {
            try {
                const result = await shareReflectionToDiscord({
                    title,
                    content,
                    createdAt,
                });

                if (result.success) {
                    setShareStatus('success');
                } else {
                    setShareStatus('error');
                }
            } catch {
                setShareStatus('error');
            }

            // 3秒後にリセット
            setTimeout(() => setShareStatus('idle'), 3000);
        });
    };

    const toastMessage =
        shareStatus === 'sharing' ? '共有しています...' :
        shareStatus === 'success' ? 'Discordへ共有しました' :
        shareStatus === 'error' ? '共有できませんでした' :
        null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Card className="p-6 border border-border/10 bg-gradient-to-br from-white to-gray-50/50 relative">
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

                        {/* 共有ボタン */}
                        <button
                            onClick={handleShare}
                            disabled={isPending || shareStatus !== 'idle'}
                            className="shrink-0 p-2 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Discordへ共有する"
                        >
                            {shareStatus === 'sharing' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : shareStatus === 'success' ? (
                                <Check className="h-4 w-4 text-green-600" />
                            ) : shareStatus === 'error' ? (
                                <X className="h-4 w-4 text-red-500" />
                            ) : (
                                <Share2 className="h-4 w-4" />
                            )}
                        </button>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed pl-11">
                        {content}
                    </p>
                </div>

                {/* インラインToast */}
                <AnimatePresence>
                    {toastMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                            className="absolute bottom-3 right-4 rounded-full border border-border bg-[#111111]/95 px-3 py-1.5 text-xs text-white shadow-lg pointer-events-none"
                        >
                            {toastMessage}
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </motion.div>
    );
}