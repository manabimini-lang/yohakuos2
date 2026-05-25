'use client';
import { getConfidenceLabel, getLowConfidenceDisclaimer } from "@/lib/calm";

interface ConfidenceBadgeProps {
    confidence: number;
    showLabel?: boolean;
    showDisclaimer?: boolean;
    size?: "sm" | "md";
}

export function ConfidenceBadge({
    confidence,
    showLabel = true,
    showDisclaimer = false,
    size = "sm",
}: ConfidenceBadgeProps) {
    const { label, description, level } = getConfidenceLabel(confidence);
    const disclaimer = showDisclaimer ? getLowConfidenceDisclaimer(confidence) : null;

    const colors = {
        low: "bg-stone-50 text-stone-400 border-stone-200",
        medium: "bg-stone-100 text-stone-500 border-stone-200",
        high: "bg-stone-100 text-stone-600 border-stone-200",
        very_high: "bg-stone-200 text-stone-700 border-stone-300",
    };

    const sizeClasses = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";

    return (
        <div className="inline-flex flex-col">
            <span
                className={`${sizeClasses} rounded border ${colors[level]} font-light inline-flex items-center gap-1`}
                title={description}
            >
                {level === "low" && <span className="text-stone-300">·</span>}
                {level === "medium" && <span className="text-stone-400">··</span>}
                {level === "high" && <span className="text-stone-500">···</span>}
                {level === "very_high" && <span className="text-stone-600">····</span>}
                {showLabel && label}
            </span>
            {disclaimer && (
                <span className="text-[10px] text-stone-300 font-light mt-0.5 italic">
                    {disclaimer}
                </span>
            )}
        </div>
    );
}