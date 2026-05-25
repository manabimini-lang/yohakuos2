// Ethical Guardrails for AI Memory Extraction
// 過剰断定・精神診断・恐怖誘導・依存設計を防止

const FORBIDDEN_PATTERNS: RegExp[] = [
    /あなたは.*(?:障害|症候群|病|疾患)/,
    /(?:診断|判定)します/,
    /あなたは.*(?:べき|なければならない|しないと)/,
    /(?:危険|警告|注意喚起)/,
    /(?:依存|中毒|アディクション)/,
    /あなたは.*(?:傾向がある|タイプだ|人間だ)/,
    /(?:絶対に|必ず|間違いなく)/,
];

const UNCERTAINTY_PREFIXES = [
    '傾向として、',
    '可能性として、',
    'のように見えます',
    'かもしれません',
    'というパターンがあります',
];

const RECOMMENDED_SUFFIXES = [
    'これは一つの見方です。',
    'あくまで参考情報です。',
    'あなた自身の解釈が最も重要です。',
];

export function validateEthicalContent(content: string): { valid: boolean; reason?: string } {
    for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
            return {
                valid: false,
                reason: `禁止パターンに一致: ${pattern}`,
            };
        }
    }
    return { valid: true };
}

export function ensureUncertainty(content: string): string {
    // Check if content already has uncertainty expression
    const hasUncertainty = UNCERTAINTY_PREFIXES.some((p) => content.includes(p));
    if (!hasUncertainty) {
        // Prepend uncertainty prefix if content is declarative
        const prefix = UNCERTAINTY_PREFIXES[Math.floor(Math.random() * UNCERTAINTY_PREFIXES.length)];
        content = prefix + content.charAt(0).toLowerCase() + content.slice(1);
    }
    return content;
}

export function addEthicalDisclaimer(content: string): string {
    // Add a subtle disclaimer if not present
    const hasDisclaimer = RECOMMENDED_SUFFIXES.some((s) => content.includes(s));
    if (!hasDisclaimer) {
        content += ' ' + RECOMMENDED_SUFFIXES[0];
    }
    return content;
}

export function sanitizeMemoryContent(content: string): string {
    let sanitized = content;

    // Remove forbidden patterns
    for (const pattern of FORBIDDEN_PATTERNS) {
        sanitized = sanitized.replace(pattern, '');
    }

    // Ensure uncertainty
    sanitized = ensureUncertainty(sanitized);

    // Add disclaimer
    sanitized = addEthicalDisclaimer(sanitized);

    return sanitized.trim();
}

// Confidence should never be 1.0 (absolute certainty is toxic)
export function sanitizeConfidence(confidence: number): number {
    if (confidence >= 1.0) return 0.95;
    if (confidence <= 0.0) return 0.05;
    return Math.round(confidence * 100) / 100;
}