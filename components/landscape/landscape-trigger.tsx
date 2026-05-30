"use client";

import { useState } from "react";
import { enqueueLandscapeGenerationAction } from "@/app/actions/landscape-actions";

interface LandscapeTriggerProps {
    hasLandscape: boolean;
    hasPendingJob: boolean;
    itemCount: number;
}

export default function LandscapeTrigger({
    hasLandscape,
    hasPendingJob,
    itemCount,
}: LandscapeTriggerProps) {
    const [pending, setPending] = useState(false);
    const [queued, setQueued] = useState(hasPendingJob);
    const [message, setMessage] = useState<string | null>(null);

    const MIN_ITEMS = 5;
    const hasEnoughData = itemCount >= MIN_ITEMS;

    async function handleRequest() {
        if (!hasEnoughData || pending || queued) return;
        setPending(true);
        setMessage(null);

        try {
            const result = await enqueueLandscapeGenerationAction();
            if (result.success) {
                setQueued(true);
                setMessage("夜のうちに静かに生成されます。");
            } else {
                setMessage(result.error ?? "しばらくしてからもう一度お試しください。");
            }
        } finally {
            setPending(false);
        }
    }

    if (queued) {
        return (
            <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-pulse" />
                <p className="text-xs text-stone-400 font-light">
                    {message ?? "生成をリクエストしました。しばらくお待ちください。"}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4 py-6">
            {!hasLandscape && (
                <p className="text-xs text-stone-400 font-light text-center max-w-xs leading-relaxed">
                    {hasEnoughData
                        ? "内面の風景はまだ生成されていません。"
                        : `記録が ${MIN_ITEMS} 件を超えると生成できます。（現在 ${itemCount} 件）`}
                </p>
            )}

            {hasLandscape && (
                <p className="text-xs text-stone-400 font-light text-center max-w-xs leading-relaxed">
                    新しい風景を求めるときは、そっとリクエストできます。
                </p>
            )}

            {hasEnoughData && (
                <button
                    onClick={handleRequest}
                    disabled={pending}
                    className="
                        px-4 py-1.5 text-xs font-light
                        text-stone-500 border border-stone-200
                        rounded-full transition-all duration-300
                        hover:border-stone-400 hover:text-stone-700
                        disabled:opacity-40 disabled:cursor-not-allowed
                        focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-400
                    "
                >
                    {pending ? "…" : hasLandscape ? "もう一度生成する" : "風景を生成する"}
                </button>
            )}

            {message && (
                <p className="text-xs text-stone-400 font-light">{message}</p>
            )}
        </div>
    );
}
