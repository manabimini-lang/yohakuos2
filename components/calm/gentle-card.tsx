// ===================================================
// YOHAKU Calm Infrastructure — Gentle Card Component
// ===================================================
//
// 静かな表示を優先したカードコンポーネント。
// - 低コントラストストレス
// - ミニマルなトランジション
// - 思考の余白を残す
//

interface GentleCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    /** 静かなホバー効果 */
    subtleHover?: boolean;
    /** パディングサイズ */
    padding?: "sm" | "md" | "lg";
}

export function GentleCard({
    children,
    className = "",
    onClick,
    subtleHover = true,
    padding = "md",
}: GentleCardProps) {
    const paddingClasses = {
        sm: "p-3",
        md: "p-5",
        lg: "p-8",
    };

    return (
        <div
            onClick={onClick}
            className={`
                bg-white rounded-lg border border-stone-200
                ${subtleHover ? "hover:border-stone-300 transition-colors duration-500" : ""}
                ${onClick ? "cursor-pointer" : ""}
                ${paddingClasses[padding]}
                ${className}
            `}
        >
            {children}
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: string | number;
    subtitle?: string;
}

export function StatCard({ label, value, subtitle }: StatCardProps) {
    return (
        <GentleCard padding="sm">
            <p className="text-xs text-stone-400 font-light">{label}</p>
            <p className="text-xl font-light text-stone-700 mt-1">{value}</p>
            {subtitle && (
                <p className="text-[10px] text-stone-300 font-light mt-0.5">{subtitle}</p>
            )}
        </GentleCard>
    );
}

interface EmptyStateProps {
    message: string;
    hint?: string;
    icon?: string;
}

export function CalmEmptyState({ message, hint, icon = "·" }: EmptyStateProps) {
    return (
        <GentleCard padding="lg">
            <div className="text-center">
                <p className="text-2xl text-stone-200 mb-2">{icon}</p>
                <p className="text-sm text-stone-400 font-light">{message}</p>
                {hint && (
                    <p className="text-xs text-stone-300 font-light mt-2">{hint}</p>
                )}
            </div>
        </GentleCard>
    );
}

/**
 * 低確度データ用の注意書き
 */
export function LowConfidenceNote({ confidence }: { confidence: number }) {
    if (confidence >= 0.4) return null;

    return (
        <div className="bg-stone-50 rounded px-3 py-2 border border-stone-100 mt-3">
            <p className="text-[11px] text-stone-400 font-light leading-relaxed">
                これはまだ小さな兆しです。あなた自身の感覚が最も大切です。
            </p>
        </div>
    );
}