// ===================================================
// YOHAKU Companion — Ethical Safety Layer
// ===================================================
//
// 重要:
// - 精神分析断定禁止
// - 医療風表現禁止
// - 依存誘導禁止
// - 恐怖マーケティング禁止
// - 過剰最適化禁止
//
// 常に:
// - uncertainty wording
// - confidence-aware responses
// - opt-out capability (user autonomy)
//

import {
    sanitizeMemoryContent,
    sanitizeConfidence,
    validateEthicalContent,
    ensureUncertainty,
    addEthicalDisclaimer,
} from "@/lib/memory/ethics";

// Companion-specific forbidden patterns
const COMPANION_FORBIDDEN_PATTERNS: RegExp[] = [
    // Over-analysis / pseudo-diagnosis
    /あなた(は|の).*(?:傾向|タイプ|性格).*(?:です|だ|ですね)/,
    /(?:アダルトチルドレン|AC|HSP|発達障害|ADHD|ASD|うつ病)/,
    /(?:トラウマ|PTSD|フラッシュバック)/,
    /(?:共依存|カサンドラ|毒親|機能不全家族)/,

    // Fear-based marketing
    /(?:このままだと|気づかないと|放置すると).*(?:危険|大変|後悔|取り返し)/,
    /(?:今すぐ|急がないと|遅れる前に)/,

    // Dependency inducement
    /(?:私(だけ|がいないと)|私に(任せて|相談して)|毎日(報告|連絡)(して|ください))/,
    /(?:あなたのためを思って|私を(信じて|頼って))$/,

    // Over-optimization pressure
    /(?:生産性|効率|最適化).*(?:上げる|高める|改善).*(?:べき|なさい|しないと)/,
    /(?:無駄|ロス|時間の無駄)/,

    // Over-confident analysis
    /(?:間違いなく|絶対に|必ず|確実に|100%|完全に)/,
    /分析(?:しました|します|できました)/,
    /(?:診断|判定|特定)(?:しました|します)/,
];

const COMPANION_UNCERTAINTY_PREFIXES = [
    "感じるのですが、",
    "もしかすると、",
    "一つの見方として、",
    "ご自身の感覚が最も大切ですが、",
    "よかったら考えてみてください。",
    "少し違う角度から見ると、",
];

const COMPANION_DISCLAIMERS = [
    "これはあくまで一つの視点です。",
    "あなた自身の解釈が最も大切です。",
    "違和感があれば、それがあなたの感覚です。",
    "参考程度に、気が向いたら考えてみてください。",
    "この考えに縛られる必要はありません。",
];

/**
 * Validate companion response against ethical rules.
 * Returns sanitized response.
 */
export function validateCompanionResponse(response: string): string {
    let sanitized = response;

    // 1. Remove companion-specific forbidden patterns
    for (const pattern of COMPANION_FORBIDDEN_PATTERNS) {
        sanitized = sanitized.replace(pattern, (match) => {
            // Replace with a safe alternative
            return match.replace(/^(.*)$/, "※");
        });
    }

    // 2. Apply general memory ethical sanitization
    sanitized = sanitizeMemoryContent(sanitized);

    // 3. Ensure companion-appropriate uncertainty tone
    sanitized = ensureCompanionUncertainty(sanitized);

    // 4. Add subtle disclaimer if needed
    sanitized = addCompanionDisclaimer(sanitized);

    // 5. Remove excessive markdown/formatting (keep it simple)
    sanitized = sanitized.replace(/```[\s\S]*?```/g, "").trim();

    return sanitized;
}

function ensureCompanionUncertainty(content: string): string {
    // Don't modify if already has uncertainty markers
    const hasUncertainty = COMPANION_UNCERTAINTY_PREFIXES.some((p) =>
        content.includes(p)
    );
    if (hasUncertainty) return content;

    // If content is a question, it's naturally uncertain - no change needed
    if (content.trim().endsWith("？") || content.trim().endsWith("?")) {
        return content;
    }

    // If content has declarative patterns, add uncertainty
    const declarativePatterns = [
        /です$/m,
        /ます$/m,
        /ました$/m,
        /でしょう$/m,
    ];

    const isDeclarative = declarativePatterns.some((p) => p.test(content));
    if (isDeclarative && content.length > 30) {
        const prefix =
            COMPANION_UNCERTAINTY_PREFIXES[
            Math.floor(Math.random() * COMPANION_UNCERTAINTY_PREFIXES.length)
            ];
        return prefix + " " + content.charAt(0).toLowerCase() + content.slice(1);
    }

    return content;
}

function addCompanionDisclaimer(content: string): string {
    const hasDisclaimer = COMPANION_DISCLAIMERS.some((d) => content.includes(d));
    if (!hasDisclaimer && content.length > 0) {
        const disclaimer =
            COMPANION_DISCLAIMERS[
            Math.floor(Math.random() * COMPANION_DISCLAIMERS.length)
            ];
        // Don't add to very short responses (like "そうですね")
        if (content.length > 20) {
            content += "\n\n" + disclaimer;
        }
    }
    return content;
}

/**
 * Check if a response would be too directive.
 * Returns true if the response is likely over-guiding.
 */
export function isOverGuiding(response: string): boolean {
    const directivePatterns = [
        /(?:すべき|した方がいい|しないと|するべき|やるべき)/,
        /(?:やってみて|試してみて|考えてみて|実行してみて)/,
        /(?:おすすめ|推奨|提案します)/,
        /(?:絶対|必ず|間違いなく)/,
        /(?:なぜ|どうして).*(?:しない|やらない|できない)/,
    ];

    let matchCount = 0;
    for (const pattern of directivePatterns) {
        if (pattern.test(response)) {
            matchCount++;
        }
    }

    // More than 2 directive patterns = over-guiding
    return matchCount >= 2;
}

/**
 * Confidence-aware: adjust AI confidence based on available context.
 * Less context = lower confidence = more silence/uncertainty.
 */
export function calculateCompanionConfidence(
    themeCount: number,
    memoryCount: number,
    reflectionCount: number
): number {
    let confidence = 0.5; // base

    // Boost from available data
    confidence += Math.min(themeCount * 0.1, 0.2); // up to +0.2 from themes
    confidence += Math.min(memoryCount * 0.02, 0.15); // up to +0.15 from memories
    confidence += Math.min(reflectionCount * 0.05, 0.15); // up to +0.15 from reflections

    return sanitizeConfidence(confidence);
}

export {
    sanitizeMemoryContent,
    sanitizeConfidence,
    validateEthicalContent,
    ensureUncertainty,
    addEthicalDisclaimer,
};